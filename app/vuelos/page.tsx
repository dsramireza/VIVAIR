import Link from "next/link"
import { FlightSearch } from "@/components/flight-search"
import { findFlights } from "@/lib/flight-queries"
import { formatCOP, formatDeparture } from "@/lib/flights"
export const metadata = { title: "Buscar vuelos | VIVAIR", description: "Consulta vuelos nacionales de solo ida, tarifas en COP y horarios de Colombia." }
export default async function FlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : ""
  const search = { origin: value("origin"), destination: value("destination"), date: value("date") }
  const submitted = Object.keys(params).some((key) => ["origin", "destination", "date"].includes(key))
  const result = submitted ? await findFlights(search) : null
  return <main className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12">
    <header><p className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--muted)]">Vuelos nacionales · Solo ida</p><h1 className="text-4xl font-black tracking-tight">Encuentra tu próximo destino</h1><p className="mt-3 text-[var(--muted)]">Horarios de Colombia (America/Bogota). Precios por pasajero en COP.</p></header>
    <FlightSearch search={search} />
    {result && <section aria-label="Resultados de búsqueda" className="flex flex-col gap-4">
      {result.error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{result.error}</p> : <><h2 className="text-xl font-bold">{result.flights.length} vuelos encontrados</h2>{result.flights.length === 0 && <p className="rounded-xl border border-slate-200 p-6">No encontramos vuelos para esta ruta y fecha. Prueba con otra búsqueda.</p>}{result.flights.map((flight) => <article key={flight.id} className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900"><div><h3 className="text-xl font-bold">{flight.origin} → {flight.destination}</h3><p className="mt-2">{formatDeparture(flight.departure_at)}</p></div><div><p className="text-sm">Tarifa base</p><p className="text-2xl font-black">{formatCOP(flight.base_fare)} COP</p></div><Link href={`/vuelos/${flight.id}`} className="rounded-lg bg-[var(--primary)] px-5 py-3 font-bold text-white">Ver tarifas y equipaje<span className="sr-only">: {flight.origin} a {flight.destination}</span></Link></article>)}</>}
    </section>}
  </main>
}
