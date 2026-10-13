import { redirect } from "next/navigation"
import { logout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { formatCop, mapReservation } from "@/lib/reservations"
import { CancelReservationButton } from "@/components/cancel-reservation-button"
import { formatDeparture } from "@/lib/flights"

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

  return <main className="mx-auto max-w-5xl px-5 py-12">
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2"><p className="font-bold text-[var(--primary)]">Área de pasajero</p><h1 className="text-4xl font-black">Mis reservas</h1><p className="text-[var(--muted)]">Consulta y gestiona tus viajes.</p></div>
      <form action={logout}><Button className="bg-slate-700">Cerrar sesión</Button></form>
    </div>
    <section className="mt-10" aria-labelledby="notices-heading">
      <h2 id="notices-heading" className="text-2xl font-bold">Avisos de cambios de vuelo</h2>
      {(notices ?? []).length === 0
        ? <p className="mt-3 text-[var(--muted)]">No tienes avisos de cambios.</p>
        : <ul className="mt-4 grid gap-3">{(notices ?? []).map((notice) => <li key={notice.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold">Tu vuelo cambió de ruta u horario</p>
          <p className="mt-2 text-sm">Antes: {notice.old_origin} → {notice.old_destination}, {formatDeparture(notice.old_departure_at)}</p>
          <p className="text-sm">Ahora: {notice.new_origin} → {notice.new_destination}, {formatDeparture(notice.new_departure_at)}</p>
        </li>)}</ul>}
    </section>
    <section className="mt-10 flex flex-col gap-5">
      {reservations.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center"><h2 className="text-xl font-bold">Aún no tienes reservas</h2><p className="mt-2 text-[var(--muted)]">Tus reservas confirmadas aparecerán aquí.</p></div> : reservations.map((reservation) => <article key={reservation.id} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-[var(--primary)]">{reservation.code}</p><h2 className="text-xl font-black">{reservation.origin} → {reservation.destination}</h2><p className="text-sm text-[var(--muted)]">Salida: {new Date(reservation.departureAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</p></div><div className="text-right"><p className="font-bold">{formatCop(reservation.total)}</p><p className="text-sm">{reservation.status === "Confirmed" ? "Confirmada" : "Cancelada"}</p></div></div><ul className="mt-5 grid gap-2 sm:grid-cols-2">{reservation.passengers.map((passenger) => <li key={`${reservation.id}-${passenger.seat}`} className="rounded-lg bg-slate-50 p-3"><span className="font-semibold">{passenger.name}</span> · asiento <span className="font-bold">{passenger.seat}</span></li>)}</ul>{reservation.status === "Confirmed" && <CancelReservationButton bookingId={reservation.id} />}</article>)}
    </section>
  </main>
}
