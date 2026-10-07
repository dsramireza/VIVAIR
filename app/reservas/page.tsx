import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  return <main className="mx-auto max-w-5xl px-5 py-12"><div className="flex items-start justify-between gap-6"><div className="flex flex-col gap-2"><p className="font-bold text-[var(--primary)]">Área de pasajero</p><h1 className="text-4xl font-black">Mis reservas</h1><p className="text-[var(--muted)]">Aquí podrás consultar y gestionar tus próximos viajes.</p></div><form action={logout}><Button className="bg-slate-700">Cerrar sesión</Button></form></div><section className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center"><h2 className="text-xl font-bold">Aún no tienes reservas</h2><p className="mt-2 text-[var(--muted)]">La búsqueda de vuelos estará disponible en la siguiente historia.</p></section></main>
}
