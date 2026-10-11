export type SeatCategory = "Estándar" | "Plus"

export type PassengerIdentity = {
  seatLabel: string
  category: SeatCategory
  name: string
  documentType: "CC" | "CE" | "Pasaporte" | ""
  documentNumber: string
}

export function validatePassengerSelection(passengers: PassengerIdentity[]) {
  if (passengers.length < 1 || passengers.length > 4) {
    return "Una reserva puede incluir entre 1 y 4 pasajeros"
  }
  const seats = new Set(passengers.map((passenger) => passenger.seatLabel))
  if (seats.size !== passengers.length) return "Selecciona asientos distintos"
  for (const passenger of passengers) {
    if (!passenger.name.trim()) return `Completa el nombre del pasajero del asiento ${passenger.seatLabel}`
    if (!passenger.documentType) return `Completa el tipo de documento del asiento ${passenger.seatLabel}`
    if (!passenger.documentNumber.trim()) return `Completa el número de documento del asiento ${passenger.seatLabel}`
  }
  return null
}

export function togglePassengerSeat(current: PassengerIdentity[], seat: BookingSeat) {
  if (seat.occupied) return { selection: current, message: null }
  if (current.some((item) => item.seatLabel === seat.label)) {
    return { selection: current.filter((item) => item.seatLabel !== seat.label), message: null }
  }
  if (current.length >= 4) {
    return { selection: current, message: "No puedes seleccionar un quinto pasajero: el máximo es cuatro." }
  }
  return {
    selection: [...current, { seatLabel: seat.label, category: seat.category, name: "", documentType: "" as const, documentNumber: "" }],
    message: null,
  }
}

export function calculateBookingTotal(baseFare: number, passengers: PassengerIdentity[]) {
  return passengers.reduce((total, passenger) => total + baseFare + (passenger.category === "Plus" ? 50000 : 0), 0)
}

export function paymentResultMessage(result: "Approved" | "Rejected") {
  return result === "Approved" ? "Pago aprobado" : "Pago rechazado. No se creó la reserva y los asientos siguen disponibles."
}

export function bookingErrorMessage(message: string) {
  if (message.startsWith("seat_unavailable:")) return `El asiento ${message.split(":")[1]} ya no está disponible`
  if (message === "booking_passenger_limit") return "Una reserva puede incluir entre 1 y 4 pasajeros"
  if (message === "identity_required") return "Completa los datos de identidad de cada pasajero"
  return "No pudimos crear la reserva. Intenta nuevamente."
}

export type BookingSeat = { id: string; label: string; category: SeatCategory; occupied: boolean }
export type BookingFlight = { id: string; baseFare: number; seats: BookingSeat[] }
export type BookingResult = { bookingId: string; bookingCode: string; total: number }
