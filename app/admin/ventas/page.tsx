import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatCOP } from "@/lib/flights"

export const metadata = { title: "Ventas | VIVAIR" }

type SalesSummary = { confirmed_bookings: number; confirmed_passengers: number; sales_cop: number | string }

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Administrator") notFound()

  const { data, error } = await supabase.rpc("admin_sales_summary")
  if (error) throw new Error("No pudimos cargar las ventas")
  const summary = (data?.[0] ?? { confirmed_bookings: 0, confirmed_passengers: 0, sales_cop: 0 }) as SalesSummary

  return <main className="mx-auto max-w-6xl px-5 py-12">
    <p className="font-bold text-[var(--primary)]">Administración</p>
    <h1 className="mt-2 text-4xl font-black">Ventas simuladas</h1>
    <p className="mt-3 text-[var(--muted)]">Solo se cuentan reservas confirmadas. Las cancelaciones se excluyen de todos los totales.</p>
    <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Resumen de ventas">
      <article className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"><h2 className="text-sm font-semibold text-[var(--muted)]">Reservas confirmadas</h2><p className="mt-3 text-4xl font-black">{summary.confirmed_bookings}</p></article>
      <article className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"><h2 className="text-sm font-semibold text-[var(--muted)]">Pasajeros confirmados</h2><p className="mt-3 text-4xl font-black">{summary.confirmed_passengers}</p></article>
      <article className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"><h2 className="text-sm font-semibold text-[var(--muted)]">Ingresos simulados</h2><p className="mt-3 text-4xl font-black">{formatCOP(Number(summary.sales_cop))}</p></article>
    </section>
  </main>
}
