import { cn } from "@/lib/utils"

const tones = {
  caribe: "bg-caribe-soft text-caribe-strong",
  guayacan: "bg-guayacan-soft text-guayacan-ink",
  ok: "bg-ok-soft text-ok",
  coral: "bg-coral-soft text-coral",
  neutral: "bg-[#e8edeb] text-muted"
} as const

export function Badge({ tone = "neutral", className, children }: { tone?: keyof typeof tones; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{children}
  </span>
}

const flightStatus: Record<string, { label: string; tone: keyof typeof tones }> = {
  Draft: { label: "Borrador", tone: "neutral" },
  Published: { label: "Publicado", tone: "ok" },
  Withdrawn: { label: "Retirado", tone: "guayacan" }
}

export function FlightStatusBadge({ status }: { status: string }) {
  const s = flightStatus[status] ?? { label: status, tone: "neutral" as const }
  return <Badge tone={s.tone}>{s.label}</Badge>
}
