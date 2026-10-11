"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function CancelReservationButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return <Button type="button" disabled={pending} onClick={() => {
    if (!window.confirm("¿Cancelar la reserva completa? No se iniciará ningún reembolso.")) return
    startTransition(async () => {
      const { error } = await createClient().rpc("cancel_booking", { p_booking_id: bookingId })
      if (error) window.alert(error.message.includes("departure_already_reached") ? "No se puede cancelar después de la salida." : "No se pudo cancelar la reserva.")
      else router.refresh()
    })
  }}>{pending ? "Cancelando…" : "Cancelar reserva"}</Button>
}
