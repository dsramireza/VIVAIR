export type BookingStatus = "Confirmed" | "Cancelled"

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

export function mapReservation(row: any): Reservation {
  return {
    id: row.id,
    code: row.code,
    total: Number(row.total),
    status: row.status,
    departureAt: row.flights.departure_at,
    origin: row.flights.origin,
    destination: row.flights.destination,
    passengers: (row.booking_passengers ?? []).map((passenger: any) => ({
      name: passenger.name,
      documentType: passenger.document_type,
      documentNumber: passenger.document_number,
      seat: passenger.flight_seats.label,
    })),
  }
}
