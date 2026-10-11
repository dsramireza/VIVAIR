do $$ begin
  create type public.seat_category as enum ('Estándar', 'Plus');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_status as enum ('Confirmed', 'Cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_result as enum ('Approved', 'Rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.flight_seats (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references public.flights(id) on delete cascade,
  label text not null,
  category public.seat_category not null,
  unique (flight_id, label)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  passenger_id uuid not null references auth.users(id),
  flight_id uuid not null references public.flights(id),
  total numeric(12,2) not null check (total > 0),
  status public.booking_status not null default 'Confirmed',
  created_at timestamptz not null default now()
);

create table if not exists public.booking_passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  seat_id uuid not null references public.flight_seats(id),
  name text not null check (char_length(name) between 2 and 100),
  document_type text not null check (document_type in ('CC', 'CE', 'Pasaporte')),
  document_number text not null check (char_length(document_number) between 3 and 30),
  unique (booking_id, seat_id)
);

create index if not exists flight_seats_flight_id_idx on public.flight_seats (flight_id);
create index if not exists booking_passengers_seat_id_idx on public.booking_passengers (seat_id);

alter table public.flight_seats enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_passengers enable row level security;
revoke all on public.flight_seats, public.bookings, public.booking_passengers from anon, authenticated;
grant select on public.flight_seats to authenticated;
grant select on public.bookings, public.booking_passengers to authenticated;

drop policy if exists flight_seats_select on public.flight_seats;
create policy flight_seats_select on public.flight_seats for select to authenticated
using (exists (select 1 from public.flights f where f.id = flight_id and f.status = 'Published' and f.departure_at > now()));

drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings for select to authenticated
using (passenger_id = (select auth.uid()));

drop policy if exists booking_passengers_select_own on public.booking_passengers;
create policy booking_passengers_select_own on public.booking_passengers for select to authenticated
using (exists (select 1 from public.bookings b where b.id = booking_id and b.passenger_id = (select auth.uid())));

create or replace function public.get_flight_seat_status(p_flight_id uuid)
returns table (id uuid, label text, category public.seat_category, occupied boolean)
language sql stable security definer set search_path = ''
as $$
  select fs.id, fs.label, fs.category,
    exists (
      select 1 from public.booking_passengers bp
      join public.bookings b on b.id = bp.booking_id
      where bp.seat_id = fs.id and b.status = 'Confirmed'
    ) as occupied
  from public.flight_seats fs
  join public.flights f on f.id = fs.flight_id
  where fs.flight_id = p_flight_id and f.status = 'Published' and f.departure_at > now()
  order by fs.label
$$;
revoke all on function public.get_flight_seat_status(uuid) from public;
grant execute on function public.get_flight_seat_status(uuid) to authenticated;

create or replace function public.create_mock_booking(p_flight_id uuid, p_passengers jsonb, p_payment public.payment_result)
returns table (booking_id uuid, booking_code text, total numeric)
language plpgsql security definer set search_path = ''
as $$
declare
  b_id uuid;
  b_code text;
  passenger jsonb;
  locked_seat public.flight_seats;
  base numeric;
  computed numeric := 0;
  passenger_count integer;
begin
  if (select auth.uid()) is null then raise exception 'not_authenticated'; end if;
  if p_payment <> 'Approved' then return; end if;
  select count(*) into passenger_count from jsonb_array_elements(p_passengers);
  if passenger_count < 1 or passenger_count > 4 then raise exception 'booking_passenger_limit'; end if;
  select f.base_fare into base from public.flights f
  where f.id = p_flight_id and f.status = 'Published' and f.departure_at > now();
  if base is null then raise exception 'flight_unavailable'; end if;

  for passenger in select * from jsonb_array_elements(p_passengers) loop
    select fs.* into locked_seat from public.flight_seats fs
    where fs.flight_id = p_flight_id and fs.label = passenger ->> 'seat_label'
    for update;
    if locked_seat.id is null then raise exception 'seat_unavailable:%', passenger ->> 'seat_label'; end if;
    if exists (
      select 1 from public.booking_passengers bp
      join public.bookings b on b.id = bp.booking_id
      where bp.seat_id = locked_seat.id and b.status = 'Confirmed'
    ) then raise exception 'seat_unavailable:%', locked_seat.label; end if;
    if coalesce(length(passenger ->> 'name'), 0) < 2
      or coalesce(length(passenger ->> 'document_type'), 0) = 0
      or coalesce(length(passenger ->> 'document_number'), 0) < 3 then
      raise exception 'identity_required:%', locked_seat.label;
    end if;
    computed := computed + base + case when locked_seat.category = 'Plus' then 50000 else 0 end;
  end loop;

  b_code := 'VA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.bookings (code, passenger_id, flight_id, total, status)
  values (b_code, (select auth.uid()), p_flight_id, computed, 'Confirmed') returning id into b_id;
  for passenger in select * from jsonb_array_elements(p_passengers) loop
    select fs.* into locked_seat from public.flight_seats fs
    where fs.flight_id = p_flight_id and fs.label = passenger ->> 'seat_label';
    insert into public.booking_passengers (booking_id, seat_id, name, document_type, document_number)
    values (b_id, locked_seat.id, passenger ->> 'name', passenger ->> 'document_type', passenger ->> 'document_number');
  end loop;
  return query select b_id, b_code, computed;
end;
$$;
revoke all on function public.create_mock_booking(uuid, jsonb, public.payment_result) from public;
grant execute on function public.create_mock_booking(uuid, jsonb, public.payment_result) to authenticated;

comment on function public.create_mock_booking(uuid, jsonb, public.payment_result) is 'Atomic approved mock booking; row locks prevent double sales and any failure rolls back the group.';
comment on function public.get_flight_seat_status(uuid) is 'Returns the fixed seat map with occupied state for the published flight.';

-- The fixed 20-seat catalog is intentionally seeded by the environment fixture, not by this migration.
-- This keeps production/demo data out of versioned schema changes while preserving reproducibility of the model.

select pg_notify('pgrst', 'reload schema');
