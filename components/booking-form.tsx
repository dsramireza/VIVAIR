"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlert, CircleCheck, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { bookingErrorMessage, calculateBookingTotal, paymentResultMessage, togglePassengerSeat, validatePassengerSelection, type BookingFlight, type BookingSeat, type PassengerIdentity } from "@/lib/booking"
import { formatCOP } from "@/lib/flights"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input, Label, Select } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const ROWS = ["1", "2", "3", "4", "5"]

export function BookingForm({ flight }: { flight: BookingFlight }) {
  const router = useRouter()
  const [selected, setSelected] = useState<PassengerIdentity[]>([])
  const [payment, setPayment] = useState<"Approved" | "Rejected">("Approved")
  const [message, setMessage] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirmed, setConfirmed] = useState<{ code: string; total: number; seats: string[] } | null>(null)
  const total = useMemo(() => calculateBookingTotal(flight.baseFare, selected), [flight.baseFare, selected])
  const seatAt = (label: string) => flight.seats.find((seat) => seat.label === label)

  function toggleSeat(seat: BookingSeat) {
    if (seat.occupied) return
    const result = togglePassengerSeat(selected, seat)
    setSelected(result.selection)
    setMessage(result.message)
  }

  function updatePassenger(index: number, field: "name" | "documentType" | "documentNumber", value: string) {
    setSelected((current) => current.map((passenger, i) => i === index ? { ...passenger, [field]: value } : passenger))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    const validation = validatePassengerSelection(selected)
    if (validation) { setMessage(validation); return }
    if (payment === "Rejected") { setMessage(paymentResultMessage(payment)); return }
    setPending(true)
    const { data, error } = await createClient().rpc("create_mock_booking", { p_flight_id: flight.id, p_passengers: selected.map(({ seatLabel, name, documentType, documentNumber }) => ({ seat_label: seatLabel, name, document_type: documentType, document_number: documentNumber })), p_payment: payment })
    setPending(false)
    if (error) { setMessage(bookingErrorMessage(error.message)); router.refresh(); return }
    const result = data?.[0]
    if (!result) { setMessage("No pudimos crear la reserva. Intenta nuevamente."); return }
    setConfirmed({ code: result.booking_code, total: Number(result.total), seats: selected.map((p) => p.seatLabel) })
    setMessage(null)
    router.refresh()
  }

  if (confirmed) return <section role="status" className="ticket overflow-hidden rounded-3xl bg-white ring-1 ring-line">
    <div className="flex flex-col items-start gap-4 bg-night p-7 text-white sm:p-9">
      <CircleCheck aria-hidden="true" className="size-9 text-guayacan" />
      <h2 className="text-3xl font-extrabold">Reserva confirmada</h2>
      <p className="text-white/75">Reserva {confirmed.code} confirmada por {confirmed.total.toLocaleString("es-CO")} COP</p>
    </div>
    <div className="grid gap-6 p-7 sm:grid-cols-3 sm:p-9">
      <div><p className="text-sm text-muted">Código</p><p className="font-display text-3xl font-extrabold tracking-wide">{confirmed.code}</p></div>
      <div><p className="text-sm text-muted">Asientos</p><p className="font-display text-3xl font-extrabold">{confirmed.seats.join(", ")}</p></div>
      <div><p className="text-sm text-muted">Total pagado</p><p className="font-display text-3xl font-extrabold">{formatCOP(confirmed.total)}</p></div>
    </div>
    <div className="flex flex-wrap gap-3 border-t border-line px-7 py-5 sm:px-9">
      <Link className={buttonVariants()} href="/reservas">Ver mis reservas</Link>
      <Button variant="outline" type="button" onClick={() => { setConfirmed(null); setSelected([]); setAttempted(false) }}>Reservar más asientos</Button>
    </div>
  </section>

  return <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
    <section aria-labelledby="seat-heading" className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7">
      <h2 id="seat-heading" className="text-2xl font-extrabold">Selecciona tus asientos</h2>
      <p className="mt-1 text-muted">Puedes seleccionar hasta cuatro pasajeros. Los asientos ocupados aparecen bloqueados.</p>
      <SeatLegend />
      <fieldset className="mt-6">
        <legend className="sr-only">Mapa de asientos</legend>
        <div className="mx-auto max-w-[340px] rounded-t-[150px] rounded-b-[36px] border-2 border-line bg-paper px-5 pb-6 pt-20">
          <div aria-hidden="true" className="mb-3 grid grid-cols-[1fr_1fr_36px_1fr_1fr] gap-2 text-center text-xs font-bold text-muted">
            <span>A</span><span>B</span><span /><span>C</span><span>D</span>
          </div>
          <div className="flex flex-col gap-2">
            {ROWS.map((row) => <div key={row} className={cn("grid grid-cols-[1fr_1fr_36px_1fr_1fr] items-center gap-2 rounded-xl", Number(row) <= 2 && "bg-guayacan-soft/70 py-1.5 -mx-2 px-2", row === "3" && "mt-3")}>
              {["A", "B", "", "C", "D"].map((col) => col === ""
                ? <span key="aisle" aria-hidden="true" className="text-center text-xs font-bold text-muted">{row}</span>
                : <SeatButton key={col} seat={seatAt(`${row}${col}`)} active={selected.some((p) => p.seatLabel === `${row}${col}`)} onToggle={toggleSeat} />)}
            </div>)}
          </div>
        </div>
      </fieldset>
      {message && !attempted && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl bg-guayacan-soft p-3 font-medium text-guayacan-ink"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{message}</p>}
    </section>

    <div className="flex flex-col gap-6 lg:sticky lg:top-24">
      {selected.length > 0 && <section aria-labelledby="passengers-heading" className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
        <h2 id="passengers-heading" className="text-xl font-extrabold">Datos de los pasajeros</h2>
        <div className="mt-4 flex flex-col gap-5">
          {selected.map((passenger, index) => {
            const s = passenger.seatLabel
            const missing = { name: attempted && !passenger.name.trim(), type: attempted && !passenger.documentType, number: attempted && !passenger.documentNumber.trim() }
            return <fieldset key={s} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
              <legend className="flex w-full items-center gap-2 font-semibold">
                <span className={cn("grid size-8 place-items-center rounded-lg text-sm font-bold", passenger.category === "Plus" ? "bg-guayacan text-night" : "bg-caribe text-white")}>{s}</span>
                <span>Pasajero {index + 1} <span className="font-normal text-muted">({passenger.category})</span></span>
              </legend>
              <Label htmlFor={`name-${s}`}>Nombre completo
                <Input id={`name-${s}`} autoComplete="off" aria-invalid={missing.name} aria-describedby={missing.name ? `name-error-${s}` : undefined} value={passenger.name} onChange={(e) => updatePassenger(index, "name", e.target.value)} />
              </Label>
              {missing.name && <p id={`name-error-${s}`} className="-mt-1 text-sm font-medium text-coral">Falta el nombre del pasajero del asiento {s}.</p>}
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <Label htmlFor={`type-${s}`}>Documento
                  <Select id={`type-${s}`} aria-invalid={missing.type} aria-describedby={missing.type ? `type-error-${s}` : undefined} value={passenger.documentType} onChange={(e) => updatePassenger(index, "documentType", e.target.value as PassengerIdentity["documentType"])}>
                    <option value="">Tipo</option><option value="CC">CC</option><option value="CE">CE</option><option value="Pasaporte">Pasaporte</option>
                  </Select>
                </Label>
                <Label htmlFor={`number-${s}`}>Número de documento
                  <Input id={`number-${s}`} inputMode="numeric" autoComplete="off" aria-invalid={missing.number} aria-describedby={missing.number ? `number-error-${s}` : undefined} value={passenger.documentNumber} onChange={(e) => updatePassenger(index, "documentNumber", e.target.value)} />
                </Label>
              </div>
              {missing.type && <p id={`type-error-${s}`} className="-mt-1 text-sm font-medium text-coral">Falta el tipo de documento del asiento {s}.</p>}
              {missing.number && <p id={`number-error-${s}`} className="-mt-1 text-sm font-medium text-coral">Falta el número de documento del asiento {s}.</p>}
            </fieldset>
          })}
        </div>
      </section>}

      <section aria-labelledby="summary-heading" className="rounded-3xl bg-night p-5 text-white sm:p-6">
        <h2 id="summary-heading" className="text-xl font-extrabold">Resumen</h2>
        {selected.length === 0
          ? <p className="mt-3 text-white/70">Toca un asiento libre en el mapa para empezar.</p>
          : <ul className="mt-4 flex flex-col gap-2 text-sm">
            {selected.map((p) => <li key={p.seatLabel} className="flex justify-between gap-4">
              <span>Asiento {p.seatLabel} <span className="text-white/60">{p.category}</span></span>
              <span>{formatCOP(flight.baseFare + (p.category === "Plus" ? 50000 : 0))}</span>
            </li>)}
          </ul>}
        <p className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-4">
          <span className="text-white/70">Total</span>
          <span className="font-display text-3xl font-extrabold">{formatCOP(total)} <span className="text-base font-semibold text-white/70">COP</span></span>
        </p>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Resultado del pago simulado</legend>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
            {(["Approved", "Rejected"] as const).map((value) => <label key={value} className={cn("cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-guayacan", payment === value ? "bg-white text-night" : "text-white/80 hover:text-white")}>
              <input type="radio" name="payment-result" value={value} checked={payment === value} onChange={() => setPayment(value)} className="sr-only" />
              {value === "Approved" ? "Aprobado" : "Rechazado"}
            </label>)}
          </div>
          <p className="mt-2 text-xs text-white/60">No se piden datos de tarjeta. Solo un pago aprobado crea la reserva.</p>
        </fieldset>
        <Button type="submit" variant="accent" disabled={pending} className="mt-5 w-full">{pending ? "Procesando pago…" : "Confirmar pago y reservar"}</Button>
        {message && attempted && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 text-sm font-medium text-coral"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{message}</p>}
      </section>
    </div>
  </form>
}

function SeatButton({ seat, active, onToggle }: { seat?: BookingSeat; active: boolean; onToggle: (seat: BookingSeat) => void }) {
  if (!seat) return <span aria-hidden="true" />
  const plus = seat.category === "Plus"
  return <button type="button" aria-pressed={active} aria-disabled={seat.occupied} disabled={seat.occupied} onClick={() => onToggle(seat)}
    aria-label={`Asiento ${seat.label}, ${seat.category}${seat.occupied ? ", ocupado" : active ? ", seleccionado" : ", disponible"}`}
    title={`${seat.label} · ${seat.category}`}
    className={cn("relative grid aspect-square place-items-center rounded-t-xl rounded-b-md border-2 text-sm font-bold transition-colors",
      seat.occupied && "cursor-not-allowed border-transparent bg-[#dfe5e2] text-muted/60",
      !seat.occupied && !active && (plus ? "border-guayacan bg-white text-guayacan-ink hover:bg-guayacan-soft" : "border-caribe/40 bg-white text-caribe-strong hover:border-caribe hover:bg-caribe-soft"),
      active && "border-caribe bg-caribe text-white")}>
    {seat.occupied ? <X aria-hidden="true" className="size-4" /> : seat.label}
  </button>
}

function SeatLegend() {
  const item = "flex items-center gap-2"
  const box = "size-4 rounded-t-[5px] rounded-b-[3px] border-2"
  return <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Leyenda del mapa">
    <li className={item}><span className={cn(box, "border-guayacan bg-white")} />Plus, filas 1 y 2</li>
    <li className={item}><span className={cn(box, "border-caribe/40 bg-white")} />Estándar, filas 3 a 5</li>
    <li className={item}><span className={cn(box, "border-caribe bg-caribe")} />Tu selección</li>
    <li className={item}><span className={cn(box, "border-transparent bg-[#dfe5e2]")} />Ocupado</li>
  </ul>
}
