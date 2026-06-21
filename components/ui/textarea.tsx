'use client'

import * as React from "react"

import { cn } from "@/lib/utils"

const fieldStyles =
  "flex field-sizing-content w-full min-w-0 rounded-lg border border-border/70 bg-card/60 px-3 py-2.5 text-base text-foreground shadow-none transition-[border-color,background-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground/80 hover:border-border focus-visible:border-foreground/20 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-foreground/8 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60 aria-invalid:border-destructive/70 aria-invalid:ring-1 aria-invalid:ring-destructive/15 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldStyles, "min-h-16", className)}
      {...props}
    />
  )
}

export { Textarea }
