'use client'

import * as React from 'react'
import { Switch as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/** A checkbox with `role="switch"`; the thumb is a `::before`, not an element. */
function Switch({ className, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root
      data-slot="switch"
      className={cn(
        'peer bg-input dark:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 appearance-none items-center rounded-full border border-transparent shadow-xs outline-none transition-all',
        'checked:bg-primary',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        "before:bg-background before:pointer-events-none before:block before:size-4 before:rounded-full before:ring-0 before:transition-transform before:content-['']",
        'before:translate-x-0 checked:before:translate-x-[calc(100%-2px)]',
        'dark:before:bg-foreground dark:checked:before:bg-primary-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { Switch }
