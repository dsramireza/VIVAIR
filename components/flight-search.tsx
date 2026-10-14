"use client"

import { useState } from "react"
import { ArrowLeftRight, Search as SearchIcon } from "lucide-react"
import { CITIES, type Search } from "@/lib/flights"
import { Input, Label, Select } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FlightSearch({ search, stacked = false }: { search: Search; stacked?: boolean }) {
  const [origin, setOrigin] = useState(search.origin)
  const [destination, setDestination] = useState(search.destination)

  return <form action="/vuelos" className={cn("grid gap-3 rounded-[22px] border border-line bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,42,61,0.45)] sm:p-5",
    stacked ? "sm:grid-cols-[1fr_auto_1fr] sm:items-end" : "md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-end")}>
    <Label>Origen
      <Select name="origin" required value={origin} onChange={(e) => setOrigin(e.target.value)}>
        <option value="">Selecciona una ciudad</option>
        {CITIES.map((city) => <option key={city}>{city}</option>)}
      </Select>
    </Label>
    <button type="button" onClick={() => { setOrigin(destination); setDestination(origin) }}
      className={cn("mx-auto -my-1 grid size-10 place-items-center rounded-full border border-line bg-white text-caribe transition-colors hover:border-caribe", stacked ? "sm:my-0 sm:mb-1" : "md:my-0 md:mb-1")}
      aria-label="Intercambiar origen y destino">
      <ArrowLeftRight aria-hidden="true" className={cn("size-4 rotate-90", stacked ? "sm:rotate-0" : "md:rotate-0")} />
    </button>
    <Label>Destino
      <Select name="destination" required value={destination} onChange={(e) => setDestination(e.target.value)}>
        <option value="">Selecciona una ciudad</option>
        {CITIES.map((city) => <option key={city}>{city}</option>)}
      </Select>
    </Label>
    <Label className={stacked ? "sm:col-span-2" : undefined}>Fecha de salida
      <Input type="date" name="date" required defaultValue={search.date} />
    </Label>
    <Button className="min-h-12 self-end md:px-6"><SearchIcon aria-hidden="true" className="size-4" />Buscar vuelos</Button>
  </form>
}
