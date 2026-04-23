import { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
