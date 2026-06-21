'use client'

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const fieldStyles =
  "w-full min-w-0 rounded-lg border border-border/70 bg-card/60 px-3 text-base text-foreground shadow-none transition-[border-color,background-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground/80 hover:border-border focus-visible:border-foreground/20 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-foreground/8 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60 aria-invalid:border-destructive/70 aria-invalid:ring-1 aria-invalid:ring-destructive/15 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(fieldStyles, "h-10 py-2 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground", className)}
      {...props}
    />
  )
}

export { Input }
