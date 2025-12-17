'use client'

import * as React from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './sheet'

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  contentClassName?: string
}

/**
 * Adaptive dialog component that renders:
 * - Dialog (centered modal) on desktop (>= 768px)
 * - Sheet (bottom drawer) on mobile (< 768px)
 * 
 * @example
 * <ResponsiveDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Edit Vehicle"
 *   description="Update vehicle information"
 * >
 *   <Form>...</Form>
 * </ResponsiveDialog>
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
  contentClassName,
}: ResponsiveDialogProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className={contentClassName || "h-[90vh] overflow-y-auto"}
        >
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className={className}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className={className}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

