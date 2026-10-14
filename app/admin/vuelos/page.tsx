import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { PencilLine, Plus, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input, Label, Select } from "@/components/ui/input"
import { FlightStatusBadge } from "@/components/ui/badge"
import { AdminHeader, Flash } from "@/components/admin-ui"
import { createClient } from "@/lib/supabase/server"
import { CITIES, formatCOP, type Flight } from "@/lib/flights"
import { bogotaShortDate, bogotaTime, iataCode } from "@/lib/airports"
import { createFlight, deleteFlight, setFlightStatus } from "./actions"

export const metadata = { title: "Gestión de vuelos" }

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
  const count = (status: string) => flights.filter((f) => f.status === status).length

  return <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
    <AdminHeader title="Gestión de vuelos" description="Crea vuelos con 20 asientos, publícalos y controla su venta. Los horarios se ingresan en hora de Colombia." />
    <Flash error={message.error} notice={message.notice} />

    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-4">
      {[["Vuelos", flights.length], ["Publicados", count("Published")], ["Borradores", count("Draft")], ["Retirados", count("Withdrawn")]].map(([label, value]) =>
        <div key={label} className="bg-white px-5 py-4"><dt className="text-sm text-muted">{label}</dt><dd className="font-display text-3xl font-extrabold">{value}</dd></div>)}
    </dl>

    <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
      <section className="rounded-3xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-24" aria-labelledby="create-flight-heading">
        <h2 id="create-flight-heading" className="text-xl font-extrabold">Crear vuelo</h2>
        <p className="mt-1 text-sm text-muted">Se guardará como Borrador. Origen y destino deben ser distintos y la tarifa debe ser positiva.</p>
        <form action={createFlight} className="mt-5 grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Label>Origen
              <Select name="origin" required defaultValue="">
                <option value="" disabled>Ciudad</option>
                {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
              </Select>
            </Label>
            <Label>Destino
              <Select name="destination" required defaultValue="">
                <option value="" disabled>Ciudad</option>
                {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
              </Select>
            </Label>
          </div>
          <Label>Salida (hora de Colombia)
            <Input name="departure_at" type="datetime-local" required />
          </Label>
          <Label>Tarifa base (COP)
            <Input name="base_fare" type="number" min="1" step="1" required placeholder="200000" />
          </Label>
          <Button type="submit"><Plus aria-hidden="true" className="size-4" />Guardar borrador</Button>
        </form>
      </section>

      <section aria-labelledby="flights-heading" className="min-w-0">
        <h2 id="flights-heading" className="text-xl font-extrabold">Vuelos ({flights.length})</h2>
        {flights.length === 0
          ? <p className="mt-4 rounded-2xl border-2 border-dashed border-line p-8 text-center text-muted">Aún no hay vuelos. Crea el primero con el formulario.</p>
          : <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-white ring-1 ring-line">
            {flights.map((flight) => <li key={flight.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-4 md:grid-cols-[96px_1fr_110px_auto]">
              <div>
                <p className="font-display text-lg font-extrabold">{iataCode(flight.origin)}–{iataCode(flight.destination)}</p>
                <FlightStatusBadge status={flight.status} />
              </div>
              <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-auto">
                <h3 className="font-semibold">{flight.origin} → {flight.destination}</h3>
                <p className="text-sm text-muted">{bogotaShortDate(flight.departure_at)}, {bogotaTime(flight.departure_at)}</p>
              </div>
              <p className="col-start-2 row-start-1 text-right font-display text-lg font-extrabold md:col-start-auto md:row-start-auto">{formatCOP(Number(flight.base_fare))}</p>
              <div className="col-span-2 flex items-center gap-1.5 md:col-span-1 md:justify-end">
                {flight.status !== "Published" && <form action={setFlightStatus}><input type="hidden" name="flight_id" value={flight.id} /><input type="hidden" name="status" value="Published" /><Button size="sm" type="submit" className="w-36">{flight.status === "Withdrawn" ? "Volver a publicar" : "Publicar"}</Button></form>}
                {flight.status === "Published" && <form action={setFlightStatus}><input type="hidden" name="flight_id" value={flight.id} /><input type="hidden" name="status" value="Withdrawn" /><Button size="sm" variant="outline" type="submit" className="w-36">Retirar</Button></form>}
                <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href={`/admin/cambios?vuelo=${flight.id}#vuelo-${flight.id}`} title="Modificar ruta, salida o tarifa" aria-label={`Modificar vuelo ${flight.origin} a ${flight.destination}`}><PencilLine aria-hidden="true" className="size-4" /></Link>
                <form action={deleteFlight}><input type="hidden" name="flight_id" value={flight.id} /><Button size="sm" variant="danger" type="submit" title="Eliminar (solo vuelos sin reservas)" aria-label={`Eliminar vuelo ${flight.origin} a ${flight.destination}`}><Trash2 aria-hidden="true" className="size-4" /></Button></form>
              </div>
            </li>)}
          </ul>}
      </section>
    </div>
  </main>
}
