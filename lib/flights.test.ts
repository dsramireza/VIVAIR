import { describe, expect, it } from "vitest"
import { bogotaDate, FARE_CATEGORIES, searchFlights, validateSearch, type Flight } from "./flights"
const now = new Date("2026-10-07T12:00:00-05:00")
const search = { origin: "Bogotá", destination: "Medellín", date: "2026-10-15" }
const flight: Flight = { id: "synthetic-flight", origin: "Bogotá", destination: "Medellín", departure_at: "2026-10-15T09:00:00-05:00", base_fare: 200000, status: "Published" }
describe("HU-003 — features/flight-discovery.feature", () => {
  it("Find only published future flights matching the selected route and date", () => {
    const flights = [flight, { ...flight, status: "Draft", departure_at: "2026-10-15T11:00:00-05:00" }, { ...flight, status: "Withdrawn", departure_at: "2026-10-15T13:00:00-05:00" }, { ...flight, destination: "Cali" }, { ...flight, departure_at: "2026-10-06T09:00:00-05:00" }]
    expect(searchFlights(flights, search, now)).toEqual({ flights: [flight], error: null })
  })
  it("Show an empty result when no flight matches", () => {
    expect(searchFlights([flight], { ...search, destination: "Cartagena" }, now)).toEqual({ flights: [], error: null })
  })
  it("Return no flights for a search date before the application date", () => {
    expect(searchFlights([{ ...flight, departure_at: "2026-10-06T09:00:00-05:00" }], { ...search, date: "2026-10-06" }, now)).toEqual({ flights: [], error: null })
  })
  it("Reject a search with the same origin and destination", () => {
    expect(searchFlights([flight], { ...search, destination: "Bogotá" }, now)).toEqual({ flights: [], error: "El origen y el destino deben ser distintos" })
  })
  it("excludes departures at the current instant and earlier on the same date", () => {
    expect(searchFlights([flight], search, new Date(flight.departure_at)).flights).toEqual([])
  })
  it("uses Bogotá dates across UTC midnight", () => {
    expect(bogotaDate(new Date("2026-10-16T02:00:00Z"))).toBe("2026-10-15")
    expect(searchFlights([{ ...flight, departure_at: "2026-10-16T02:00:00Z" }], search, now).flights).toHaveLength(1)
  })
  it.each(["2026-02-30", "invalid", "2026-13-01", "2026-1-01"])("rejects invalid date %s", (date) => {
    expect(validateSearch({ ...search, date })).toBe("Selecciona una fecha válida")
  })
  it("rejects cities outside the fixed catalog", () => {
    expect(validateSearch({ ...search, origin: "Miami" })).toBe("Selecciona ciudades del catálogo")
  })
})
describe("HU-004 — features/flight-discovery.feature", () => {
  it("View the fare and baggage allowance for each seat category", () => {
    expect(FARE_CATEGORIES).toEqual([
      { name: "Estándar", surcharge: 0, baggage: "Un artículo personal" },
      { name: "Plus", surcharge: 50000, baggage: "Un artículo personal y un equipaje de cabina de hasta 10 kg" },
    ])
    expect(FARE_CATEGORIES.map((category) => flight.base_fare + category.surcharge)).toEqual([200000, 250000])
  })
})
