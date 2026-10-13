-- A cancelled booking keeps the itinerary visible at the instant of cancellation.
alter table public.bookings
  add column cancelled_origin text,
  add column cancelled_destination text,
  add column cancelled_departure_at timestamptz;

-- Existing cancelled bookings predate itinerary snapshots. Capture the best
-- available value once so later edits cannot change their displayed trip.
update public.bookings b
set cancelled_origin = f.origin,
    cancelled_destination = f.destination,
    cancelled_departure_at = f.departure_at
from public.flights f
where b.flight_id = f.id and b.status = 'Cancelled';

create table public.flight_change_notices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  passenger_id uuid not null references auth.users(id),
  old_origin text not null,
  old_destination text not null,
  old_departure_at timestamptz not null,
  new_origin text not null,
  new_destination text not null,
  new_departure_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index flight_change_notices_passenger_idx
  on public.flight_change_notices (passenger_id, created_at desc);
alter table public.flight_change_notices enable row level security;
revoke all on public.flight_change_notices from anon, authenticated;
grant select on public.flight_change_notices to authenticated;
create policy flight_change_notices_select_own on public.flight_change_notices
for select to authenticated using (passenger_id = (select auth.uid()));

-- Flight and booking locks always follow the same order as cancellation. A
-- concurrent cancellation cannot create a notice for an already cancelled trip.
create function public.admin_update_flight(
  p_flight_id uuid, p_origin text, p_destination text,
  p_departure_at timestamptz, p_base_fare numeric
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  flight public.flights;
  affected integer := 0;
  route_or_schedule_changed boolean;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'Administrator'
  ) then raise exception 'admin_required'; end if;

  select f.* into flight from public.flights f where f.id = p_flight_id for update;
  if flight.id is null then raise exception 'flight_not_found'; end if;
  if flight.departure_at <= clock_timestamp() or p_departure_at is null
    or p_departure_at <= clock_timestamp() then raise exception 'departure_must_be_future'; end if;
  if p_origin is null or p_destination is null
    or p_origin not in ('Bogotá','Medellín','Cali','Cartagena','Barranquilla')
    or p_destination not in ('Bogotá','Medellín','Cali','Cartagena','Barranquilla')
    then raise exception 'catalog_city_required'; end if;
  if p_origin = p_destination then raise exception 'different_cities_required'; end if;
  if p_base_fare is null or p_base_fare <= 0 then raise exception 'positive_fare_required'; end if;

  route_or_schedule_changed := (flight.origin, flight.destination, flight.departure_at)
    is distinct from (p_origin, p_destination, p_departure_at);

  if route_or_schedule_changed then
    insert into public.flight_change_notices (
      booking_id, passenger_id, old_origin, old_destination, old_departure_at,
      new_origin, new_destination, new_departure_at
    )
    select b.id, b.passenger_id, flight.origin, flight.destination, flight.departure_at,
      p_origin, p_destination, p_departure_at
    from public.bookings b
    where b.flight_id = flight.id and b.status = 'Confirmed';
    get diagnostics affected = row_count;
  end if;

  update public.flights
  set origin = p_origin, destination = p_destination,
      departure_at = p_departure_at, base_fare = p_base_fare
  where id = flight.id;
  return affected;
end;
$$;
revoke all on function public.admin_update_flight(uuid, text, text, timestamptz, numeric) from public, anon;
grant execute on function public.admin_update_flight(uuid, text, text, timestamptz, numeric) to authenticated;

create or replace function public.cancel_booking(p_booking_id uuid)
returns table (booking_id uuid, booking_status public.booking_status, released_seats integer)
language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings;
  flight public.flights;
  flight_id uuid;
  released integer;
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  select b.flight_id into flight_id from public.bookings b
  where b.id = p_booking_id and b.passenger_id = caller_id;
  if flight_id is null then raise exception 'booking_not_found'; end if;

  select f.* into flight from public.flights f where f.id = flight_id for share;
  select b.* into booking from public.bookings b
  where b.id = p_booking_id and b.passenger_id = caller_id for update;
  if booking.id is null then raise exception 'booking_not_found'; end if;
  if booking.status <> 'Confirmed' then raise exception 'booking_not_confirmed'; end if;
  if flight.departure_at <= clock_timestamp() then raise exception 'departure_already_reached'; end if;

  select count(*)::integer into released from public.booking_passengers bp
  where bp.booking_id = booking.id;
  update public.bookings
  set status = 'Cancelled', cancelled_origin = flight.origin,
      cancelled_destination = flight.destination,
      cancelled_departure_at = flight.departure_at
  where id = booking.id;
  return query select booking.id, 'Cancelled'::public.booking_status, released;
end;
$$;
revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;
select pg_notify('pgrst', 'reload schema');
