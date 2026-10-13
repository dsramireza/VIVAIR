-- Aggregate sales without exposing passenger identity or individual bookings.
create or replace function public.admin_sales_summary()
returns table (confirmed_bookings bigint, confirmed_passengers bigint, sales_cop numeric)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'Administrator'
  ) then
    raise exception 'admin_required';
  end if;

  return query
  select
    (select count(*) from public.bookings b where b.status = 'Confirmed'),
    (select count(*) from public.booking_passengers bp
     join public.bookings b on b.id = bp.booking_id
     where b.status = 'Confirmed'),
    (select coalesce(sum(b.total), 0) from public.bookings b where b.status = 'Confirmed');
end;
$$;

revoke all on function public.admin_sales_summary() from public, anon;
grant execute on function public.admin_sales_summary() to authenticated;
select pg_notify('pgrst', 'reload schema');
