import { notFound, redirect } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Label, Select } from "@/components/ui/input"
import { FlightStatusBadge, Badge } from "@/components/ui/badge"
import { AdminHeader, Flash } from "@/components/admin-ui"
import { createClient } from "@/lib/supabase/server"
import { CITIES, formatCOP, type Flight } from "@/lib/flights"
import { bogotaDateTimeInput } from "@/lib/flight-changes"
import { bogotaShortDate, bogotaTime, iataCode } from "@/lib/airports"
import { updateFlight } from "./actions"

export const metadata = { title: "Cambios de vuelo" }

async function loadFlights() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Administrator") notFound()
  const { data, error } = await supabase.from("flights")
    .select("id, origin, destination, departure_at, base_fare, status")
    .order("departure_at", { ascending: true })
  if (error) throw new Error("No pudimos cargar los vuelos")
  const now = Date.now()
  return ((data ?? []) as Flight[]).map((flight) => ({ ...flight, departed: Date.parse(flight.departure_at) <= now }))
}

export default async function FlightChangesPage({ searchParams }: {
  searchParams: Promise<{ error?: string; notice?: string; vuelo?: string }>
}) {
  const flights = await loadFlights()
  const message = await searchParams

  return <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
    <AdminHeader title="Cambios de vuelo" description="Ajusta ruta, salida y tarifa. Las reservas confirmadas conservan su asiento e importe, y sus pasajeros reciben un aviso si cambia la ruta o el horario." />
    <Flash error={message.error} notice={message.notice} />

    <section className="flex flex-col gap-3" aria-label="Vuelos para modificar">
      {flights.length === 0 && <p className="rounded-2xl border-2 border-dashed border-line p-8 text-center text-muted">Aún no hay vuelos.</p>}
      {flights.map((flight) => <details key={flight.id} id={`vuelo-${flight.id}`} open={message.vuelo === flight.id}
        className="group scroll-mt-28 overflow-hidden rounded-3xl bg-white ring-1 ring-line open:ring-2 open:ring-caribe">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="w-28 font-display text-lg font-extrabold">{iataCode(flight.origin)}–{iataCode(flight.destination)}</span>
          <span className="min-w-40 flex-1">
            <span className="block font-semibold">{flight.origin} → {flight.destination}</span>
            <span className="block text-sm text-muted">{bogotaShortDate(flight.departure_at)}, {bogotaTime(flight.departure_at)}</span>
          </span>
          <span className="font-display font-extrabold">{formatCOP(Number(flight.base_fare))}</span>
          {flight.departed ? <Badge tone="neutral">Ya salió</Badge> : <FlightStatusBadge status={flight.status} />}
          <ChevronDown aria-hidden="true" className="size-5 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-line bg-paper/50 px-5 py-5">
          {flight.departed
            ? <p className="text-muted">Este vuelo ya salió. Solo se pueden modificar vuelos con salida futura.</p>
            : <form action={updateFlight} className="grid gap-4 md:grid-cols-[1fr_1fr_1.3fr_1fr_auto] md:items-end">
              <input type="hidden" name="flight_id" value={flight.id} />
              <Label>Origen
                <Select name="origin" required defaultValue={flight.origin}>
                  {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                </Select>
              </Label>
              <Label>Destino
                <Select name="destination" required defaultValue={flight.destination}>
                  {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                </Select>
              </Label>
              <Label>Salida (hora de Colombia)
                <Input name="departure_at" type="datetime-local" required defaultValue={bogotaDateTimeInput(flight.departure_at)} />
              </Label>
              <Label>Tarifa base (COP)
                <Input name="base_fare" type="number" min="1" step="1" required defaultValue={Number(flight.base_fare)} />
              </Label>
              <Button type="submit">Guardar cambios</Button>
            </form>}
        </div>
      </details>)}
    </section>
  </main>
}
