import { CITIES } from "./flights"

export type FlightChange = {
  id: string
  origin: string
  destination: string
  departureAt: string
  baseFare: number
}

export function parseBogotaDateTime(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00-05:00`)
  if (Number.isNaN(date.getTime())) return null
  const roundTrip = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date).replace(" ", "T")
  return roundTrip === value ? date.toISOString() : null
}

export function bogotaDateTimeInput(value: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value)).replace(" ", "T")
}

export function parseFlightChange(formData: FormData): { change?: FlightChange; error?: string } {
  const id = String(formData.get("flight_id") ?? "")
  const origin = String(formData.get("origin") ?? "")
  const destination = String(formData.get("destination") ?? "")
  const departureAt = parseBogotaDateTime(String(formData.get("departure_at") ?? ""))
  const fareText = String(formData.get("base_fare") ?? "")
  const baseFare = Number(fareText)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { error: "Vuelo inválido" }
  if (!CITIES.some((city) => city === origin) || !CITIES.some((city) => city === destination)) return { error: "Selecciona ciudades del catálogo" }
  if (origin === destination) return { error: "El destino debe ser distinto al origen" }
  if (!departureAt) return { error: "Selecciona una fecha y hora válidas" }
  if (!fareText || !Number.isSafeInteger(baseFare) || baseFare <= 0) return { error: "La tarifa base debe ser mayor a COP 0" }
  return { change: { id, origin, destination, departureAt, baseFare } }
}

export function flightChangeError(message: string): string {
  if (message.includes("departure_must_be_future")) return "La salida actual y la nueva deben estar en el futuro"
  if (message.includes("flight_not_found")) return "El vuelo ya no existe"
  if (message.includes("admin_required")) return "No tienes permiso para modificar vuelos"
  if (message.includes("different_cities_required")) return "El destino debe ser distinto al origen"
  if (message.includes("positive_fare_required")) return "La tarifa base debe ser mayor a COP 0"
  return "No pudimos actualizar el vuelo. Intenta nuevamente."
}
