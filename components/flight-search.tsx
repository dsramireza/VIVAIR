import { CITIES, type Search } from "@/lib/flights"
export function FlightSearch({ search }: { search: Search }) {
  return <form action="/vuelos" className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    {(["origin", "destination"] as const).map((field) => <label key={field} className="flex min-w-40 flex-1 flex-col gap-2 font-semibold text-slate-900">{field === "origin" ? "Origen" : "Destino"}<select name={field} required defaultValue={search[field]} className="rounded-lg border border-slate-300 bg-white p-3"><option value="">Selecciona una ciudad</option>{CITIES.map((city) => <option key={city}>{city}</option>)}</select></label>)}
    <label className="flex min-w-40 flex-1 flex-col gap-2 font-semibold text-slate-900">Fecha de salida<input type="date" name="date" required defaultValue={search.date} className="rounded-lg border border-slate-300 p-3" /></label>
    <button className="rounded-lg bg-[var(--primary)] px-6 py-3 font-bold text-white">Buscar vuelos</button>
  </form>
}
