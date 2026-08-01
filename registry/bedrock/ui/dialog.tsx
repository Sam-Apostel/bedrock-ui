'use client'

import * as React from 'react'
import { Dialog as Bedrock } from '@apostel/bedrock'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * shadcn/ui's Dialog, on bedrock instead of Radix.
 *
 * Same exports, same slots, same class names. Two parts are now no-ops rather
 * than elements — a <dialog> is already in the top layer and its backdrop is a
 * pseudo-element — and the animation variants key off `:open` instead of
 * `data-[state=open]`, because the state is the browser's.
 *
 * This file has no `open` prop. If React needs to own or refuse the open state,
 * install the `dialog-controlled` item instead; it is the same file against
 * bedrock's controlled entry point, and keeping them separate is what keeps the
 * reconciliation code out of apps that never need it.
 */

function Dialog({ open, ...props }: React.ComponentProps<typeof Bedrock.Root> & { open?: never }) {
  if (process.env.NODE_ENV !== 'production' && open !== undefined) {
    throw new Error(
      'Dialog received an `open` prop, but this is the uncontrolled build.\n' +
        'Run: npx shadcn@latest add <registry-url>/r/dialog-controlled.json',
    )
  }

  return <Bedrock.Root {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return <Bedrock.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * Kept so existing blocks keep compiling. The top layer means there is nothing
 * to portal past, so this renders its children where they stand.
 */
function DialogPortal({ children }: { children?: React.ReactNode; container?: unknown }) {
  return <>{children}</>
}

let warnedAboutOverlay = false

/**
 * Kept for the same reason, and renders nothing: the overlay is `::backdrop`,
 * which cannot be a React node. Style it with the `backdrop:` variant on
 * DialogContent.
 */
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
        // inset-0 + m-auto is the browser centring a top-layer element; no
        // transform, no fixed positioning, no z-index.
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
