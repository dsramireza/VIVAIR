import type { Metadata, Viewport } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "VIVAIR", template: "%s | VIVAIR" },
  description: "Reserva vuelos nacionales de demostración con VIVAIR."
}

export const viewport: Viewport = { themeColor: "#075985", width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-[var(--border)] bg-white">
          <nav aria-label="Navegación principal" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <Link className="text-xl font-black tracking-tight text-[var(--primary)]" href="/">VIVAIR</Link>
            <div className="flex items-center gap-5 text-sm font-semibold">
              <Link href="/ingresar">Ingresar</Link>
              <Link className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white" href="/registro">Crear cuenta</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
