import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { mapReservation } from "./reservations"

const testUrl = process.env.SUPABASE_TEST_URL
const testAnonKey = process.env.SUPABASE_TEST_ANON_KEY
const testServiceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
const testEmail = process.env.SUPABASE_TEST_EMAIL
const testPassword = process.env.SUPABASE_TEST_PASSWORD
const testFlightId = "00000000-0000-0000-0000-000000000005"
const reservationSelect = "id, code, total, status, flights(origin, destination, departure_at), booking_passengers(name, document_type, document_number, flight_seats(label))"
const secondTestEmail = process.env.SUPABASE_TEST_SECOND_EMAIL
const secondTestPassword = process.env.SUPABASE_TEST_SECOND_PASSWORD
const approvedTestUrl = "https://ezghjeagjeuictmyfhcu.supabase.co"
const canRun = testUrl === approvedTestUrl &&
  Boolean(testAnonKey && testServiceKey && testEmail && testPassword)
const canRunAuthorization = canRun && Boolean(secondTestEmail && secondTestPassword)
const describeAuthorization = canRunAuthorization ? describe : describe.skip
const describeIntegration = canRun ? describe : describe.skip

type BookingRow = { booking_id: string; booking_code: string; total: number }
const payload = (labels: string[]) => labels.map((seat_label) => ({
  seat_label,
  name: `Pasajero ${seat_label}`,
  document_type: "CC",
  document_number: `1000000${seat_label.replace(/[^0-9]/g, "")}`,
}))

let admin: SupabaseClient
let user: SupabaseClient
let userId: string

async function countRows() {
  const [{ count: bookings }, { count: passengers }] = await Promise.all([
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("flight_id", testFlightId),
    admin.from("booking_passengers").select("id", { count: "exact", head: true }).in("booking_id", (await admin.from("bookings").select("id").eq("flight_id", testFlightId)).data?.map((row) => row.id) ?? ["00000000-0000-0000-0000-000000000000"]),
  ])
  return { bookings: bookings ?? 0, passengers: passengers ?? 0 }
}

async function removeTestBookings() {
  const { data } = await admin.from("bookings").select("id").eq("flight_id", testFlightId)
  const ids = data?.map((row) => row.id) ?? []
  if (ids.length) await admin.from("bookings").delete().in("id", ids)
}

async function createBooking(labels: string[], payment: "Approved" | "Rejected") {
  return user.rpc("create_mock_booking", {
    p_flight_id: testFlightId,
    p_passengers: payload(labels),
    p_payment: payment,
  })
}

