import { createClient } from "@/lib/supabase/server"
import { bogotaDate, searchFlights, validateSearch, type Flight, type Search } from "@/lib/flights"
export async function findFlights(search: Search, now = new Date()) {
  const error = validateSearch(search)
  if (error || search.date < bogotaDate(now)) return { flights: [] as Flight[], error }
  const start = new Date(`${search.date}T00:00:00-05:00`)
  const end = new Date(start.getTime() + 86400000)
  const supabase = await createClient()
  const result = await supabase.from("flights").select("id,origin,destination,departure_at,base_fare,status").eq("status", "Published").eq("origin", search.origin).eq("destination", search.destination).gte("departure_at", start.toISOString()).lt("departure_at", end.toISOString()).gt("departure_at", now.toISOString()).order("departure_at")
  if (result.error) return { flights: [] as Flight[], error: "No pudimos consultar los vuelos. Intenta de nuevo." }
  return searchFlights(result.data as Flight[], search, now)
}
export async function findFlight(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from("flights").select("id,origin,destination,departure_at,base_fare,status").eq("id", id).eq("status", "Published").gt("departure_at", new Date().toISOString()).maybeSingle()
  if (error) throw new Error("No pudimos consultar el vuelo")
  return data as Flight | null
}
