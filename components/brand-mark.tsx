/** Logotipo: ala estilizada en verde Caribe con el punto guayacán. */
export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return <span className="flex items-center gap-2">
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8">
      <rect width="32" height="32" rx="9" fill={inverted ? "#ffffff" : "var(--primary)"} />
      <path d="M7 20.5 19.5 8.5c1.6-1.5 4-1.2 4.8.4.6 1.2.2 2.6-.9 3.5L11 22.5Z" fill={inverted ? "var(--primary)" : "#ffffff"} />
      <path d="M11 22.5h11.5" stroke={inverted ? "var(--primary)" : "#ffffff"} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="22.5" r="2.4" fill="var(--accent)" />
    </svg>
    <span className={`font-display text-xl font-extrabold tracking-tight ${inverted ? "text-white" : "text-night"}`}>VIVAIR</span>
  </span>
}
