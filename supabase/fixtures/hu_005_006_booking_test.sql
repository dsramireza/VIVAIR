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
  ('1A', 'Plus'), ('1B', 'Plus'), ('1C', 'Plus'), ('1D', 'Plus'),
  ('2A', 'Plus'), ('2B', 'Plus'), ('2C', 'Plus'), ('2D', 'Plus'),
  ('3A', 'Estándar'), ('3B', 'Estándar'), ('3C', 'Estándar'), ('3D', 'Estándar'),
  ('4A', 'Estándar'), ('4B', 'Estándar'), ('4C', 'Estándar'), ('4D', 'Estándar'),
  ('5A', 'Estándar'), ('5B', 'Estándar'), ('5C', 'Estándar'), ('5D', 'Estándar')
) as row_data(label, category)
on conflict (flight_id, label) do update set category = excluded.category;

-- The fixture intentionally does not create users or bookings. Tests create and remove
-- their own rows through the isolated test project's service role cleanup.
select pg_notify('pgrst', 'reload schema');
