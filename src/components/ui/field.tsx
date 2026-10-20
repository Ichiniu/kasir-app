"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export function Field({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {children}
    </div>
  )
}

export function FieldLabel({ className, children, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label className={cn("text-xs font-semibold text-[#374151]", className)} {...props}>
      {children}
    </Label>
  )
}
