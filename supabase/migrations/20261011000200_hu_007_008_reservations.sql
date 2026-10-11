create or replace function public.cancel_booking(p_booking_id uuid)
returns table (booking_id uuid, booking_status public.booking_status, released_seats integer)
language plpgsql security invoker set search_path = ''
as $$
declare
  booking public.bookings;
  released integer;
begin
  select b.* into booking
  from public.bookings b
  join public.flights f on f.id = b.flight_id
  where b.id = p_booking_id
    and b.passenger_id = (select auth.uid())
  for update;

  if booking.id is null then raise exception 'booking_not_found'; end if;
  if booking.status <> 'Confirmed' then raise exception 'booking_not_confirmed'; end if;
  if exists (select 1 from public.flights f where f.id = booking.flight_id and now() >= f.departure_at) then
    raise exception 'departure_already_reached';
  end if;

  update public.bookings set status = 'Cancelled' where id = booking.id;
  select count(*)::integer into released from public.booking_passengers where booking_id = booking.id;
  return query select booking.id, 'Cancelled'::public.booking_status, released;
end;
$$;
revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;
comment on function public.cancel_booking(uuid) is 'Cancels an entire owned confirmed booking before departure using the database clock; no refund is initiated.';
select pg_notify('pgrst', 'reload schema');
