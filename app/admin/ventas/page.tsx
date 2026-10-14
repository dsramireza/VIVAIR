import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatCOP } from "@/lib/flights"
import { AdminHeader } from "@/components/admin-ui"

export const metadata = { title: "Ventas" }

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
  const sales = Number(summary.sales_cop)
  const bookings = Number(summary.confirmed_bookings)
  const passengers = Number(summary.confirmed_passengers)

  return <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
    <AdminHeader title="Ventas simuladas" description="Solo se cuentan reservas confirmadas. Las cancelaciones se excluyen de todos los totales." />
    <section aria-label="Resumen de ventas" className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
      <article className="flex flex-col justify-between gap-10 rounded-3xl bg-night p-7 text-white">
        <h2 className="font-sans text-sm font-semibold text-white/70">Ingresos simulados</h2>
        <p className="font-display text-5xl font-extrabold sm:text-6xl">{formatCOP(sales)} <span className="text-lg font-semibold text-white/60">COP</span></p>
      </article>
      <article className="flex flex-col justify-between gap-10 rounded-3xl bg-white p-7 ring-1 ring-line">
        <h2 className="font-sans text-sm font-semibold text-muted">Reservas confirmadas</h2>
        <p className="font-display text-5xl font-extrabold">{bookings}</p>
      </article>
      <article className="flex flex-col justify-between gap-10 rounded-3xl bg-white p-7 ring-1 ring-line">
        <h2 className="font-sans text-sm font-semibold text-muted">Pasajeros confirmados</h2>
        <p className="font-display text-5xl font-extrabold">{passengers}</p>
      </article>
    </section>
    <dl className="grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2">
      <div className="bg-white px-6 py-4"><dt className="text-sm text-muted">Promedio por reserva</dt><dd className="font-display text-2xl font-extrabold">{bookings ? formatCOP(Math.round(sales / bookings)) : "—"}</dd></div>
      <div className="bg-white px-6 py-4"><dt className="text-sm text-muted">Pasajeros por reserva</dt><dd className="font-display text-2xl font-extrabold">{bookings ? (passengers / bookings).toLocaleString("es-CO", { maximumFractionDigits: 1 }) : "—"}</dd></div>
    </dl>
  </main>
}
