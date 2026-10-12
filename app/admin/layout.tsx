import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Administrator") notFound()

  return <>
    <nav aria-label="Administración" className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-5 py-3 text-sm font-semibold text-[var(--primary)]">
        <Link href="/admin/vuelos">Vuelos</Link>
        <Link href="/admin/ventas">Ventas</Link>
      </div>
    </nav>
    {children}
  </>
}
