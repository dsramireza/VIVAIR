import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"
import { AuthShell } from "@/components/auth-shell"
import { register } from "@/app/auth/actions"

export const metadata: Metadata = { title: "Crear cuenta" }

export default function RegisterPage() {
  return <AuthShell title="Crea tu cuenta" description="El registro público crea únicamente una cuenta de pasajero. No necesitas confirmar el correo.">
    <AuthForm mode="register" action={register} />
  </AuthShell>
}
