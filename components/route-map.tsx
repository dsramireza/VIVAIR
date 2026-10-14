// Posiciones aproximadas según longitud/latitud reales de cada aeropuerto.
const airports = {
  BAQ: { x: 232, y: 41, city: "Barranquilla", anchor: "start", dx: 12, dy: 4 },
  CTG: { x: 162, y: 66, city: "Cartagena", anchor: "end", dx: -12, dy: 4 },
  MDE: { x: 157, y: 248, city: "Medellín", anchor: "end", dx: -12, dy: 4 },
  BOG: { x: 299, y: 316, city: "Bogotá", anchor: "end", dx: -12, dy: 22 },
  CLO: { x: 67, y: 371, city: "Cali", anchor: "start", dx: 12, dy: 18 }
} as const

type Code = keyof typeof airports
const routes: [Code, Code, number][] = [
  ["BOG", "MDE", 40], ["BOG", "CTG", 70], ["BOG", "BAQ", -50], ["BOG", "CLO", 40], ["MDE", "CTG", -30], ["CLO", "BAQ", -60]
]

function arc(a: Code, b: Code, bend: number) {
  const p = airports[a], q = airports[b]
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2
  const len = Math.hypot(q.x - p.x, q.y - p.y)
  const cx = mx + (-(q.y - p.y) / len) * bend, cy = my + ((q.x - p.x) / len) * bend
  return `M${p.x} ${p.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${q.x} ${q.y}`
}

export function RouteMap() {
  return <figure className="relative overflow-hidden rounded-[28px] bg-night p-6 text-white shadow-[0_30px_60px_-30px_rgba(15,42,61,0.6)]">
    <figcaption className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="font-display text-lg font-bold">Red de rutas</span>
      <span className="text-sm text-white/60">5 ciudades, vuelos directos de solo ida</span>
    </figcaption>
    <svg viewBox="0 0 360 420" role="img" aria-label="Mapa de rutas entre Barranquilla, Cartagena, Medellín, Bogotá y Cali" className="mt-2 w-full">
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.12)" />
        </pattern>
      </defs>
      <rect width="360" height="420" fill="url(#grid)" />
      <text x="60" y="22" fill="rgba(255,255,255,0.35)" fontSize="11" fontStyle="italic">Mar Caribe</text>
      <text x="16" y="250" fill="rgba(255,255,255,0.35)" fontSize="11" fontStyle="italic" transform="rotate(-90 16 250)">Océano Pacífico</text>
      <g fill="none" strokeLinecap="round">
        {routes.map(([a, b, bend]) => <path key={a + b} className="route-arc" d={arc(a, b, bend)} stroke={a === "BOG" ? "#f2b32a" : "rgba(255,255,255,0.45)"} strokeWidth={a === "BOG" ? 2 : 1.5} />)}
      </g>
      {(Object.keys(airports) as Code[]).map((code) => {
        const p = airports[code]
        return <g key={code}>
          <circle cx={p.x} cy={p.y} r={code === "BOG" ? 9 : 6} fill="#0f2a3d" stroke={code === "BOG" ? "#f2b32a" : "#ffffff"} strokeWidth="2.5" />
          <text x={p.x + p.dx} y={p.y + p.dy} textAnchor={p.anchor} fill="#ffffff" fontSize="15" fontWeight="800" fontFamily="var(--font-display)">{code}</text>
          <text x={p.x + p.dx} y={p.y + p.dy + 15} textAnchor={p.anchor} fill="rgba(255,255,255,0.6)" fontSize="11">{p.city}</text>
        </g>
      })}
    </svg>
  </figure>
}
