import { createContext, useContext, useState, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const TabsContext = createContext<{ active: string; setActive: (v: string) => void }>({
  active: "",
  setActive: () => {},
})

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({ defaultValue = "", value, onValueChange, className, children }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value ?? internal
  const setActive = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("inline-flex items-center rounded-lg bg-zinc-900 p-1", className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const { active, setActive } = useContext(TabsContext)
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
        active === value ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return <div className={cn("mt-2", className)}>{children}</div>
}
