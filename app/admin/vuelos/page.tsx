import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { canAccessAdmin, type Role } from "@/lib/auth/access"

export default async function AdminFlightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!canAccessAdmin(profile?.role as Role | undefined)) notFound()
  return <main className="mx-auto max-w-6xl px-5 py-12"><p className="font-bold text-[var(--primary)]">Administración</p><h1 className="mt-2 text-4xl font-black">Gestión de vuelos</h1><p className="mt-3 text-[var(--muted)]">Acceso autorizado. La gestión de vuelos se implementará en HU-009.</p></main>
}
