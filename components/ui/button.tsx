import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-caribe text-white hover:bg-caribe-strong",
        accent: "bg-guayacan text-night hover:bg-[#e3a414]",
        outline: "border border-line bg-white text-ink hover:border-caribe hover:text-caribe",
        ghost: "text-ink hover:bg-caribe-soft",
        danger: "border border-coral/30 bg-white text-coral hover:bg-coral-soft"
      },
      size: { md: "", sm: "min-h-9 rounded-lg px-3.5 py-1.5 text-sm" }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
