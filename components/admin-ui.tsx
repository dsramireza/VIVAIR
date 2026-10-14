import { CircleAlert, CircleCheck } from "lucide-react"

export function AdminHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl">
      <h1 className="text-4xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
    </div>
    {children}
  </header>
}

export function Flash({ error, notice }: { error?: string; notice?: string }) {
  if (error) return <p role="alert" className="flex items-start gap-2 rounded-2xl bg-coral-soft p-4 font-medium text-coral"><CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />{error}</p>
  if (notice) return <p role="status" className="flex items-start gap-2 rounded-2xl bg-ok-soft p-4 font-medium text-ok"><CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />{notice}</p>
  return null
}
