import { describe, expect, it } from "vitest"
import { canAccessAdmin, loginMessage, publicRegistrationRole, registrationMessage } from "@/lib/auth/access"

describe("HU-001 registro público", () => {
  it("siempre asigna el rol Passenger", () => {
    expect(publicRegistrationRole()).toBe("Passenger")
  })

  it("informa un correo existente con el mensaje aprobado", () => {
    expect(registrationMessage("user_already_exists")).toBe("Ya existe una cuenta con este correo")
    expect(registrationMessage(undefined, false)).toBe("Ya existe una cuenta con este correo")
  })
})

describe("HU-002 acceso por rol", () => {
  it("rechaza Passenger y permite Administrator en administración", () => {
    expect(canAccessAdmin("Passenger")).toBe(false)
    expect(canAccessAdmin("Administrator")).toBe(true)
  })

  it("no revela si el correo existe al fallar las credenciales", () => {
    expect(loginMessage("invalid_credentials")).toBe("Correo o contraseña incorrectos")
  })
})
