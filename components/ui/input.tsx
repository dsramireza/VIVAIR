import * as React from "react"
import { cn } from "@/lib/utils"

export const fieldClass =
  "min-h-12 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-caribe focus:ring-4 focus:ring-caribe/15 aria-[invalid=true]:border-coral"

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, "select-chevron appearance-none pr-10", className)} {...props} />
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("flex flex-col gap-1.5 text-sm font-semibold text-ink", className)} {...props} />
}
