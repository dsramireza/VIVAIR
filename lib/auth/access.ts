export type Role = "Passenger" | "Administrator"

export function canAccessAdmin(role: Role | null | undefined) {
  return role === "Administrator"
}

export function publicRegistrationRole(): Role {
  return "Passenger"
}

export function registrationMessage(errorCode?: string, hasIdentity = true) {
  if (errorCode === "user_already_exists" || !hasIdentity) {
    return "Ya existe una cuenta con este correo"
  }
  return "No pudimos crear la cuenta. Intenta nuevamente."
}

export function loginMessage(code?: string) {
  if (code === "email_not_confirmed") return "Debes confirmar tu correo antes de ingresar."
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return "Demasiados intentos. Intenta más tarde."
  return "Correo o contraseña incorrectos"
}
