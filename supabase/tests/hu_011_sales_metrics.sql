-- Run only on the Supabase test project. This transaction leaves no data behind.
begin;
do $$
declare
  admin_id uuid;
  passenger_id uuid;
  v_flight_id uuid;
  first_booking uuid;
  second_booking uuid;
  cancelled_booking uuid;
  before_totals record;
  after_totals record;
begin
  select id into admin_id from public.profiles where role = 'Administrator' limit 1;
  select id into passenger_id from public.profiles where role = 'Passenger' limit 1;
  if admin_id is null or passenger_id is null then raise exception 'test_accounts_required'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  select * into before_totals from public.admin_sales_summary();

  insert into public.flights (origin, destination, departure_at, base_fare, status)
  values ('Bogotá', 'Cali', clock_timestamp() + interval '30 days', 200000, 'Published')
  returning id into v_flight_id;
  insert into public.flight_seats (flight_id, label, category)
  values (v_flight_id, '1A', 'Plus'), (v_flight_id, '1B', 'Plus'),
         (v_flight_id, '3A', 'Estándar'), (v_flight_id, '3B', 'Estándar');

  insert into public.bookings (code, passenger_id, flight_id, total, status)
  values ('VA-MET-' || left(replace(gen_random_uuid()::text, '-', ''), 8), passenger_id, v_flight_id, 450000, 'Confirmed')
  returning id into first_booking;
  insert into public.bookings (code, passenger_id, flight_id, total, status)
  values ('VA-MET-' || left(replace(gen_random_uuid()::text, '-', ''), 8), passenger_id, v_flight_id, 200000, 'Confirmed')
  returning id into second_booking;
  insert into public.bookings (code, passenger_id, flight_id, total, status)
  values ('VA-MET-' || left(replace(gen_random_uuid()::text, '-', ''), 8), passenger_id, v_flight_id, 100000, 'Cancelled')
  returning id into cancelled_booking;

  insert into public.booking_passengers (booking_id, seat_id, name, document_type, document_number)
  select first_booking, id, 'Pasajero Uno', 'CC', '100000001' from public.flight_seats where flight_id = v_flight_id and label = '1A';
  insert into public.booking_passengers (booking_id, seat_id, name, document_type, document_number)
  select first_booking, id, 'Pasajero Dos', 'CC', '100000002' from public.flight_seats where flight_id = v_flight_id and label = '3A';
  insert into public.booking_passengers (booking_id, seat_id, name, document_type, document_number)
  select second_booking, id, 'Pasajero Tres', 'CC', '100000003' from public.flight_seats where flight_id = v_flight_id and label = '3B';
  insert into public.booking_passengers (booking_id, seat_id, name, document_type, document_number)
  select cancelled_booking, id, 'Pasajero Cuatro', 'CC', '100000004' from public.flight_seats where flight_id = v_flight_id and label = '1B';

  select * into after_totals from public.admin_sales_summary();
  if after_totals.confirmed_bookings - before_totals.confirmed_bookings <> 2
    or after_totals.confirmed_passengers - before_totals.confirmed_passengers <> 3
    or after_totals.sales_cop - before_totals.sales_cop <> 650000 then
    raise exception 'incorrect_sales_totals';
  end if;

  perform set_config('request.jwt.claim.sub', passenger_id::text, true);
  begin
    perform * from public.admin_sales_summary();
    raise exception 'passenger_received_sales';
  exception when others then
    if sqlerrm = 'passenger_received_sales' then raise; end if;
    if sqlerrm <> 'admin_required' then raise; end if;
  end;
end $$;
rollback;
