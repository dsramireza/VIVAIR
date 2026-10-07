import * as React from "react"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("min-h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-base outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-sky-100", className)} {...props} />
}
