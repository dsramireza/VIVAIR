import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/server"
import { CITIES, formatCOP, formatDeparture, type Flight } from "@/lib/flights"
import { createFlight, deleteFlight, setFlightStatus } from "./actions"

export const metadata = { title: "Gestión de vuelos | VIVAIR" }

const statusLabels: Record<string, string> = { Draft: "Borrador", Published: "Publicado", Withdrawn: "Retirado" }

export default async function AdminFlightsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Administrator") notFound()

  const { data, error } = await supabase.from("flights").select("id, origin, destination, departure_at, base_fare, status").order("departure_at", { ascending: true })
  if (error) throw new Error("No pudimos cargar los vuelos")
  const flights = (data ?? []) as Flight[]
  const message = await searchParams

  return <main className="mx-auto max-w-6xl px-5 py-12">
    <p className="font-bold text-[var(--primary)]">Administración</p>
    <h1 className="mt-2 text-4xl font-black">Gestión de vuelos</h1>
    <p className="mt-3 text-[var(--muted)]">Crea vuelos con 20 asientos, publícalos y controla su venta. Los horarios se ingresan en hora de Colombia.</p>
    <Link className="mt-5 inline-block font-semibold underline" href="/admin/cambios">Modificar ruta, salida o tarifa de un vuelo</Link>
    {message.error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{message.error}</p>}
    {message.notice && <p role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{message.notice}</p>}

    <section className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm" aria-labelledby="create-flight-heading">
      <h2 id="create-flight-heading" className="text-2xl font-bold">Crear vuelo</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Se guardará como Borrador. Origen y destino deben ser distintos y la tarifa debe ser positiva.</p>
      <form action={createFlight} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 font-semibold">Origen
          <select name="origin" required defaultValue="" className="min-h-11 rounded-lg border border-[var(--border)] bg-white px-3">
            <option value="" disabled>Selecciona una ciudad</option>
            {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <label className="grid gap-2 font-semibold">Destino
          <select name="destination" required defaultValue="" className="min-h-11 rounded-lg border border-[var(--border)] bg-white px-3">
            <option value="" disabled>Selecciona una ciudad</option>
            {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <label className="grid gap-2 font-semibold">Salida (hora de Colombia)
          <Input name="departure_at" type="datetime-local" required />
        </label>
        <label className="grid gap-2 font-semibold">Tarifa base (COP)
          <Input name="base_fare" type="number" min="1" step="1" required />
        </label>
        <Button className="md:col-span-2 md:justify-self-start" type="submit">Guardar borrador</Button>
      </form>
    </section>

    <section className="mt-10" aria-labelledby="flights-heading">
      <h2 id="flights-heading" className="text-2xl font-bold">Vuelos ({flights.length})</h2>
      <div className="mt-5 grid gap-4">
        {flights.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6">Aún no hay vuelos.</p>}
        {flights.map((flight) => <article key={flight.id} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--primary)]">{statusLabels[flight.status] ?? flight.status}</p>
              <h3 className="mt-1 text-xl font-black">{flight.origin} → {flight.destination}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{formatDeparture(flight.departure_at)} · Tarifa base {formatCOP(Number(flight.base_fare))}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {flight.status !== "Published" && <form action={setFlightStatus}><input type="hidden" name="flight_id" value={flight.id} /><input type="hidden" name="status" value="Published" /><Button type="submit">Publicar</Button></form>}
              {flight.status === "Published" && <form action={setFlightStatus}><input type="hidden" name="flight_id" value={flight.id} /><input type="hidden" name="status" value="Withdrawn" /><Button type="submit" className="bg-amber-700">Retirar</Button></form>}
              <form action={deleteFlight}><input type="hidden" name="flight_id" value={flight.id} /><Button type="submit" className="bg-slate-700">Eliminar</Button></form>
            </div>
          </div>
        </article>)}
      </div>
    </section>
  </main>
}
