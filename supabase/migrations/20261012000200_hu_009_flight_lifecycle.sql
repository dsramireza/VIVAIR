-- Administrative flight lifecycle. All mutations are atomic and recheck the
-- administrator role in the database, independent of the web interface.
create policy flights_admin_select on public.flights
for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'Administrator'
));

-- Serialize booking creation with withdrawal and publication changes.
create or replace function public.enforce_bookable_flight()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  bookable boolean;
begin
  select f.status = 'Published' and f.departure_at > clock_timestamp()
  into bookable
  from public.flights f where f.id = new.flight_id for share;
  if coalesce(bookable, false) = false then raise exception 'flight_unavailable'; end if;
  return new;
end;
$$;
create trigger bookings_bookable_flight
before insert on public.bookings
for each row execute function public.enforce_bookable_flight();
revoke all on function public.enforce_bookable_flight() from public, anon, authenticated;

create or replace function public.admin_create_flight(
  p_origin text, p_destination text, p_departure_at timestamptz, p_base_fare numeric
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'Administrator') then
    raise exception 'admin_required';
  end if;
  if p_origin is null or p_destination is null or p_origin not in ('Bogotá','Medellín','Cali','Cartagena','Barranquilla')
    or p_destination not in ('Bogotá','Medellín','Cali','Cartagena','Barranquilla') then
    raise exception 'catalog_city_required';
  end if;
  if p_origin = p_destination then raise exception 'different_cities_required'; end if;
  if p_departure_at is null then raise exception 'departure_required'; end if;
  if p_base_fare is null or p_base_fare <= 0 then raise exception 'positive_fare_required'; end if;

  insert into public.flights (origin, destination, departure_at, base_fare, status)
  values (p_origin, p_destination, p_departure_at, p_base_fare, 'Draft')
  returning id into new_id;

  insert into public.flight_seats (flight_id, label, category)
  select new_id, row_number::text || seat_letter,
    case when row_number <= 2 then 'Plus'::public.seat_category else 'Estándar'::public.seat_category end
  from generate_series(1, 5) as rows(row_number)
  cross join unnest(array['A', 'B', 'C', 'D']) as letters(seat_letter);

  return new_id;
end;
$$;

create or replace function public.admin_set_flight_status(p_flight_id uuid, p_status text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  flight public.flights;
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'Administrator') then
    raise exception 'admin_required';
  end if;
  select f.* into flight from public.flights f where f.id = p_flight_id for update;
  if flight.id is null then raise exception 'flight_not_found'; end if;

  if p_status = 'Published' then
    if flight.status not in ('Draft', 'Withdrawn') then raise exception 'invalid_flight_transition'; end if;
    if flight.departure_at <= clock_timestamp() then raise exception 'departure_must_be_future'; end if;
    if flight.origin = flight.destination then raise exception 'different_cities_required'; end if;
    if flight.base_fare <= 0 then raise exception 'positive_fare_required'; end if;
    if (select count(*) from public.flight_seats fs where fs.flight_id = p_flight_id) <> 20 then
      raise exception 'seat_map_incomplete';
    end if;
  elsif p_status = 'Withdrawn' then
    if flight.status <> 'Published' then raise exception 'invalid_flight_transition'; end if;
  else
    raise exception 'invalid_flight_transition';
  end if;

  update public.flights set status = p_status where id = p_flight_id;
  return p_status;
end;
$$;

create or replace function public.admin_delete_flight(p_flight_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  flight_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'Administrator') then
    raise exception 'admin_required';
  end if;
  select id into flight_id from public.flights where id = p_flight_id for update;
  if flight_id is null then raise exception 'flight_not_found'; end if;
  if exists (select 1 from public.bookings b where b.flight_id = p_flight_id) then
    raise exception 'flight_has_booking_history';
  end if;
  delete from public.flights where id = p_flight_id;
  return true;
end;
$$;

revoke all on function public.admin_create_flight(text, text, timestamptz, numeric) from public, anon;
revoke all on function public.admin_set_flight_status(uuid, text) from public, anon;
revoke all on function public.admin_delete_flight(uuid) from public, anon;
grant execute on function public.admin_create_flight(text, text, timestamptz, numeric) to authenticated;
grant execute on function public.admin_set_flight_status(uuid, text) to authenticated;
grant execute on function public.admin_delete_flight(uuid) to authenticated;
select pg_notify('pgrst', 'reload schema');
