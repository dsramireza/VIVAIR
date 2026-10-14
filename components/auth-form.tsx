"use client"

import { useActionState } from "react"
import Link from "next/link"
import { CircleAlert, CircleCheck } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
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
      <Field label="Contraseña" name="password" type="password" minLength={registering ? 8 : undefined} autoComplete={registering ? "new-password" : "current-password"}
        hint={registering ? "Mínimo 8 caracteres." : undefined} />
      <div aria-live="polite">
        {state.error && <p className="flex items-start gap-2 rounded-xl bg-coral-soft p-3 text-sm font-medium text-coral"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{state.error}</p>}
        {state.success && <div className="flex flex-col items-start gap-3 rounded-xl bg-ok-soft p-3 text-sm font-medium text-ok">
          <p className="flex items-start gap-2"><CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{state.success}</p>
          {registering && <Link className={buttonVariants({ size: "sm" })} href="/ingresar">Ir a ingresar</Link>}
        </div>}
      </div>
      <Button disabled={pending} className="w-full">{pending ? "Procesando…" : registering ? "Crear cuenta" : "Ingresar"}</Button>
      <p className="text-center text-sm text-muted">
        {registering ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}
        <Link className="font-semibold text-caribe underline-offset-4 hover:underline" href={registering ? "/ingresar" : "/registro"}>
          {registering ? "Ingresa" : "Regístrate"}
        </Link>
      </p>
    </form>
  )
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string }) {
  const { label, name, hint, ...inputProps } = props
  return (
    <Label htmlFor={name}>
      {label}
      <Input id={name} name={name} required aria-describedby={hint ? `${name}-hint` : undefined} {...inputProps} />
      {hint && <span id={`${name}-hint`} className="text-xs font-normal text-muted">{hint}</span>}
    </Label>
  )
}
