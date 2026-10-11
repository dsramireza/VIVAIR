-- HU-005/HU-006 isolated test fixture.
-- Run only against the local/test Supabase database, never production or demo.
with test_flight as (
  insert into public.flights (id, origin, destination, departure_at, base_fare, status)
  values ('00000000-0000-0000-0000-000000000005', 'Bogotá', 'Medellín', now() + interval '90 days', 200000, 'Published')
  on conflict (id) do update set
    origin = excluded.origin,
    destination = excluded.destination,
    departure_at = excluded.departure_at,
    base_fare = excluded.base_fare,
    status = excluded.status
  returning id
)
insert into public.flight_seats (flight_id, label, category)
select
  '00000000-0000-0000-0000-000000000005'::uuid,
  row_data.label,
  row_data.category::public.seat_category
from (values
  ('1A', 'Estándar'), ('1B', 'Plus'), ('1C', 'Estándar'), ('1D', 'Plus'), ('1E', 'Estándar'),
  ('2A', 'Estándar'), ('2B', 'Plus'), ('2C', 'Estándar'), ('2D', 'Plus'), ('2E', 'Estándar'),
  ('3A', 'Plus'), ('3B', 'Estándar'), ('3C', 'Estándar'), ('3D', 'Plus'), ('3E', 'Estándar'),
  ('4A', 'Estándar'), ('4B', 'Plus'), ('4C', 'Estándar'), ('4D', 'Plus'), ('4E', 'Estándar')
) as row_data(label, category)
on conflict (flight_id, label) do update set category = excluded.category;

-- The fixture intentionally does not create users or bookings. Tests create and remove
-- their own rows through the isolated test project's service role cleanup.
select pg_notify('pgrst', 'reload schema');
