"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { bookingErrorMessage, calculateBookingTotal, paymentResultMessage, togglePassengerSeat, validatePassengerSelection, type BookingFlight, type PassengerIdentity } from "@/lib/booking"

export function BookingForm({ flight }: { flight: BookingFlight }) {
  const [selected, setSelected] = useState<PassengerIdentity[]>([])
  const [payment, setPayment] = useState<"Approved" | "Rejected">("Approved")
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const total = useMemo(() => calculateBookingTotal(flight.baseFare, selected), [flight.baseFare, selected])

  function toggleSeat(seat: BookingFlight["seats"][number]) {
    if (seat.occupied) return
    setMessage(null)
    setSuccess(false)
    const result = togglePassengerSeat(selected, seat)
    setSelected(result.selection)
    setMessage(result.message)
  }

  function updatePassenger(index: number, field: "name" | "documentType" | "documentNumber", value: string) {
    setSelected((current) => current.map((passenger, currentIndex) => currentIndex === index ? { ...passenger, [field]: value } : passenger))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validatePassengerSelection(selected)
    if (validation) { setMessage(validation); return }
    if (payment === "Rejected") { setMessage(paymentResultMessage(payment)); return }
    const supabase = createClient()
    const { data, error } = await supabase.rpc("create_mock_booking", { p_flight_id: flight.id, p_passengers: selected.map(({ seatLabel, name, documentType, documentNumber }) => ({ seat_label: seatLabel, name, document_type: documentType, document_number: documentNumber })), p_payment: payment })
    if (error) { setMessage(bookingErrorMessage(error.message)); return }
    const result = data?.[0]
    if (!result) { setMessage("No pudimos crear la reserva. Intenta nuevamente."); return }
    setSuccess(true)
    setMessage(`Reserva ${result.booking_code} confirmada por ${Number(result.total).toLocaleString("es-CO")} COP`)
  }

  return <form onSubmit={submit} className="flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm" noValidate>
    <div><h2 className="text-2xl font-bold">Selecciona tus asientos</h2><p className="mt-2 text-sm text-slate-600">Puedes seleccionar hasta cuatro pasajeros. Los asientos ocupados aparecen bloqueados.</p></div>
    <fieldset className="flex flex-col gap-3"><legend className="mb-2 font-bold">Mapa de asientos</legend><div className="grid grid-cols-4 gap-3 sm:grid-cols-5">{flight.seats.map((seat) => { const active = selected.some((item) => item.seatLabel === seat.label); return <button type="button" key={seat.id} aria-pressed={active} aria-disabled={seat.occupied} disabled={seat.occupied} onClick={() => toggleSeat(seat)} className={`rounded-lg border px-3 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-sky-700 bg-sky-700 text-white" : "border-slate-300 bg-slate-50 hover:border-sky-600"}`}>{seat.label}<span className="block text-xs font-normal">{seat.category}{seat.occupied ? " · Ocupado" : ""}</span></button> })}</div></fieldset>
    {selected.map((passenger, index) => <fieldset key={passenger.seatLabel} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4"><legend className="px-1 font-bold">Pasajero — asiento {passenger.seatLabel} ({passenger.category})</legend><label htmlFor={`name-${passenger.seatLabel}`}>Nombre<input id={`name-${passenger.seatLabel}`} aria-describedby={`name-error-${passenger.seatLabel}`} value={passenger.name} onChange={(event) => updatePassenger(index, "name", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>{!passenger.name.trim() && <p id={`name-error-${passenger.seatLabel}`} className="text-sm text-amber-800">Falta el nombre del pasajero del asiento {passenger.seatLabel}.</p>}<label htmlFor={`type-${passenger.seatLabel}`}>Tipo de documento<select id={`type-${passenger.seatLabel}`} aria-describedby={`type-error-${passenger.seatLabel}`} value={passenger.documentType} onChange={(event) => updatePassenger(index, "documentType", event.target.value as PassengerIdentity["documentType"])} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">Selecciona</option><option value="CC">CC</option><option value="CE">CE</option><option value="Pasaporte">Pasaporte</option></select></label>{!passenger.documentType && <p id={`type-error-${passenger.seatLabel}`} className="text-sm text-amber-800">Falta el tipo de documento del asiento {passenger.seatLabel}.</p>}<label htmlFor={`number-${passenger.seatLabel}`}>Número de documento<input id={`number-${passenger.seatLabel}`} aria-describedby={`number-error-${passenger.seatLabel}`} value={passenger.documentNumber} onChange={(event) => updatePassenger(index, "documentNumber", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>{!passenger.documentNumber.trim() && <p id={`number-error-${passenger.seatLabel}`} className="text-sm text-amber-800">Falta el número de documento del asiento {passenger.seatLabel}.</p>}</fieldset>)}
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-5"><p className="text-xl font-black">Total: {total.toLocaleString("es-CO")} COP</p><label htmlFor="payment-result">Resultado del pago simulado<select id="payment-result" value={payment} onChange={(event) => setPayment(event.target.value as "Approved" | "Rejected")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="Approved">Approved</option><option value="Rejected">Rejected</option></select></label><button type="submit" className="rounded-lg bg-sky-700 px-4 py-3 font-bold text-white hover:bg-sky-800">Confirmar pago y reservar</button>{message && <p role="alert" className={success ? "rounded-lg bg-emerald-50 p-3 text-emerald-900" : "rounded-lg bg-amber-50 p-3 text-amber-950"}>{message}</p>}</div>
  </form>
}
