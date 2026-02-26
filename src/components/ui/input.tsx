import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-ns border border-ns-border bg-ns-elevated px-3 py-1 text-sm text-ns-ink shadow-ns-sm transition-all duration-200 placeholder:text-ns-ink-muted focus-visible:outline-none focus-visible:border-ns-accent focus-visible:ring-2 focus-visible:ring-[var(--ns-ring)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
