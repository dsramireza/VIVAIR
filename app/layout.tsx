import type { Metadata, Viewport } from "next"
import "@fontsource-variable/bricolage-grotesque"
import "@fontsource-variable/instrument-sans"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: { default: "VIVAIR", template: "%s | VIVAIR" },
  description: "Reserva vuelos nacionales de demostración con VIVAIR."
}

export const viewport: Viewport = { themeColor: "#0a6c74", width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:px-6">
            <p>VIVAIR es un prototipo académico. Vuelos, tarifas y pagos son ficticios.</p>
            <p>Horas en zona horaria de Colombia</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
