import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"
import { AuthShell } from "@/components/auth-shell"
import { login } from "@/app/auth/actions"

export const metadata: Metadata = { title: "Ingresar" }

export default function LoginPage() {
  return <AuthShell title="Ingresa a VIVAIR" description="Accede con tu correo y contraseña para reservar y ver tus viajes.">
    <AuthForm mode="login" action={login} />
  </AuthShell>
}
