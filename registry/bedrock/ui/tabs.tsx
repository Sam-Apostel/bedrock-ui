'use client'

import * as React from 'react'
import { Tabs as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/** Note: the unselected panel is unmounted, so leaving a tab resets it. */
function Tabs({ className, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root data-slot="tabs" className={cn('flex flex-col gap-2', className)} {...props} />
  )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof Bedrock.List>) {
  return (
    <Bedrock.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return (
    <Bedrock.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
        'aria-selected:bg-background dark:aria-selected:text-foreground aria-selected:shadow-sm dark:aria-selected:border-input dark:aria-selected:bg-input/30',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
