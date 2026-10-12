import { describe, expect, it } from "vitest"
import { bogotaDateTimeInput, parseBogotaDateTime, parseFlightChange } from "./flight-changes"

const flightId = "d4ee51f4-8ef7-42d9-8068-32351259a97c"
function form(origin: string, destination: string, departure: string, fare: string) {
  const data = new FormData()
  data.set("flight_id", flightId)
  data.set("origin", origin)
  data.set("destination", destination)
  data.set("departure_at", departure)
  data.set("base_fare", fare)
  return data
}

describe("HU-010 flight changes", () => {
  it("converts Colombian local time in both directions and rejects impossible dates", () => {
    expect(parseBogotaDateTime("2026-10-16T11:00")).toBe("2026-10-16T16:00:00.000Z")
    expect(bogotaDateTimeInput("2026-10-16T16:00:00.000Z")).toBe("2026-10-16T11:00")
    expect(parseBogotaDateTime("2026-02-30T11:00")).toBeNull()
  })

  it("accepts changes to route, time and fare", () => {
    expect(parseFlightChange(form("Cali", "Cartagena", "2026-10-16T11:00", "230000")).change).toEqual({
      id: flightId, origin: "Cali", destination: "Cartagena",
      departureAt: "2026-10-16T16:00:00.000Z", baseFare: 230000,
    })
  })

  it("rejects matching cities and invalid fare before calling the database", () => {
    expect(parseFlightChange(form("Cali", "Cali", "2026-10-16T11:00", "230000")).error).toBe("El destino debe ser distinto al origen")
    expect(parseFlightChange(form("Cali", "Cartagena", "2026-10-16T11:00", "0")).error).toBe("La tarifa base debe ser mayor a COP 0")
  })
})
