import { describe, expect, it } from "vitest"
import { canCancelReservation, formatCop, mapReservation } from "./reservations"

describe("HU-007/HU-008 reservation rules", () => {
  it("maps the complete group booking with every passenger and seat", () => {
    const reservation = mapReservation({ id: "b1", code: "VA-TEST-001", total: "450000", status: "Confirmed", flights: { origin: "Bogotá", destination: "Cali", departure_at: "2026-10-15T14:00:00Z" }, booking_passengers: [{ name: "Ana Ríos", document_type: "CC", document_number: "1", flight_seats: { label: "1A" } }, { name: "Luis Pérez", document_type: "CC", document_number: "2", flight_seats: { label: "3A" } }] })
    expect(reservation.passengers.map(({ name, seat }) => [name, seat])).toEqual([["Ana Ríos", "1A"], ["Luis Pérez", "3A"]])
    expect(reservation.origin).toBe("Bogotá")
    expect(reservation.total).toBe(450000)
  })

  it("allows cancellation strictly before departure", () => {
    expect(canCancelReservation(new Date("2026-10-07T17:00:00Z"), new Date("2026-10-15T14:00:00Z"))).toBe(true)
    expect(canCancelReservation(new Date("2026-10-15T14:00:00Z"), new Date("2026-10-15T14:00:00Z"))).toBe(false)
    expect(canCancelReservation(new Date("2026-10-15T15:00:00Z"), new Date("2026-10-15T14:00:00Z"))).toBe(false)
  })

  it("formats totals in Colombian pesos", () => expect(formatCop(450000)).toContain("450.000"))
})
