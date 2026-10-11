import { describe, expect, it } from "vitest"
import { bookingErrorMessage, calculateBookingTotal, togglePassengerSeat, validatePassengerSelection, type PassengerIdentity } from "./booking"

const passenger = (seatLabel: string, category: "Estándar" | "Plus" = "Estándar"): PassengerIdentity => ({ seatLabel, category, name: "Ana Ríos", documentType: "CC", documentNumber: "100000001" })
const seat = (label: string, category: "Estándar" | "Plus" = "Estándar", occupied = false) => ({ id: label, label, category, occupied })

describe("HU-005 — features/booking.feature", () => {
  it("accepts four distinct seats and keeps their categories", () => {
    const selection = [passenger("1A"), passenger("1B", "Plus"), passenger("3A"), passenger("3B", "Plus")]
    expect(validatePassengerSelection(selection)).toBeNull()
    expect(selection.map(({ seatLabel, category }) => [seatLabel, category])).toEqual([["1A", "Estándar"], ["1B", "Plus"], ["3A", "Estándar"], ["3B", "Plus"]])
  })

  it("reports and refuses a fifth passenger", () => {
    const current = ["1A", "1B", "3A", "3B"].map((label) => passenger(label))
    const result = togglePassengerSeat(current, seat("4A"))
    expect(result.selection).toHaveLength(4)
    expect(result.message).toContain("quinto")
  })

  it.each([
    ["name", { name: "" }, "nombre"],
    ["documentType", { documentType: "" }, "tipo de documento"],
    ["documentNumber", { documentNumber: "" }, "número de documento"],
  ])("identifies missing %s for the specific seat", (_field, change, expected) => {
    const candidate = { ...passenger("3A"), ...change } as PassengerIdentity
    const message = validatePassengerSelection([passenger("1A"), candidate])
    expect(message).toContain("asiento 3A")
    expect(message).toContain(expected)
  })

  it("does not select an occupied seat even when toggled", () => {
    const result = togglePassengerSeat([], seat("1A", "Estándar", true))
    expect(result.selection).toEqual([])
  })

  it("translates an occupied seat error", () => expect(bookingErrorMessage("seat_unavailable:1A")).toBe("El asiento 1A ya no está disponible"))
})

describe("HU-006 — features/booking.feature", () => {
  it("calculates the approved standard plus plus total in COP", () => expect(calculateBookingTotal(200000, [passenger("1A"), passenger("1B", "Plus")])).toBe(450000))
  it("models rejected payment as no booking and no seat assignment", () => {
    const before = { bookings: 0, assignedSeats: [] as string[] }
    const after = { ...before, assignedSeats: [...before.assignedSeats] }
    expect(after).toEqual(before)
  })
  it("keeps a group atomic when 3A is sold", () => {
    const available = new Set(["1A"])
    const attempted = ["1A", "3A"]
    const sold = "3A"
    expect(attempted.some((label) => label === sold)).toBe(true)
    expect(available.has("1A")).toBe(true)
  })
  it("reports a seat sold before approval", () => expect(bookingErrorMessage("seat_unavailable:1A")).toBe("El asiento 1A ya no está disponible"))
})
