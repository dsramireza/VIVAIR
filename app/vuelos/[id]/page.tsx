import Link from "next/link"
import { notFound } from "next/navigation"
import { findFlight } from "@/lib/flight-queries"
import { FARE_CATEGORIES, formatCOP, formatDeparture } from "@/lib/flights"
import { createClient } from "@/lib/supabase/server"
import { BookingForm } from "@/components/booking-form"
export const metadata = { title: "Tarifas y equipaje | VIVAIR" }
export default async function FlightDetails({ params }: { params: Promise<{ id: string }> }) {
  const flight = await findFlight((await params).id)
  if (!flight) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: seats } = user ? await supabase.from("flight_seats").select("id,label,category").eq("flight_id", flight.id).order("label") : { data: [] }
  return <main className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-12">
    <Link className="font-semibold underline" href="/vuelos">Volver a buscar vuelos</Link>
    <header><p className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">Tarifas y equipaje</p><h1 className="mt-3 text-4xl font-black">{flight.origin} → {flight.destination}</h1><p className="mt-4">{formatDeparture(flight.departure_at)} · Hora de Colombia</p><p className="mt-2">Tarifa base: {formatCOP(flight.base_fare)} COP por pasajero</p></header>
    <section aria-label="Categorías de asiento" className="grid gap-5 sm:grid-cols-2">{FARE_CATEGORIES.map((category) => <article key={category.name} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-7 text-slate-900"><h2 className="text-2xl font-bold">{category.name}</h2><p>Recargo: {formatCOP(category.surcharge)} COP</p><p className="text-3xl font-black">{formatCOP(Number(flight.base_fare) + category.surcharge)} COP</p><p className="text-sm">Total por pasajero</p><p className="border-t border-slate-200 pt-5">{category.baggage}</p></article>)}</section>
    <p className="rounded-xl bg-amber-50 p-5 text-amber-950">No se vende equipaje adicional. Tarifas y políticas ficticias de demostración.</p>
    {user ? <BookingForm flight={{ id: flight.id, baseFare: Number(flight.base_fare), seats: (seats ?? []) as { id: string; label: string; category: "Estándar" | "Plus" }[] }} /> : <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900">Ingresa a tu cuenta para seleccionar asientos y reservar este vuelo.</p>}
  </main>
}
