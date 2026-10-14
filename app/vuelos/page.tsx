import Link from "next/link"
import { CircleAlert, PlaneTakeoff } from "lucide-react"
import { FlightSearch } from "@/components/flight-search"
import { RouteCodes } from "@/components/route-codes"
import { buttonVariants } from "@/components/ui/button"
import { findFlights } from "@/lib/flight-queries"
import { formatCOP } from "@/lib/flights"
import { bogotaDay, bogotaTime } from "@/lib/airports"

export const metadata = { title: "Buscar vuelos", description: "Consulta vuelos nacionales de solo ida, tarifas en COP y horarios de Colombia." }

export default async function FlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : ""
  const search = { origin: value("origin"), destination: value("destination"), date: value("date") }
  const submitted = Object.keys(params).some((key) => ["origin", "destination", "date"].includes(key))
  const result = submitted ? await findFlights(search) : null
  const count = result?.flights.length ?? 0

  return <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
    <header>
      <h1 className="text-4xl font-extrabold sm:text-5xl">Encuentra tu vuelo</h1>
      <p className="mt-3 text-muted">Vuelos nacionales de solo ida. Horarios de Colombia y precios por pasajero en pesos colombianos.</p>
    </header>
    <FlightSearch search={search} />

    {result && <section aria-label="Resultados de búsqueda" className="flex flex-col gap-4">
      {result.error
        ? <p role="alert" className="flex items-start gap-3 rounded-2xl bg-coral-soft p-5 font-medium text-coral"><CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />{result.error}</p>
        : <>
          <h2 className="text-xl font-bold">{count} {count === 1 ? "vuelo encontrado" : "vuelos encontrados"}</h2>
          {count === 0 && <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center">
            <PlaneTakeoff aria-hidden="true" className="size-8 text-muted" />
            <p className="font-semibold">No encontramos vuelos para esta ruta y fecha. Prueba con otra búsqueda.</p>
            <p className="text-sm text-muted">Cambia la fecha o intercambia origen y destino.</p>
          </div>}
          <ul className="flex flex-col gap-4">
            {result.flights.map((flight) => <li key={flight.id}>
              <article className="ticket grid overflow-hidden rounded-3xl bg-white ring-1 ring-line sm:grid-cols-[1fr_230px]">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-8">
                  <div className="shrink-0 sm:w-36">
                    <p className="font-display text-3xl font-extrabold">{bogotaTime(flight.departure_at)}</p>
                    <p className="text-sm text-muted first-letter:uppercase">{bogotaDay(flight.departure_at)}</p>
                  </div>
                  <RouteCodes origin={flight.origin} destination={flight.destination} className="flex-1" />
                </div>
                <div className="ticket-perforation flex flex-row items-center justify-between gap-4 bg-caribe-soft/50 p-6 sm:flex-col sm:items-stretch sm:justify-center">
                  <div>
                    <p className="text-sm text-muted">Desde</p>
                    <p className="font-display text-2xl font-extrabold">{formatCOP(Number(flight.base_fare))} <span className="text-sm font-semibold text-muted">COP</span></p>
                  </div>
                  <Link href={`/vuelos/${flight.id}`} className={buttonVariants()}>
                    Elegir asientos<span className="sr-only">: {flight.origin} a {flight.destination}</span>
                  </Link>
                </div>
              </article>
            </li>)}
          </ul>
        </>}
    </section>}
  </main>
}
