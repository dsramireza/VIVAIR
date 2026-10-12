import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/server"
import { CITIES, formatCOP, formatDeparture, type Flight } from "@/lib/flights"
import { bogotaDateTimeInput } from "@/lib/flight-changes"
import { updateFlight } from "./actions"

export const metadata = { title: "Modificar vuelos | VIVAIR" }

export default async function FlightChangesPage({ searchParams }: {
  searchParams: Promise<{ error?: string; notice?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Administrator") notFound()

  const { data, error } = await supabase.from("flights")
    .select("id, origin, destination, departure_at, base_fare, status")
    .order("departure_at", { ascending: true })
  if (error) throw new Error("No pudimos cargar los vuelos")
  const flights = (data ?? []) as Flight[]
  const message = await searchParams

  return <main className="mx-auto max-w-6xl px-5 py-12">
    <p className="font-bold text-[var(--primary)]">Administración</p>
    <h1 className="mt-2 text-4xl font-black">Modificar vuelos</h1>
    <p className="mt-3 text-[var(--muted)]">Ajusta ruta, salida y tarifa. Los horarios se ingresan en hora de Colombia. Las reservas confirmadas conservan su importe y reciben un aviso si cambia la ruta o el horario.</p>
    <Link className="mt-5 inline-block font-semibold underline" href="/admin/vuelos">Volver a gestión de vuelos</Link>
    {message.error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{message.error}</p>}
    {message.notice && <p role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{message.notice}</p>}
    <section className="mt-8 grid gap-5" aria-label="Vuelos para modificar">
      {flights.length === 0 && <p>Aún no hay vuelos.</p>}
      {flights.map((flight) => <article key={flight.id} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">{flight.origin} → {flight.destination}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{formatDeparture(flight.departure_at)} · {formatCOP(Number(flight.base_fare))} · {flight.status}</p>
        {new Date(flight.departure_at).getTime() <= Date.now()
          ? <p className="mt-4 text-sm text-[var(--muted)]">La salida ya ocurrió; no se puede modificar.</p>
          : <form action={updateFlight} className="mt-5 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="flight_id" value={flight.id} />
            <label className="grid gap-2 font-semibold">Origen
              <select name="origin" required defaultValue={flight.origin} className="min-h-11 rounded-lg border border-[var(--border)] bg-white px-3">
                {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </label>
            <label className="grid gap-2 font-semibold">Destino
              <select name="destination" required defaultValue={flight.destination} className="min-h-11 rounded-lg border border-[var(--border)] bg-white px-3">
                {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </label>
            <label className="grid gap-2 font-semibold">Salida (hora de Colombia)
              <Input name="departure_at" type="datetime-local" required defaultValue={bogotaDateTimeInput(flight.departure_at)} />
            </label>
            <label className="grid gap-2 font-semibold">Tarifa base (COP)
              <Input name="base_fare" type="number" min="1" step="1" required defaultValue={Number(flight.base_fare)} />
            </label>
            <Button className="md:col-span-2 md:justify-self-start" type="submit">Guardar cambios</Button>
          </form>}
      </article>)}
    </section>
  </main>
}
