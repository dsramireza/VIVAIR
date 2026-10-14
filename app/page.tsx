import { Armchair, CreditCard, Search } from "lucide-react"
import { FlightSearch } from "@/components/flight-search"
import { RouteMap } from "@/components/route-map"
import { FARE_CATEGORIES, formatCOP } from "@/lib/flights"

const steps = [
  { icon: Search, title: "Busca tu vuelo", text: "Elige origen, destino y fecha. Solo verás vuelos publicados con salida futura." },
  { icon: Armchair, title: "Elige asientos", text: "Reserva para hasta cuatro personas en el mapa de cabina. Filas 1 y 2 son Plus." },
  { icon: CreditCard, title: "Confirma el pago", text: "El pago es simulado: si se aprueba recibes tu código de reserva al instante." }
]

export default function HomePage() {
  return <main>
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
      <div className="flex min-w-0 flex-col gap-7">
        <div className="flex flex-col gap-5">
          <h1 className="max-w-xl text-5xl font-extrabold text-night sm:text-6xl lg:text-7xl">Vuela por Colombia sin vueltas.</h1>
          <p className="max-w-lg text-lg text-muted">Bogotá, Medellín, Cali, Cartagena y Barranquilla con vuelos directos de solo ida. Busca, elige tu asiento y reserva en minutos.</p>
        </div>
        <FlightSearch stacked search={{ origin: "", destination: "", date: "" }} />
      </div>
      <RouteMap />
    </section>

    <section aria-labelledby="como-funciona" className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="como-funciona" className="text-3xl font-extrabold">Cómo reservar</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => <li key={title} className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-caribe-soft text-caribe-strong"><Icon aria-hidden="true" className="size-5" /></span>
            <div>
              <h3 className="text-lg font-bold"><span className="text-muted">{i + 1}.</span> {title}</h3>
              <p className="mt-1 text-muted">{text}</p>
            </div>
          </li>)}
        </ol>
      </div>
    </section>

    <section aria-labelledby="tarifas" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <h2 id="tarifas" className="text-3xl font-extrabold">Dos formas de viajar</h2>
          <p className="mt-3 max-w-md text-muted">Cada vuelo tiene una tarifa base. Plus suma {formatCOP(50000)} por pasajero e incluye equipaje de cabina. No vendemos equipaje adicional.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FARE_CATEGORIES.map((c) => <div key={c.name} className={c.name === "Plus" ? "rounded-3xl bg-guayacan-soft p-6 ring-1 ring-guayacan/50" : "rounded-3xl bg-white p-6 ring-1 ring-line"}>
            <p className="font-display text-2xl font-extrabold">{c.name}</p>
            <p className="mt-1 text-sm text-muted">{c.surcharge === 0 ? "Tarifa base del vuelo" : `Tarifa base + ${formatCOP(c.surcharge)}`}</p>
            <p className="mt-6 font-medium">{c.baggage}</p>
          </div>)}
        </div>
      </div>
    </section>
  </main>
}
