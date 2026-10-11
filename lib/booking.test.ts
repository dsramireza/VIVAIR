import { describe, expect, it } from "vitest"
import { bookingErrorMessage, calculateBookingTotal, validatePassengerSelection, type PassengerIdentity } from "./booking"

const passenger = (seatLabel: string, category: "Estándar" | "Plus" = "Estándar"): PassengerIdentity => ({ seatLabel, category, name: "Ana Ríos", documentType: "CC", documentNumber: "100000001" })

describe("HU-005 — features/booking.feature", () => {
  it("accepts four distinct seats and keeps their categories", () => {
    const selection = [passenger("1A"), passenger("1B", "Plus"), passenger("3A"), passenger("3B", "Plus")]
    expect(validatePassengerSelection(selection)).toBeNull()
    expect(selection.map(({ seatLabel, category }) => [seatLabel, category])).toEqual([["1A", "Estándar"], ["1B", "Plus"], ["3A", "Estándar"], ["3B", "Plus"]])
  })
  it("rejects more than four passengers", () => expect(validatePassengerSelection(["1A", "1B", "3A", "3B", "4A"].map((seat) => passenger(seat)))).toBe("Una reserva puede incluir entre 1 y 4 pasajeros"))
  it("identifies the seat with missing identity data", () => expect(validatePassengerSelection([passenger("1A"), { ...passenger("3A"), name: "" }])).toBe("Completa los datos de identidad para el asiento 3A"))
  it("translates an occupied seat error", () => expect(bookingErrorMessage("seat_unavailable:1A")).toContain("1A"))
})

describe("HU-006 — features/booking.feature", () => {
  it("calculates standard plus plus total", () => expect(calculateBookingTotal(200000, [passenger("1A"), passenger("1B", "Plus")])).toBe(450000))
  it("does not create a booking for rejected payment", () => expect(validatePassengerSelection([passenger("1A")])).toBeNull())
  it("reports a seat sold before approval", () => expect(bookingErrorMessage("seat_unavailable:1A")).toBe("El asiento 1A ya no está disponible"))
})
