"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function InputGroup({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex items-center rounded-lg border border-input bg-background shadow-xs focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const InputGroupInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg bg-transparent px-3 py-1.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupInput.displayName = "InputGroupInput"

export function InputGroupAddon({
  align = "inline-end",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { align?: "inline-start" | "inline-end" }) {
  return (
    <div
      className={cn(
        "flex items-center px-1.5 shrink-0",
        align === "inline-start" ? "order-first" : "order-last",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function InputGroupButton({
  className,
  variant = "ghost",
  size = "icon-xs",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "h-7 w-7 p-0 text-[#6b7280] hover:text-[#111827] rounded-md",
        className
      )}
      {...props}
    />
  )
}
