export type BookingStatus = "Confirmed" | "Cancelled"

type ReservationRow = {
  id: string
  code: string
  total: number | string
  status: BookingStatus
  cancelled_origin?: string | null
  cancelled_destination?: string | null
  cancelled_departure_at?: string | null
  flights: { departure_at: string; origin: string; destination: string } | Array<{ departure_at: string; origin: string; destination: string }>
  booking_passengers?: Array<{
    name: string
    document_type: string
    document_number: string
    flight_seats: { label: string } | Array<{ label: string }>
  }>
}

export type Reservation = {
  id: string
  code: string
  total: number
  status: BookingStatus
  departureAt: string
  origin: string
  destination: string
  passengers: Array<{
    name: string
    documentType: string
    documentNumber: string
    seat: string
  }>
}

export function canCancelReservation(now: Date, departureAt: Date) {
  return now.getTime() < departureAt.getTime()
}

export function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
}

export function mapReservation(row: ReservationRow): Reservation {
  const flight = Array.isArray(row.flights) ? row.flights[0] : row.flights
  const cancelledSnapshot = row.status === "Cancelled" && row.cancelled_origin && row.cancelled_destination && row.cancelled_departure_at
  return {
    id: row.id,
    code: row.code,
    total: Number(row.total),
    status: row.status,
    departureAt: cancelledSnapshot ? row.cancelled_departure_at! : flight.departure_at,
    origin: cancelledSnapshot ? row.cancelled_origin! : flight.origin,
    destination: cancelledSnapshot ? row.cancelled_destination! : flight.destination,
    passengers: (row.booking_passengers ?? []).map((passenger) => ({
      name: passenger.name,
      documentType: passenger.document_type,
      documentNumber: passenger.document_number,
      seat: Array.isArray(passenger.flight_seats) ? passenger.flight_seats[0].label : passenger.flight_seats.label,
    })),
  }
}
