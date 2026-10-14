import { Plane } from "lucide-react"
import { iataCode } from "@/lib/airports"
import { cn } from "@/lib/utils"

/** Ruta mostrada como en un pase de abordar: códigos grandes y ciudad debajo. */
export function RouteCodes({ origin, destination, size = "md", className }: { origin: string; destination: string; size?: "md" | "lg"; className?: string }) {
  const code = size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"
  return <div className={cn("flex items-center gap-4", className)}>
    <div>
      <p className={cn("font-display font-extrabold leading-none tracking-tight", code)}>{iataCode(origin)}</p>
      <p className="mt-1 text-sm text-muted">{origin}</p>
    </div>
    <div aria-hidden="true" className="flex min-w-12 flex-1 items-center gap-2 text-caribe">
      <span className="h-px flex-1 border-t-2 border-dotted border-current opacity-50" />
      <Plane className="size-5 rotate-45" strokeWidth={2.2} />
      <span className="h-px flex-1 border-t-2 border-dotted border-current opacity-50" />
    </div>
    <div className="text-right">
      <p className={cn("font-display font-extrabold leading-none tracking-tight", code)}>{iataCode(destination)}</p>
      <p className="mt-1 text-sm text-muted">{destination}</p>
    </div>
  </div>
}
