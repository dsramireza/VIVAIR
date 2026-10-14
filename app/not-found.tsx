import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return <main className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center">
    <p aria-hidden="true" className="font-display text-8xl font-extrabold text-caribe/25">404</p>
    <h1 className="text-3xl font-extrabold">No encontramos esta página</h1>
    <p className="text-muted">La dirección no existe o tu cuenta no tiene acceso a ella.</p>
    <Link className={buttonVariants()} href="/">Volver al inicio</Link>
  </main>
}
