"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintButton({ label }: { label: string }) {
  return <Button type="button" size="sm" variant="ghost" onClick={() => window.print()} aria-label={label}>
    <Printer aria-hidden="true" className="size-4" />Imprimir
  </Button>
}
