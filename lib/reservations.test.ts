import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const cancellationMigration = readFileSync(fileURLToPath(new URL("supabase/migrations/20261011000300_hu_008_cancel_booking_security_definer.sql", `file://${process.cwd()}/`)), "utf8")
import { canCancelReservation, formatCop, mapReservation } from "./reservations"

describe("HU-007/HU-008 reservation rules", () => {
  it("maps the complete group booking with every passenger and seat", () => {
    const reservation = mapReservation({ id: "b1", code: "VA-TEST-001", total: "450000", status: "Confirmed", flights: { origin: "Bogotá", destination: "Cali", departure_at: "2026-10-15T14:00:00Z" }, booking_passengers: [{ name: "Ana Ríos", document_type: "CC", document_number: "1", flight_seats: { label: "1A" } }, { name: "Luis Pérez", document_type: "CC", document_number: "2", flight_seats: { label: "3A" } }] })
    expect(reservation.passengers.map(({ name, seat }) => [name, seat])).toEqual([["Ana Ríos", "1A"], ["Luis Pérez", "3A"]])
    expect(reservation.origin).toBe("Bogotá")
    expect(reservation.total).toBe(450000)
  })

  it("keeps the cancellation itinerary when the live flight changes", () => {
    const reservation = mapReservation({
      id: "b2", code: "VA-TEST-002", total: "250000", status: "Cancelled",
      cancelled_origin: "Bogotá", cancelled_destination: "Medellín", cancelled_departure_at: "2026-10-15T14:00:00Z",
      flights: { origin: "Cali", destination: "Cartagena", departure_at: "2026-10-16T16:00:00Z" },
    })
    expect([reservation.origin, reservation.destination, reservation.departureAt]).toEqual([
      "Bogotá", "Medellín", "2026-10-15T14:00:00Z",
    ])
  })

  it("allows cancellation strictly before departure", () => {
    expect(canCancelReservation(new Date("2026-10-07T17:00:00Z"), new Date("2026-10-15T14:00:00Z"))).toBe(true)
    expect(canCancelReservation(new Date("2026-10-15T14:00:00Z"), new Date("2026-10-15T14:00:00Z"))).toBe(false)
    expect(canCancelReservation(new Date("2026-10-15T15:00:00Z"), new Date("2026-10-15T14:00:00Z"))).toBe(false)
  })

  it("formats totals in Colombian pesos", () => expect(formatCop(450000)).toContain("450.000"))

  it("defines the cancellation RPC with the production authorization contract", () => {
    expect(cancellationMigration).toMatch(/security definer/i)
    expect(cancellationMigration).toMatch(/set search_path = ''/i)
    expect(cancellationMigration).toMatch(/caller_id uuid := \(select auth\.uid\(\)\)/i)
    expect(cancellationMigration).toMatch(/and b\.passenger_id = caller_id/i)
    expect(cancellationMigration).toMatch(/for update/i)
    expect(cancellationMigration).toMatch(/booking_not_confirmed/i)
    expect(cancellationMigration).toMatch(/clock_timestamp\(\) < f\.departure_at/i)
    expect(cancellationMigration).toMatch(/revoke all on function public\.cancel_booking\(uuid\) from public, anon/i)
    expect(cancellationMigration).toMatch(/grant execute on function public\.cancel_booking\(uuid\) to authenticated/i)
    expect(cancellationMigration).not.toMatch(/grant update on public\.bookings/i)
  })
})
