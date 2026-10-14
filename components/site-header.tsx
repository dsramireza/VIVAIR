import Link from "next/link"
import { LogOut } from "lucide-react"
import { logout } from "@/app/auth/actions"
import { createClient } from "@/lib/supabase/server"
import { BrandMark } from "@/components/brand-mark"

type Session = { kind: "guest" } | { kind: "passenger"; name: string; notices: number } | { kind: "admin"; name: string }

async function readSession(): Promise<Session> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { kind: "guest" }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    const name = String(user.user_metadata?.name ?? user.email ?? "").split(" ")[0]
    if (profile?.role === "Administrator") return { kind: "admin", name }
    const { count } = await supabase.from("flight_change_notices").select("id", { count: "exact", head: true }).eq("passenger_id", user.id)
    return { kind: "passenger", name, notices: count ?? 0 }
  } catch {
    return { kind: "guest" }
  }
}

const link = "rounded-lg px-3 py-2 text-sm font-semibold text-ink/80 transition-colors hover:bg-caribe-soft hover:text-caribe-strong"

export async function SiteHeader() {
  const session = await readSession()
  return <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur">
    <nav aria-label="Navegación principal" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <Link href="/" className="flex items-center gap-2 rounded-lg" aria-label="VIVAIR, inicio">
        <BrandMark />
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        {session.kind === "admin" ? <>
          <span className="hidden text-sm text-muted md:inline">Administración</span>
          <SignOut />
        </> : <>
          <Link className={`${link} hidden sm:inline-flex`} href="/vuelos">Buscar vuelos</Link>
          {session.kind === "passenger" ? <>
            <Link className={`${link} inline-flex items-center gap-2`} href="/reservas">
              Mis reservas
              {session.notices > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-guayacan px-1.5 text-xs font-bold text-night" aria-label={`${session.notices} avisos de cambio`}>{session.notices}</span>}
            </Link>
            <SignOut />
          </> : <>
            <Link className={link} href="/ingresar">Ingresar</Link>
            <Link className="rounded-xl bg-caribe px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-caribe-strong" href="/registro">Crear cuenta</Link>
          </>}
        </>}
      </div>
    </nav>
  </header>
}

function SignOut() {
  return <form action={logout}>
    <button className={`${link} inline-flex items-center gap-2`} type="submit">
      <LogOut aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">Cerrar sesión</span>
      <span className="sr-only sm:hidden">Cerrar sesión</span>
    </button>
  </form>
}
