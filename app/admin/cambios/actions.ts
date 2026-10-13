"use server"

import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { flightChangeError, parseFlightChange } from "@/lib/flight-changes"

function returnToEditor(kind: "error" | "notice", message: string): never {
  redirect(`/admin/cambios?${new URLSearchParams({ [kind]: message }).toString()}`)
}

export async function updateFlight(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/ingresar")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "Administrator") notFound()

  const parsed = parseFlightChange(formData)
  if (!parsed.change) returnToEditor("error", parsed.error ?? "Revisa los datos del vuelo")
  const { error, data } = await supabase.rpc("admin_update_flight", {
    p_flight_id: parsed.change.id,
    p_origin: parsed.change.origin,
    p_destination: parsed.change.destination,
    p_departure_at: parsed.change.departureAt,
    p_base_fare: parsed.change.baseFare,
  })
  if (error) returnToEditor("error", flightChangeError(error.message))
  revalidatePath("/admin/cambios")
  revalidatePath("/admin/vuelos")
  revalidatePath("/vuelos")
  revalidatePath("/reservas")
  returnToEditor("notice", `Vuelo actualizado. Avisos creados: ${Number(data ?? 0)}`)
}
