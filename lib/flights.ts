export const CITIES = ["Bogotá", "Medellín", "Cali", "Cartagena", "Barranquilla"] as const
export type Flight = { id: string; origin: string; destination: string; departure_at: string; base_fare: number; status: string }
export type Search = { origin: string; destination: string; date: string }
export function bogotaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  return `${part("year")}-${part("month")}-${part("day")}`
}
export function validateSearch(search: Search): string | null {
  if (!CITIES.some((city) => city === search.origin) || !CITIES.some((city) => city === search.destination)) return "Selecciona ciudades del catálogo"
  if (search.origin === search.destination) return "El origen y el destino deben ser distintos"
  const parsed = new Date(`${search.date}T12:00:00-05:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(search.date) || Number.isNaN(parsed.getTime()) || bogotaDate(parsed) !== search.date) return "Selecciona una fecha válida"
  return null
}
export function searchFlights(flights: Flight[], search: Search, now: Date): { flights: Flight[]; error: string | null } {
  const error = validateSearch(search)
  if (error || search.date < bogotaDate(now)) return { flights: [], error }
  return { error: null, flights: flights.filter((flight) => flight.status === "Published" && flight.origin === search.origin && flight.destination === search.destination && new Date(flight.departure_at) > now && bogotaDate(new Date(flight.departure_at)) === search.date).sort((a, b) => Date.parse(a.departure_at) - Date.parse(b.departure_at)) }
}
export const FARE_CATEGORIES = [
  { name: "Estándar", surcharge: 0, baggage: "Un artículo personal" },
  { name: "Plus", surcharge: 50000, baggage: "Un artículo personal y un equipaje de cabina de hasta 10 kg" },
] as const
export const formatCOP = (amount: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount)
export const formatDeparture = (date: string) => new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", dateStyle: "long", timeStyle: "short" }).format(new Date(date))
