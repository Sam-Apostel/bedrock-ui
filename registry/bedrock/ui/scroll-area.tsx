'use client'

import * as React from 'react'
import { ScrollArea as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * Native scrolling, styled with `scrollbar-width` and `scrollbar-color` rather
 * than scrollbars rebuilt out of divs. Momentum, overscroll behaviour and
 * scroll anchoring come with it; a scrollbar with its own hover animation does
 * not.
 */
function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root
      data-slot="scroll-area"
      className={cn(
        'relative [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]',
        'focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:ring-[3px]',
        className,
      )}
      {...props}
    >
      <Bedrock.Viewport data-slot="scroll-area-viewport" className="size-full">
        {children}
      </Bedrock.Viewport>
    </Bedrock.Root>
  )
}

export { ScrollArea }
