"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, PencilLine, PlaneTakeoff } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/admin/vuelos", label: "Vuelos", icon: PlaneTakeoff },
  { href: "/admin/cambios", label: "Cambios de vuelo", icon: PencilLine },
  { href: "/admin/ventas", label: "Ventas", icon: BarChart3 }
]

export function AdminTabs() {
  const pathname = usePathname()
  return <nav aria-label="Administración" className="border-b border-line bg-white">
    <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return <Link key={href} href={href} aria-current={active ? "page" : undefined}
          className={cn("flex shrink-0 items-center gap-2 border-b-[3px] px-3 py-3.5 text-sm font-semibold transition-colors",
            active ? "border-caribe text-caribe-strong" : "border-transparent text-muted hover:text-ink")}>
          <Icon aria-hidden="true" className="size-4" />{label}
        </Link>
      })}
    </div>
  </nav>
}
