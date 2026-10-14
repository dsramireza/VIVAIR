import Link from "next/link"
import { redirect } from "next/navigation"
import { BellRing, Plane, Ticket } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatCop, mapReservation, type Reservation } from "@/lib/reservations"
import { CancelReservationButton } from "@/components/cancel-reservation-button"
import { PrintButton } from "@/components/print-button"
import { RouteCodes } from "@/components/route-codes"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { bogotaShortDate, bogotaTime, iataCode } from "@/lib/airports"
import { cn } from "@/lib/utils"

export const metadata = { title: "Mis reservas" }

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")

  const { data, error } = await supabase
    .from("bookings")
    .select("id, code, total, status, cancelled_origin, cancelled_destination, cancelled_departure_at, flights(origin, destination, departure_at), booking_passengers(name, document_type, document_number, flight_seats(label))")
    .eq("passenger_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw new Error("No se pudieron cargar las reservas")
  const reservations = (data ?? []).map(mapReservation)
  const { data: notices, error: noticesError } = await supabase.from("flight_change_notices")
    .select("id, old_origin, old_destination, old_departure_at, new_origin, new_destination, new_departure_at")
    .eq("passenger_id", user.id).order("created_at", { ascending: false })
  if (noticesError) throw new Error("No se pudieron cargar los avisos")
  const name = String(user.user_metadata?.name ?? "").split(" ")[0]

  return <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Mis reservas</h1>
        <p className="mt-2 text-muted">{name ? `Hola, ${name}. ` : ""}Consulta y gestiona tus viajes.</p>
      </div>
      <Link className={buttonVariants({ variant: "outline" })} href="/vuelos"><Plane aria-hidden="true" className="size-4" />Buscar otro vuelo</Link>
    </header>

    <section aria-labelledby="notices-heading" className="no-print">
      <h2 id="notices-heading" className="flex items-center gap-2 text-xl font-bold"><BellRing aria-hidden="true" className="size-5 text-guayacan-ink" />Avisos de cambios de vuelo</h2>
      {(notices ?? []).length === 0
        ? <p className="mt-2 text-muted">No tienes avisos de cambios.</p>
        : <ul className="mt-4 grid gap-3">{(notices ?? []).map((notice) => <li key={notice.id} className="rounded-2xl border-l-4 border-guayacan bg-guayacan-soft p-5">
          <p className="font-semibold">Tu vuelo cambió de ruta u horario</p>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <NoticeLeg label="Antes" origin={notice.old_origin} destination={notice.old_destination} departure={notice.old_departure_at} muted />
            <NoticeLeg label="Ahora" origin={notice.new_origin} destination={notice.new_destination} departure={notice.new_departure_at} />
          </div>
        </li>)}</ul>}
    </section>

    <section aria-label="Reservas" className="flex flex-col gap-6">
      {reservations.length === 0
        ? <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line px-6 py-14 text-center">
          <Ticket aria-hidden="true" className="size-8 text-muted" />
          <h2 className="text-xl font-bold">Aún no tienes reservas</h2>
          <p className="text-muted">Tus reservas confirmadas aparecerán aquí.</p>
          <Link className={cn(buttonVariants(), "mt-2")} href="/vuelos">Buscar vuelos</Link>
        </div>
        : reservations.map((reservation) => <BoardingPass key={reservation.id} reservation={reservation} />)}
    </section>
  </main>
}

function NoticeLeg({ label, origin, destination, departure, muted = false }: { label: string; origin: string; destination: string; departure: string; muted?: boolean }) {
  return <div className={cn("rounded-xl bg-white/70 p-3", muted && "text-muted")}>
    <p className="font-semibold"><span className="font-normal">{label}:</span> <span className={cn(muted && "line-through decoration-1")}>{origin} → {destination}</span></p>
    <p>{bogotaShortDate(departure)}, {bogotaTime(departure)}</p>
  </div>
}

function BoardingPass({ reservation }: { reservation: Reservation }) {
  const cancelled = reservation.status === "Cancelled"
  return <article className={cn("ticket grid overflow-hidden rounded-3xl bg-white ring-1 ring-line md:grid-cols-[1fr_260px]", cancelled && "opacity-75")}>
    <div className="flex flex-col gap-6 p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Reserva <span className="font-display text-base font-extrabold tracking-wide text-ink">{reservation.code}</span></p>
        {cancelled ? <Badge tone="coral">Cancelada</Badge> : <Badge tone="ok">Confirmada</Badge>}
      </div>
      <h2 className="sr-only">{reservation.origin} → {reservation.destination}</h2>
      <RouteCodes origin={reservation.origin} destination={reservation.destination} />
      <dl className="grid grid-cols-3 gap-4 border-t border-line pt-5">
        <div><dt className="text-xs text-muted">Fecha</dt><dd className="font-semibold">{bogotaShortDate(reservation.departureAt)}</dd></div>
        <div><dt className="text-xs text-muted">Salida</dt><dd className="font-semibold">{bogotaTime(reservation.departureAt)}</dd></div>
        <div><dt className="text-xs text-muted">Total</dt><dd className="font-semibold">{formatCop(reservation.total)}</dd></div>
      </dl>
    </div>
    <div className="ticket-perforation flex flex-col gap-4 bg-paper/60 p-6 sm:p-7">
      <p className="text-xs font-semibold text-muted">Pasajeros ({reservation.passengers.length})</p>
      <ul className="flex flex-col gap-3">
        {reservation.passengers.map((passenger) => <li key={`${reservation.id}-${passenger.seat}`} className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-night font-display text-sm font-extrabold text-white" aria-label={`Asiento ${passenger.seat}`}>{passenger.seat}</span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{passenger.name}</span>
            <span className="block text-xs text-muted">{passenger.documentType} {passenger.documentNumber}</span>
          </span>
        </li>)}
      </ul>
      <div className="no-print mt-auto flex flex-wrap gap-2 pt-2">
        {!cancelled && <CancelReservationButton bookingId={reservation.id} />}
        {!cancelled && <PrintButton label={`Imprimir pase ${iataCode(reservation.origin)}-${iataCode(reservation.destination)}`} />}
      </div>
    </div>
  </article>
}
