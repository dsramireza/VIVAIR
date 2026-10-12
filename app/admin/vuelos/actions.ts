"use server"

import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { adminFlightError, parseNewFlight } from "@/lib/admin-flights"

const flightIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Administrator") notFound()
  return supabase
}

function returnToList(kind: "error" | "notice", message: string): never {
  const params = new URLSearchParams({ [kind]: message })
  redirect(`/admin/vuelos?${params.toString()}`)
}

export async function createFlight(formData: FormData) {
  const supabase = await requireAdmin()
  const parsed = parseNewFlight(formData)
  if (!parsed.flight) returnToList("error", parsed.error)
  const { error } = await supabase.rpc("admin_create_flight", {
    p_origin: parsed.flight.origin,
    p_destination: parsed.flight.destination,
    p_departure_at: parsed.flight.departureAt,
    p_base_fare: parsed.flight.baseFare,
  })
  if (error) returnToList("error", adminFlightError(error.message))
  revalidatePath("/admin/vuelos")
  returnToList("notice", "Vuelo creado en Borrador con 20 asientos")
}

export async function setFlightStatus(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get("flight_id") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!flightIdPattern.test(id) || !["Published", "Withdrawn"].includes(status)) {
    returnToList("error", "Solicitud de vuelo inválida")
  }
  const { error } = await supabase.rpc("admin_set_flight_status", { p_flight_id: id, p_status: status })
  if (error) returnToList("error", adminFlightError(error.message))
  revalidatePath("/admin/vuelos")
  revalidatePath("/vuelos")
  returnToList("notice", status === "Published" ? "Vuelo publicado" : "Vuelo retirado de la venta")
}

export async function deleteFlight(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get("flight_id") ?? "")
  if (!flightIdPattern.test(id)) returnToList("error", "Solicitud de vuelo inválida")
  const { error } = await supabase.rpc("admin_delete_flight", { p_flight_id: id })
  if (error) returnToList("error", adminFlightError(error.message))
  revalidatePath("/admin/vuelos")
  revalidatePath("/vuelos")
  returnToList("notice", "Vuelo eliminado")
}
