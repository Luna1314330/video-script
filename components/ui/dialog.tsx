'use client'

import * as React from 'react'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

interface DialogContentProps {
  className?: string
  children?: React.ReactNode
  onClose?: () => void
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 bg-background rounded-lg shadow-lg max-w-lg w-full mx-4">
        {children}
      </div>
    </div>
  )
}

const DialogTrigger = ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => {
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  )
}

const DialogContent = ({ className, children, onClose }: DialogContentProps) => {
  return (
    <div className={cn('p-6', className)}>
      {children}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)} {...props} />
)

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
