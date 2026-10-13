-- Run only on Supabase test. All rows and notices are rolled back.
begin;
do $$ <<hu_010_flight_changes>>
declare
  admin_id uuid;
  passenger_id uuid;
  flight_id uuid;
  confirmed_id uuid;
  cancelled_id uuid;
  original_departure timestamptz := clock_timestamp() + interval '20 days';
  changed_departure timestamptz := clock_timestamp() + interval '21 days';
  notice_count integer;
  affected integer;
begin
  select id into admin_id from public.profiles where role = 'Administrator' limit 1;
  select id into passenger_id from public.profiles where role = 'Passenger' limit 1;
  if admin_id is null or passenger_id is null then raise exception 'test_accounts_required'; end if;
  insert into public.flights (origin, destination, departure_at, base_fare, status)
  values ('Bogotá', 'Medellín', original_departure, 200000, 'Published')
  returning id into flight_id;
  insert into public.flight_seats (flight_id, label, category)
  values (flight_id, '1A', 'Plus'), (flight_id, '3A', 'Estándar');
  insert into public.bookings (code, passenger_id, flight_id, total, status)
  values ('VA-CHG-' || left(replace(gen_random_uuid()::text, '-', ''), 8), passenger_id, flight_id, 250000, 'Confirmed')
  returning id into confirmed_id;
  insert into public.bookings (code, passenger_id, flight_id, total, status)
  values ('VA-CHG-' || left(replace(gen_random_uuid()::text, '-', ''), 8), passenger_id, flight_id, 200000, 'Confirmed')
  returning id into cancelled_id;
  insert into public.booking_passengers (booking_id, seat_id, name, document_type, document_number)
  select confirmed_id, fs.id, 'Pasajero Confirmado', 'CC', '100000001' from public.flight_seats fs
  where fs.flight_id = hu_010_flight_changes.flight_id and fs.label = '1A';
  insert into public.booking_passengers (booking_id, seat_id, name, document_type, document_number)
  select cancelled_id, fs.id, 'Pasajero Cancelado', 'CC', '100000002' from public.flight_seats fs
  where fs.flight_id = hu_010_flight_changes.flight_id and fs.label = '3A';

  perform set_config('request.jwt.claim.sub', passenger_id::text, true);
  perform * from public.cancel_booking(cancelled_id);
  if not exists (select 1 from public.bookings b where b.id = cancelled_id
      and b.cancelled_origin = 'Bogotá' and b.cancelled_destination = 'Medellín'
      and b.cancelled_departure_at = original_departure) then
    raise exception 'cancelled_snapshot_missing';
  end if;
  begin
    perform public.admin_update_flight(flight_id, 'Cali', 'Cartagena', changed_departure, 230000);
    raise exception 'passenger_updated_flight';
  exception when others then
    if sqlerrm <> 'admin_required' then raise; end if;
  end;

  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  affected := public.admin_update_flight(flight_id, 'Cali', 'Cartagena', changed_departure, 230000);
  if affected <> 1 then raise exception 'incorrect_notice_count'; end if;
  select count(*) into notice_count from public.flight_change_notices where booking_id = confirmed_id;
  if notice_count <> 1 or exists (select 1 from public.flight_change_notices where booking_id = cancelled_id) then
    raise exception 'incorrect_notice_recipients';
  end if;
  if not exists (select 1 from public.flight_change_notices n where n.booking_id = confirmed_id
      and n.old_origin = 'Bogotá' and n.old_destination = 'Medellín'
      and n.old_departure_at = original_departure and n.new_origin = 'Cali'
      and n.new_destination = 'Cartagena' and n.new_departure_at = changed_departure) then
    raise exception 'notice_details_missing';
  end if;
  if not exists (select 1 from public.bookings b where b.id = confirmed_id and b.total = 250000)
    or not exists (select 1 from public.flights f where f.id = flight_id and f.base_fare = 230000)
    or not exists (select 1 from public.bookings b where b.id = cancelled_id
      and b.cancelled_origin = 'Bogotá' and b.cancelled_destination = 'Medellín'
      and b.cancelled_departure_at = original_departure) then
    raise exception 'booking_amount_or_snapshot_changed';
  end if;
  affected := public.admin_update_flight(flight_id, 'Cali', 'Cartagena', changed_departure, 240000);
  if affected <> 0 then raise exception 'fare_only_created_notice'; end if;
  begin
    perform public.admin_update_flight(flight_id, 'Cali', 'Cartagena', clock_timestamp() - interval '1 day', 240000);
    raise exception 'past_departure_accepted';
  exception when others then
    if sqlerrm <> 'departure_must_be_future' then raise; end if;
  end;
  update public.flights set departure_at = clock_timestamp() - interval '1 day' where id = flight_id;
  begin
    perform public.admin_update_flight(flight_id, 'Cali', 'Cartagena', clock_timestamp() + interval '1 day', 240000);
    raise exception 'past_flight_changed';
  exception when others then
    if sqlerrm <> 'departure_must_be_future' then raise; end if;
  end;
end $$;
rollback;
