'use client'

import * as React from 'react'
import { ContextMenu as Bedrock } from '@apostel/bedrock'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The same menu, anchored to the pointer instead of to a trigger.
 *
 * `ContextMenu.Root` *is* the trigger area — it wraps the region you right-click
 * and renders a zero-size element at the pointer for the menu to anchor to. So
 * there is no `ContextMenuTrigger` element; the alias below keeps existing
 * markup compiling by rendering its children where they stand.
 */
function ContextMenu({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="context-menu" {...props} />
}

function ContextMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function ContextMenuTrigger({ children }: { children?: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>
}

const CONTENT =
  'bg-popover text-popover-foreground min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md ' +
  'scale-95 opacity-0 transition-all transition-discrete duration-150 ' +
  'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0'

const ITEM =
  'relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none ' +
  'focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 ' +
  "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"

function ContextMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="context-menu-content"
      sideOffset={sideOffset}
      className={cn(CONTENT, className)}
      {...props}
    />
  )
}

function ContextMenuGroup({ ...props }: React.ComponentProps<typeof Bedrock.Group>) {
  return <Bedrock.Group data-slot="context-menu-group" {...props} />
}

function ContextMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof Bedrock.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <Bedrock.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        ITEM,
        'data-[inset=true]:pl-8 data-[variant=destructive]:text-destructive',
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof Bedrock.CheckboxItem>) {
  return (
    <Bedrock.CheckboxItem
      data-slot="context-menu-checkbox-item"
      checked={checked}
      className={cn(ITEM, 'pl-8', className)}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        {checked ? <CheckIcon className="size-4" /> : null}
      </span>
      {children}
    </Bedrock.CheckboxItem>
  )
}

function ContextMenuRadioGroup({ ...props }: React.ComponentProps<typeof Bedrock.RadioGroup>) {
  return <Bedrock.RadioGroup data-slot="context-menu-radio-group" {...props} />
}

function ContextMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.RadioItem>) {
  return (
    <Bedrock.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(ITEM, 'pl-8', className)}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <CircleIcon className="size-2 fill-current opacity-0 in-[[aria-checked=true]]:opacity-100" />
      </span>
      {children}
    </Bedrock.RadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Bedrock.Label> & { inset?: boolean }) {
  return (
    <Bedrock.Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn('px-2 py-1.5 text-sm font-medium data-[inset=true]:pl-8', className)}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Bedrock.Separator>) {
  return (
    <Bedrock.Separator
      data-slot="context-menu-separator"
      className={cn('bg-border -mx-1 my-1 h-px border-0', className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
      {...props}
    />
  )
}

function ContextMenuSub({ ...props }: React.ComponentProps<typeof Bedrock.Sub>) {
  return <Bedrock.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.SubTrigger> & { inset?: boolean }) {
  return (
    <Bedrock.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(ITEM, 'data-[inset=true]:pl-8', className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </Bedrock.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof Bedrock.SubContent>) {
  return (
    <Bedrock.SubContent
      data-slot="context-menu-sub-content"
      className={cn(CONTENT, className)}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuPortal,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
}
