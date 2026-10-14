const IATA: Record<string, string> = {
  "Bogotá": "BOG",
  "Medellín": "MDE",
  "Cali": "CLO",
  "Cartagena": "CTG",
  "Barranquilla": "BAQ"
}

/** Código IATA del aeropuerto principal de una ciudad del catálogo. */
export function iataCode(city: string) {
  return IATA[city] ?? city.slice(0, 3).toUpperCase()
}

const zone = "America/Bogota"

/** Hora local de Colombia, p. ej. "7:00 a. m.". */
export function bogotaTime(date: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(new Date(date))
}

/** Fecha corta en Colombia, p. ej. "17 oct 2026". */
export function bogotaShortDate(date: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: zone, day: "numeric", month: "short", year: "numeric" }).format(new Date(date)).replace(".", "").replace(/ de /g, " ")
}

/** Fecha local de Colombia, p. ej. "sáb, 17 de octubre". */
export function bogotaDay(date: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: zone, weekday: "short", day: "numeric", month: "long" }).format(new Date(date))
}
