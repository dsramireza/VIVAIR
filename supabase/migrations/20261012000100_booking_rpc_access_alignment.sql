-- Supabase may explicitly grant execute to anon when functions are created.
-- Keep booking operations restricted to authenticated users in both projects.
revoke all on function public.create_mock_booking(uuid, jsonb, public.payment_result) from public, anon;
revoke all on function public.get_flight_seat_status(uuid) from public, anon;
grant execute on function public.create_mock_booking(uuid, jsonb, public.payment_result) to authenticated;
grant execute on function public.get_flight_seat_status(uuid) to authenticated;
