-- Keep reservation details visible to their owner after a flight is withdrawn
-- or its departure has passed. Flight discovery remains limited to future,
-- published flights for everyone else.
drop policy if exists flights_select_own_bookings on public.flights;
create policy flights_select_own_bookings on public.flights
for select to authenticated
using (
  exists (
    select 1 from public.bookings b
    where b.flight_id = flights.id
      and b.passenger_id = (select auth.uid())
  )
);

drop policy if exists flight_seats_select_own_bookings on public.flight_seats;
create policy flight_seats_select_own_bookings on public.flight_seats
for select to authenticated
using (
  exists (
    select 1
    from public.booking_passengers bp
    join public.bookings b on b.id = bp.booking_id
    where bp.seat_id = flight_seats.id
      and b.passenger_id = (select auth.uid())
  )
);

select pg_notify('pgrst', 'reload schema');
