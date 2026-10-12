import { CITIES } from "@/lib/flights"

export type NewFlight = {
  origin: string
  destination: string
  departureAt: string
  baseFare: number
}

export function parseBogotaDeparture(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}:00-05:00`)
  if (Number.isNaN(parsed.getTime())) return null
  const bogotaWallTime = new Date(parsed.getTime() - 5 * 60 * 60 * 1000)
  return bogotaWallTime.toISOString().slice(0, 16) === value ? parsed.toISOString() : null
}

export function parseNewFlight(formData: FormData): { flight: NewFlight; error: null } | { flight: null; error: string } {
  const origin = String(formData.get("origin") ?? "")
  const destination = String(formData.get("destination") ?? "")
  const departureAt = parseBogotaDeparture(String(formData.get("departure_at") ?? ""))
  const baseFare = Number(formData.get("base_fare"))
  if (!CITIES.some((city) => city === origin) || !CITIES.some((city) => city === destination)) {
    return { flight: null, error: "Selecciona ciudades del catálogo" }
  }
  if (origin === destination) return { flight: null, error: "El destino debe ser distinto al origen" }
  if (!departureAt) return { flight: null, error: "Ingresa una fecha y hora de salida válidas" }
  if (!Number.isSafeInteger(baseFare) || baseFare <= 0 || baseFare > 9_999_999_999) {
    return { flight: null, error: "La tarifa base debe ser mayor a COP 0" }
  }
  return { flight: { origin, destination, departureAt, baseFare }, error: null }
}

export function adminFlightError(message: string): string {
  if (message.includes("different_cities_required")) return "El destino debe ser distinto al origen"
  if (message.includes("positive_fare_required")) return "La tarifa base debe ser mayor a COP 0"
  if (message.includes("departure_must_be_future")) return "La salida debe ser posterior a la hora actual"
  if (message.includes("flight_has_booking_history")) return "Este vuelo tiene historial de reservas y no se puede eliminar"
  if (message.includes("invalid_flight_transition")) return "El estado del vuelo cambió. Actualiza la página e intenta de nuevo"
  if (message.includes("seat_map_incomplete")) return "El mapa de asientos está incompleto"
  if (message.includes("flight_not_found")) return "No encontramos este vuelo"
  return "No pudimos completar la operación. Intenta de nuevo"
}
