'use client'

import * as React from 'react'
import { Dialog as Bedrock } from '@apostel/bedrock/controlled'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The controlled build of the Dialog above. Identical in every respect except
 * the import on the line that matters and the required `open` prop.
 *
 * `open` decides. When the user clicks and your prop disagrees, the browser's
 * `beforetoggle` is cancelled and the dialog never moves; `onOpenChange` still
 * fires, so you choose. Escape and the close button go through `cancel`, which
 * is cancelable too, so refusing a close is invisible as well.
 *
 * Install this one only where you need that. Apps that never import it never
 * bundle the reconciliation code.
 */

function Dialog({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return <Bedrock.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ children }: { children?: React.ReactNode; container?: unknown }) {
  return <>{children}</>
}

let warnedAboutOverlay = false

function DialogOverlay({ className }: { className?: string }) {
  if (process.env.NODE_ENV !== 'production' && className && !warnedAboutOverlay) {
    warnedAboutOverlay = true
    console.warn(
      '[dialog] DialogOverlay renders nothing — the overlay is ::backdrop. ' +
        'Move those classes onto DialogContent with the `backdrop:` variant.',
    )
  }

  return null
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Bedrock.Content> & { showCloseButton?: boolean }) {
  return (
    <Bedrock.Content
      data-slot="dialog-content"
      className={cn(
        'bg-background fixed inset-0 m-auto grid h-fit w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg',
        'scale-95 opacity-0 transition-all transition-discrete duration-200',
        'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0',
        'backdrop:bg-black/50 backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <Bedrock.Close
          data-slot="dialog-close"
          className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </Bedrock.Close>
      )}
    </Bedrock.Content>
  )
}

function DialogClose({ ...props }: React.ComponentProps<typeof Bedrock.Close>) {
  return <Bedrock.Close data-slot="dialog-close" {...props} />
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof Bedrock.Title>) {
  return (
    <Bedrock.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof Bedrock.Description>) {
  return (
    <Bedrock.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
