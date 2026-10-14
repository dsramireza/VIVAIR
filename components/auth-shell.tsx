import { RouteMap } from "@/components/route-map"

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
    <section className="mx-auto w-full max-w-md rounded-[28px] bg-white p-7 ring-1 ring-line sm:p-9">
      <h1 className="text-4xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </section>
    <div className="hidden lg:block"><RouteMap /></div>
  </main>
}
