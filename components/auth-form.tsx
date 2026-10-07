"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AuthState } from "@/app/auth/actions"

const initialState: AuthState = {}

type Props = {
  mode: "login" | "register"
  action: (state: AuthState, formData: FormData) => Promise<AuthState>
}

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const registering = mode === "register"

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {registering && <Field label="Nombre completo" name="name" type="text" autoComplete="name" />}
      <Field label="Correo electrónico" name="email" type="email" autoComplete="email" />
      <Field label="Contraseña" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} />
      <div aria-live="polite" className="min-h-6 text-sm font-medium">
        {state.error && <p className="text-red-700">{state.error}</p>}
        {state.success && <p className="text-emerald-700">{state.success}</p>}
      </div>
      <Button disabled={pending}>{pending ? "Procesando…" : registering ? "Crear cuenta" : "Ingresar"}</Button>
      <p className="text-center text-sm text-[var(--muted)]">
        {registering ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}
        <Link className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline" href={registering ? "/ingresar" : "/registro"}>
          {registering ? "Ingresa" : "Regístrate"}
        </Link>
      </p>
    </form>
  )
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, name, ...inputProps } = props
  return (
    <label className="flex flex-col gap-2 font-medium" htmlFor={name}>
      {label}
      <Input id={name} name={name} required {...inputProps} />
    </label>
  )
}
