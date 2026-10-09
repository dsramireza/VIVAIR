import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"
import { login } from "@/app/auth/actions"

export const metadata: Metadata = { title: "Ingresar" }

export default function LoginPage() {
  return <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md items-center px-5 py-12"><section className="w-full rounded-2xl border border-[var(--border)] bg-white p-7 shadow-xl shadow-slate-900/5"><div className="mb-7 flex flex-col gap-2"><p className="text-sm font-bold uppercase tracking-widest text-[var(--primary)]">Bienvenido</p><h1 className="text-3xl font-black">Ingresa a VIVAIR</h1><p className="text-[var(--muted)]">Accede con tu correo y contraseña.</p></div><AuthForm mode="login" action={login} /></section></main>
}
