'use client'

import * as React from 'react'
import { Dialog as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

/**
 * shadcn/ui's AlertDialog, on bedrock's Dialog.
 *
 * There is no separate AlertDialog primitive: the difference is `role`, plus
 * the convention that the only ways out are the two buttons you provide. Escape
 * still closes, as it does in Radix's AlertDialog.
 *
 * AlertDialogAction and AlertDialogCancel are both close buttons — they invoke
 * `command="request-close"` and run your `onClick`, so a destructive action
 * needs no dismiss logic of its own.
 */

function AlertDialog({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root {...props} />
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return <Bedrock.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function AlertDialogOverlay(_: { className?: string }) {
  return null
}

function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      // Overrides <dialog>'s implicit role. An alert dialog is announced
      // differently and is not meant to be dismissed by ambient interaction.
      role="alertdialog"
      data-slot="alert-dialog-content"
      className={cn(
        'bg-background fixed inset-0 m-auto grid h-fit w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg',
        'scale-95 opacity-0 transition-all transition-discrete duration-200',
        'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0',
        'backdrop:bg-black/50 backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof Bedrock.Title>) {
  return (
    <Bedrock.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof Bedrock.Description>) {
  return (
    <Bedrock.Description
      data-slot="alert-dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof Bedrock.Close>) {
  return <Bedrock.Close className={cn(buttonVariants(), className)} {...props} />
}

function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof Bedrock.Close>) {
  return (
    <Bedrock.Close className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