describeIntegration("HU-005/HU-006 — isolated Supabase integration", () => {
  beforeAll(async () => {
    admin = createClient(testUrl!, testServiceKey!, { auth: { autoRefreshToken: false, persistSession: false } })
    user = createClient(testUrl!, testAnonKey!, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await user.auth.signInWithPassword({ email: testEmail!, password: testPassword! })
    if (error || !data.user) throw error ?? new Error("Test user could not sign in")
    userId = data.user.id
  })

  beforeEach(async () => {
    await removeTestBookings()
  })

  afterAll(async () => {
    await removeTestBookings()
    await user.auth.signOut()
  })

  it("creates one approved booking for 1A and 3A with total COP 450000", async () => {
    const { data, error } = await createBooking(["1A", "3A"], "Approved")
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    const result = data?.[0] as BookingRow
    expect(result.booking_id).toBeTruthy()
    expect(result.booking_code).toMatch(/^VA-[A-Z0-9]{8}$/)
    expect(Number(result.total)).toBe(450000)

    const { data: assigned } = await admin.from("booking_passengers").select("seat_id").eq("booking_id", result.booking_id)
    expect(assigned).toHaveLength(2)
    expect(userId).toBeTruthy()
  })

  it("leaves bookings and assignments unchanged when payment is rejected", async () => {
    const before = await countRows()
    const { data, error } = await createBooking(["1A", "3A"], "Rejected")
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
    await expect.poll(countRows).toEqual(before)
  })

  it("does not create a booking when 1A is already sold", async () => {
    expect((await createBooking(["1A"], "Approved")).error).toBeNull()
    const result = await createBooking(["1A", "2A"], "Approved")
    expect(result.data).toBeNull()
    expect(result.error?.message).toContain("seat_unavailable:1A")
  })

  it("rolls back 1A when 3A is sold in the same attempted group", async () => {
    expect((await createBooking(["3A"], "Approved")).error).toBeNull()
    const result = await createBooking(["1A", "3A"], "Approved")
    expect(result.data).toBeNull()
    expect(result.error?.message).toContain("seat_unavailable:3A")

    const available = await user.rpc("get_flight_seat_status", { p_flight_id: testFlightId })
    const seat1A = available.data?.find((seat: { label: string }) => seat.label === "1A")
    expect(seat1A?.occupied).toBe(false)
  })

  it("allows only one winner when two isolated requests race for 4A", async () => {
    const results = await Promise.all([createBooking(["4A"], "Approved"), createBooking(["4A"], "Approved")])
    expect(results.filter((result) => result.data?.length === 1)).toHaveLength(1)
    expect(results.filter((result) => result.error?.message.includes("seat_unavailable:4A"))).toHaveLength(1)
  })

  it("cancels the complete owned booking and releases every seat", async () => {
    const labels = ["1A", "3A"]
    const created = await createBooking(labels, "Approved")
    expect(created.error).toBeNull()
    const bookingId = (created.data?.[0] as BookingRow).booking_id

    const cancelled = await user.rpc("cancel_booking", { p_booking_id: bookingId })
    expect(cancelled.error).toBeNull()
    expect(cancelled.data).toEqual([{ booking_id: bookingId, booking_status: "Cancelled", released_seats: 2 }])

    const status = await user.rpc("get_flight_seat_status", { p_flight_id: testFlightId })
    expect(status.error).toBeNull()
    const released = status.data?.filter((seat: { label: string; occupied: boolean }) => labels.includes(seat.label))
    expect(released).toHaveLength(labels.length)
    expect(released?.every((seat: { occupied: boolean }) => !seat.occupied)).toBe(true)

    const rebooked = await createBooking(labels, "Approved")
    expect(rebooked.error).toBeNull()
    expect(rebooked.data).toHaveLength(1)
  })

  it("rejects a repeated cancellation", async () => {
    const created = await createBooking(["4A"], "Approved")
    expect(created.error).toBeNull()
    const bookingId = (created.data?.[0] as BookingRow).booking_id
    expect((await user.rpc("cancel_booking", { p_booking_id: bookingId })).error).toBeNull()
    const repeated = await user.rpc("cancel_booking", { p_booking_id: bookingId })
    expect(repeated.data).toBeNull()
    expect(repeated.error?.message).toContain("booking_not_confirmed")
  })

  it("rejects cancellation after departure and keeps the booking confirmed", async () => {
    const created = await createBooking(["4B"], "Approved")
    expect(created.error).toBeNull()
    const bookingId = (created.data?.[0] as BookingRow).booking_id
    const flight = await admin.from("flights").select("departure_at").eq("id", testFlightId).single()
    expect(flight.error).toBeNull()
    const originalDeparture = flight.data!.departure_at

    try {
      const update = await admin.from("flights").update({ departure_at: new Date(Date.now() - 60_000).toISOString() }).eq("id", testFlightId)
      expect(update.error).toBeNull()
      const cancelled = await user.rpc("cancel_booking", { p_booking_id: bookingId })
      expect(cancelled.data).toBeNull()
      expect(cancelled.error?.message).toContain("departure_already_reached")
      const booking = await admin.from("bookings").select("status").eq("id", bookingId).single()
      expect(booking.error).toBeNull()
      expect(booking.data?.status).toBe("Confirmed")
    } finally {
      const restore = await admin.from("flights").update({ departure_at: originalDeparture }).eq("id", testFlightId)
      expect(restore.error).toBeNull()
    }
  })
})

describeAuthorization("HU-008 — cancellation authorization", () => {
  let secondUser: SupabaseClient

  beforeAll(async () => {
    admin = createClient(testUrl!, testServiceKey!, { auth: { autoRefreshToken: false, persistSession: false } })
    user = createClient(testUrl!, testAnonKey!, { auth: { autoRefreshToken: false, persistSession: false } })
    secondUser = createClient(testUrl!, testAnonKey!, { auth: { autoRefreshToken: false, persistSession: false } })
    const first = await user.auth.signInWithPassword({ email: testEmail!, password: testPassword! })
    const second = await secondUser.auth.signInWithPassword({ email: secondTestEmail!, password: secondTestPassword! })
    if (first.error || second.error) throw first.error ?? second.error
  })

  beforeEach(async () => {
    await removeTestBookings()
  })

  afterAll(async () => {
    await removeTestBookings()
    await user.auth.signOut()
    await secondUser.auth.signOut()
  })

  it("rejects cancellation of another passenger's booking", async () => {
    const created = await user.rpc("create_mock_booking", {
      p_flight_id: testFlightId,
      p_passengers: payload(["4C"]),
      p_payment: "Approved",
    })
    expect(created.error).toBeNull()
    const bookingId = (created.data?.[0] as BookingRow).booking_id
    const result = await secondUser.rpc("cancel_booking", { p_booking_id: bookingId })
    expect(result.data).toBeNull()
    expect(result.error?.message).toContain("booking_not_found")
  })

  it("shows each passenger only their own reservations and complete group details", async () => {
    const owned = await createBooking(["1A", "3A"], "Approved")
    const other = await secondUser.rpc("create_mock_booking", {
      p_flight_id: testFlightId,
      p_passengers: payload(["2A"]),
      p_payment: "Approved",
    })
    expect(owned.error).toBeNull()
    expect(other.error).toBeNull()
    const ownCode = (owned.data?.[0] as BookingRow).booking_code
    const otherCode = (other.data?.[0] as BookingRow).booking_code

    const result = await user.from("bookings").select(reservationSelect)
    expect(result.error).toBeNull()
    expect(result.data?.map((row) => row.code)).toContain(ownCode)
    expect(result.data?.map((row) => row.code)).not.toContain(otherCode)

    const reservation = mapReservation(result.data!.find((row) => row.code === ownCode)!)
    expect(reservation.origin).toBe("Bogotá")
    expect(reservation.destination).toBe("Medellín")
    expect(reservation.departureAt).toBeTruthy()
    expect(reservation.total).toBe(450000)
    expect(reservation.passengers.map((passenger) => passenger.seat).sort()).toEqual(["1A", "3A"])
  })

  it("keeps owned flight and seat details visible when the flight is withdrawn or past", async () => {
    const created = await createBooking(["1B"], "Approved")
    expect(created.error).toBeNull()
    const bookingId = (created.data?.[0] as BookingRow).booking_id
    const flight = await admin.from("flights").select("departure_at").eq("id", testFlightId).single()
    expect(flight.error).toBeNull()
    const originalDeparture = flight.data!.departure_at

    try {
      for (const change of [
        { status: "Withdrawn" },
        { status: "Published", departure_at: new Date(Date.now() - 60_000).toISOString() },
      ]) {
        const update = await admin.from("flights").update(change).eq("id", testFlightId)
        expect(update.error).toBeNull()
        const result = await user.from("bookings").select(reservationSelect).eq("id", bookingId).single()
        expect(result.error).toBeNull()
        const reservation = mapReservation(result.data!)
        expect(reservation.origin).toBe("Bogotá")
        expect(reservation.passengers.map((passenger) => passenger.seat)).toEqual(["1B"])
      }
    } finally {
      const restore = await admin.from("flights").update({ status: "Published", departure_at: originalDeparture }).eq("id", testFlightId)
      expect(restore.error).toBeNull()
    }
  })
})
