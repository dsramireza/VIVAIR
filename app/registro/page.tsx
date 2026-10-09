import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"
import { register } from "@/app/auth/actions"

export const metadata: Metadata = { title: "Crear cuenta" }

export default function RegisterPage() {
  return <AuthPage title="Crea tu cuenta" description="El registro público crea únicamente una cuenta de pasajero."><AuthForm mode="register" action={register} /></AuthPage>
}

function AuthPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md items-center px-5 py-12"><section className="w-full rounded-2xl border border-[var(--border)] bg-white p-7 shadow-xl shadow-slate-900/5"><div className="mb-7 flex flex-col gap-2"><p className="text-sm font-bold uppercase tracking-widest text-[var(--primary)]">VIVAIR</p><h1 className="text-3xl font-black">{title}</h1><p className="text-[var(--muted)]">{description}</p></div>{children}</section></main>
}
