import React, { createContext, useContext, useState, HTMLAttributes, ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType>({ open: false, setOpen: () => {} })

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = (val: boolean) => {
    setInternalOpen(val)
    onOpenChange?.(val)
  }
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>, {
      onClick: () => setOpen(true),
    })
  }
  return <button onClick={() => setOpen(true)}>{children}</button>
}

export function DialogContent({ className, children }: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useContext(DialogContext)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className={cn("relative z-10 w-full max-w-sm rounded-xl shadow-2xl", className)}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, children }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1 mb-4", className)}>{children}</div>
}

export function DialogTitle({ className, children }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-white", className)}>{children}</h2>
}
