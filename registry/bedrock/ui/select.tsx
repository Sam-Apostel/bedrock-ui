'use client'

import * as React from 'react'
import { Select as Bedrock } from '@apostel/bedrock'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A real `<select>` under `appearance: base-select`, so the listbox semantics,
 * typeahead, form participation and a phone's own picker all come for free.
 *
 * Two things move: `SelectValue` is `<selectedcontent>`, which mirrors the
 * chosen option's markup rather than taking a `placeholder` render prop; and
 * `SelectItemIndicator` is `option::checkmark`, which is why the CheckIcon
 * below is decorative and CSS positions it.
 */
function Select({ className, children, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root data-slot="select" className={cn('w-fit', className)} {...props}>
      {children}
    </Bedrock.Root>
  )
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.Trigger>) {
  return (
    <Bedrock.Trigger
      data-slot="select-trigger"
      className={cn(
        "border-input dark:bg-input/30 flex h-9 w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none [&_svg:not([class*='size-'])]:size-4",
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 opacity-50" aria-hidden />
    </Bedrock.Trigger>
  )
}

function SelectValue({ ...props }: React.ComponentProps<typeof Bedrock.Value>) {
  return <Bedrock.Value data-slot="select-value" {...props} />
}

function SelectContent({ className, ...props }: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="select-content"
      className={cn(
        'bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
        className,
      )}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof Bedrock.Item>) {
  return (
    <Bedrock.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none [&_svg:not([class*='size-'])]:size-4",
        'checked:bg-accent checked:text-accent-foreground',
        // The tick is a pseudo-element on the option, not a child of it.
        'before:absolute before:right-2 before:size-3.5 before:content-[""] before:opacity-0 checked:before:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </Bedrock.Item>
  )
}

function SelectGroup({ ...props }: React.ComponentProps<typeof Bedrock.Group>) {
  return <Bedrock.Group data-slot="select-group" {...props} />
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof Bedrock.Separator>) {
  return (
    <Bedrock.Separator
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

/** Kept so existing markup compiles; the label is the optgroup's own. */
function SelectLabel({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="select-label"
      className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
}
export { CheckIcon as SelectCheckIcon }
