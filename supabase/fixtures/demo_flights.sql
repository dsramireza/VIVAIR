-- Run on test or production after provisioning one synthetic Passenger whose
-- email ends in @example.test. Re-running during the same month fills only
-- missing seats and does not alter existing flights or reservations.
do $$
declare
  v_owner uuid;
  v_month date;
  v_flight uuid;
  v_departure timestamptz;
  v_occupied integer;
  v_target integer;
  v_group_size integer;
  v_payload jsonb;
  v_labels text[] := array['1A','3A','2B','4B','1C','3C','2D','5D'];
  v_origins text[] := array['Bogotá','Bogotá','Bogotá','Bogotá','Medellín','Medellín','Cali','Cali','Cartagena','Cartagena','Barranquilla','Barranquilla'];
  v_destinations text[] := array['Medellín','Cali','Cartagena','Barranquilla','Bogotá','Cartagena','Bogotá','Barranquilla','Bogotá','Medellín','Bogotá','Cali'];
begin
  select p.id into v_owner
  from public.profiles p join auth.users u on u.id = p.id
  where p.role = 'Passenger' and u.email like '%@example.test'
  order by p.created_at limit 1;
  if v_owner is null then raise exception 'synthetic_passenger_required'; end if;

  v_month := (date_trunc('month', clock_timestamp() at time zone 'America/Bogota') + interval '1 month')::date;
  for i in 1..12 loop
    v_flight := md5('vivair-demo-' || v_month::text || '-' || i::text)::uuid;
    v_departure := ((v_month + 9 + (i - 1)) +
      case (i % 4) when 0 then time '07:00' when 1 then time '09:30'
        when 2 then time '14:00' else time '18:00' end) at time zone 'America/Bogota';

    insert into public.flights (id, origin, destination, departure_at, base_fare, status)
    values (v_flight, v_origins[i], v_destinations[i], v_departure, 180000 + i * 17000, 'Published')
    on conflict (id) do nothing;

    insert into public.flight_seats (flight_id, label, category)
    select v_flight, r::text || c,
      case when r <= 2 then 'Plus'::public.seat_category else 'Estándar'::public.seat_category end
    from generate_series(1, 5) as rows(r)
    cross join unnest(array['A','B','C','D']) as letters(c)
    on conflict (flight_id, label) do nothing;

    if (select count(*) from public.flight_seats where flight_id = v_flight) <> 20 then
      raise exception 'demo_seat_map_incomplete:%', v_flight;
    end if;
    v_target := 4 + ((i - 1) % 5);
    loop
      select count(*) into v_occupied
      from public.booking_passengers bp
      join public.bookings b on b.id = bp.booking_id
      where b.flight_id = v_flight and b.status = 'Confirmed';
      exit when v_occupied >= v_target;
      v_group_size := least(4, v_target - v_occupied);

      select jsonb_agg(jsonb_build_object(
        'seat_label', seats.label,
        'name', 'Pasajero Demo ' || i::text || ' ' || seats.label,
        'document_type', 'CC',
        'document_number', (900000000 + i * 100 + seats.ordinal)::text
      )) into v_payload
      from (
        select fs.label, row_number() over (order by coalesce(array_position(v_labels, fs.label), 99), fs.label) as ordinal
        from public.flight_seats fs
        where fs.flight_id = v_flight
          and not exists (
            select 1 from public.booking_passengers bp
            join public.bookings b on b.id = bp.booking_id
            where bp.seat_id = fs.id and b.status = 'Confirmed'
          )
        order by coalesce(array_position(v_labels, fs.label), 99), fs.label
        limit v_group_size
      ) seats;
      if jsonb_array_length(coalesce(v_payload, '[]'::jsonb)) <> v_group_size then
        raise exception 'demo_seats_unavailable:%', v_flight;
      end if;
      perform set_config('request.jwt.claim.sub', v_owner::text, true);
      perform * from public.create_mock_booking(v_flight, v_payload, 'Approved'::public.payment_result);
    end loop;
  end loop;
end $$;
