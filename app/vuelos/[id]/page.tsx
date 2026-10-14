import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Briefcase, Luggage } from "lucide-react"
import { findFlight } from "@/lib/flight-queries"
import { FARE_CATEGORIES, formatCOP } from "@/lib/flights"
import { bogotaShortDate, bogotaTime } from "@/lib/airports"
import { createClient } from "@/lib/supabase/server"
import { BookingForm } from "@/components/booking-form"
import { RouteCodes } from "@/components/route-codes"
import { buttonVariants } from "@/components/ui/button"

export const metadata = { title: "Tarifas y asientos" }

export default async function FlightDetails({ params }: { params: Promise<{ id: string }> }) {
  const flight = await findFlight((await params).id)
  if (!flight) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: seats } = user ? await supabase.rpc("get_flight_seat_status", { p_flight_id: flight.id }) : { data: [] }
  const free = (seats ?? []).filter((seat: { occupied: boolean }) => !seat.occupied).length

  return <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
    <Link className="inline-flex items-center gap-2 self-start rounded-lg text-sm font-semibold text-muted hover:text-ink" href="/vuelos"><ArrowLeft aria-hidden="true" className="size-4" />Volver a buscar vuelos</Link>

    <header className="grid gap-6 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex flex-col gap-4">
        <h1 className="sr-only">{flight.origin} → {flight.destination}</h1>
        <RouteCodes origin={flight.origin} destination={flight.destination} size="lg" className="max-w-xl" />
      </div>
      <dl className="grid grid-cols-3 gap-3 border-t sm:gap-6 border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <div><dt className="text-sm text-muted">Salida</dt><dd className="font-display text-lg font-extrabold sm:text-2xl">{bogotaTime(flight.departure_at)}</dd></div>
        <div><dt className="text-sm text-muted">Fecha</dt><dd className="font-display text-lg font-extrabold sm:text-2xl">{bogotaShortDate(flight.departure_at)}</dd></div>
        <div><dt className="text-sm text-muted">Tarifa base</dt><dd className="font-display text-lg font-extrabold sm:text-2xl">{formatCOP(Number(flight.base_fare))}</dd></div>
      </dl>
    </header>

    <section aria-label="Categorías de asiento" className="grid gap-4 sm:grid-cols-2">
      {FARE_CATEGORIES.map((category) => {
        const plus = category.name === "Plus"
        return <article key={category.name} className={plus ? "rounded-3xl bg-guayacan-soft p-6 ring-1 ring-guayacan/60" : "rounded-3xl bg-white p-6 ring-1 ring-line"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">{category.name}</h2>
              <p className="text-sm text-muted">{plus ? "Filas 1 y 2" : "Filas 3 a 5"}. Recargo: {formatCOP(category.surcharge)} COP</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-extrabold">{formatCOP(Number(flight.base_fare) + category.surcharge)} <span className="text-sm font-semibold text-muted">COP</span></p>
              <p className="text-sm text-muted">Total por pasajero</p>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 border-t border-ink/10 pt-4 font-medium">
            {plus ? <Luggage aria-hidden="true" className="size-5 text-guayacan-ink" /> : <Briefcase aria-hidden="true" className="size-5 text-caribe" />}
            {category.baggage}
          </p>
        </article>
      })}
    </section>
    <p className="-mt-4 text-sm text-muted">No se vende equipaje adicional. Tarifas y políticas ficticias de demostración.</p>

    {user
      ? <>
        <p className="-mb-4 text-sm font-semibold text-muted">{free} de 20 asientos disponibles</p>
        <BookingForm flight={{ id: flight.id, baseFare: Number(flight.base_fare), seats: (seats ?? []) as { id: string; label: string; category: "Estándar" | "Plus"; occupied: boolean }[] }} />
      </>
      : <section className="flex flex-col items-start gap-4 rounded-3xl bg-night p-7 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Elige tus asientos</h2>
          <p className="mt-1 text-white/70">Ingresa a tu cuenta para seleccionar asientos y reservar este vuelo.</p>
        </div>
        <div className="flex gap-3">
          <Link className={buttonVariants({ variant: "accent" })} href="/ingresar">Ingresar</Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/registro">Crear cuenta</Link>
        </div>
      </section>}
  </main>
}
