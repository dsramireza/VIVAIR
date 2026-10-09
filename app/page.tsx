import Link from "next/link"

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col items-start gap-6">
          <p className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">Vuelos nacionales, experiencia simple</p>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">Colombia está más cerca.</h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--muted)]">Crea tu cuenta de pasajero y prepárate para descubrir Bogotá, Medellín, Cali, Cartagena y Barranquilla.</p>
          <Link className="rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white shadow-lg shadow-sky-900/15" href="/registro">Crear mi cuenta</Link>
        </div>
        <div className="rounded-3xl bg-[var(--primary)] p-8 text-white shadow-2xl">
          <p className="mb-16 text-sm font-bold uppercase tracking-[0.2em] text-sky-200">Tu próximo vuelo</p>
          <p className="text-3xl font-black">BOG → CTG</p>
          <p className="mt-3 text-sky-100">Una plataforma segura para gestionar tu viaje.</p>
        </div>
      </section>
    </main>
  )
}
