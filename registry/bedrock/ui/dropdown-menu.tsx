'use client'

import * as React from 'react'
import { DropdownMenu as Bedrock } from '@apostel/bedrock'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A popover with a roving list inside it. Submenus need no configuration — a
 * nested popover keeps its parent open, because the invoker is inside it — and
 * Escape closes only the topmost, because that is the close-watcher stack's
 * rule rather than a layer registry's.
 *
 * `DropdownMenuPortal` is kept as a no-op so existing markup compiles.
 */
function DropdownMenu({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return <Bedrock.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

const CONTENT =
  'bg-popover text-popover-foreground min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md ' +
  'scale-95 opacity-0 transition-all transition-discrete duration-150 ' +
  'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0'

const ITEM =
  'relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none ' +
  'focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 ' +
  "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="dropdown-menu-content"
      sideOffset={sideOffset}
      className={cn(CONTENT, className)}
      {...props}
    />
  )
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof Bedrock.Group>) {
  return <Bedrock.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
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
      data-slot="dropdown-menu-item"
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

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof Bedrock.CheckboxItem>) {
  return (
    <Bedrock.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
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

function DropdownMenuRadioGroup({ ...props }: React.ComponentProps<typeof Bedrock.RadioGroup>) {
  return <Bedrock.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.RadioItem>) {
  return (
    <Bedrock.RadioItem
      data-slot="dropdown-menu-radio-item"
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

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Bedrock.Label> & { inset?: boolean }) {
  return (
    <Bedrock.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn('px-2 py-1.5 text-sm font-medium data-[inset=true]:pl-8', className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Bedrock.Separator>) {
  return (
    <Bedrock.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-border -mx-1 my-1 h-px border-0', className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof Bedrock.Sub>) {
  return <Bedrock.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.SubTrigger> & { inset?: boolean }) {
  return (
    <Bedrock.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(ITEM, 'data-[inset=true]:pl-8', className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </Bedrock.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof Bedrock.SubContent>) {
  return (
    <Bedrock.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(CONTENT, className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
