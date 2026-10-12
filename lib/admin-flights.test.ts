import { describe, expect, it } from "vitest"
import { parseBogotaDeparture, parseNewFlight } from "./admin-flights"

const form = (origin: string, destination: string, departure: string, fare: string) => {
  const data = new FormData()
  data.set("origin", origin)
  data.set("destination", destination)
  data.set("departure_at", departure)
  data.set("base_fare", fare)
  return data
}

describe("HU-009 flight administration input", () => {
  it("converts the local Colombian departure time to UTC", () => {
    expect(parseBogotaDeparture("2026-10-15T09:00")).toBe("2026-10-15T14:00:00.000Z")
    expect(parseBogotaDeparture("2026-02-30T09:00")).toBeNull()
  })

  it("accepts a valid Draft even when its departure is in the past; publication checks the clock", () => {
    const result = parseNewFlight(form("Bogotá", "Medellín", "2026-10-06T09:00", "200000"))
    expect(result.flight?.departureAt).toBe("2026-10-06T14:00:00.000Z")
    expect(result.flight?.baseFare).toBe(200000)
  })

  it("rejects matching cities and a zero fare before a Draft is saved", () => {
    expect(parseNewFlight(form("Bogotá", "Bogotá", "2026-10-15T09:00", "200000")).error).toBe("El destino debe ser distinto al origen")
    expect(parseNewFlight(form("Bogotá", "Medellín", "2026-10-15T09:00", "0")).error).toBe("La tarifa base debe ser mayor a COP 0")
  })
})
