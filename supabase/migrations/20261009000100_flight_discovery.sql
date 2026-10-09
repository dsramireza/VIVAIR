create table public.flights (
  id uuid primary key default gen_random_uuid(),
  origin text not null check (origin in ('Bogotá', 'Medellín', 'Cali', 'Cartagena', 'Barranquilla')),
  destination text not null check (destination in ('Bogotá', 'Medellín', 'Cali', 'Cartagena', 'Barranquilla')),
  departure_at timestamptz not null,
  base_fare numeric(12,2) not null check (base_fare > 0),
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Withdrawn')),
  constraint different_cities check (origin <> destination)
);
alter table public.flights enable row level security;
revoke all on public.flights from anon, authenticated;
grant select on public.flights to anon, authenticated;
create policy flights_discovery on public.flights for select to anon, authenticated
using (status = 'Published' and departure_at > now());
create index flights_search on public.flights (origin, destination, departure_at) where status = 'Published';
