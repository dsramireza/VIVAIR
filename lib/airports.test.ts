import { describe, expect, it } from "vitest"
import { bogotaDay, bogotaTime, iataCode } from "./airports"
import { CITIES } from "./flights"

describe("airport display helpers", () => {
  it("maps every catalog city to a distinct IATA code", () => {
    const codes = CITIES.map(iataCode)
    expect(codes).toEqual(["BOG", "MDE", "CLO", "CTG", "BAQ"])
    expect(new Set(codes).size).toBe(CITIES.length)
  })

  it("formats departure time and day in America/Bogota", () => {
    const departure = "2026-10-15T14:00:00.000Z"
    expect(bogotaTime(departure)).toMatch(/^9:00\sa\.\s?m\.$/)
    expect(bogotaDay(departure)).toContain("15 de octubre")
  })
})
