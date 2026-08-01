'use client'

import * as React from 'react'
import { RadioGroup as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * Real `<input type="radio">`s sharing a name, which is the whole of roving
 * focus: one tab stop, arrow keys that move and select, wrapping, Home and End
 * — from the browser rather than from a keydown handler.
 */
function RadioGroup({ className, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="radio-group" className={cn('grid gap-3', className)} {...props} />
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof Bedrock.Item>) {
  return (
    <Bedrock.Item
      data-slot="radio-group-item"
      className={cn(
        'border-input text-primary dark:bg-input/30 aspect-square size-4 shrink-0 appearance-none rounded-full border shadow-xs outline-none transition-[color,box-shadow]',
        'checked:border-primary',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // The dot, drawn by the input rather than by an Indicator element.
        "grid place-content-center before:size-2 before:rounded-full before:bg-current before:opacity-0 before:content-[''] checked:before:opacity-100",
        className,
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioGroupItem }
