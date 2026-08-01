'use client'

import * as React from 'react'
import { Popover as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * The top layer plus anchor positioning: no portal, no z-index, no positioning
 * recalculation on scroll. `side`, `align` and `sideOffset` keep Radix's names
 * and become one `position-area` declaration.
 */
function Popover({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return <Bedrock.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof Bedrock.Anchor>) {
  return <Bedrock.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground w-72 rounded-md border p-4 shadow-md outline-hidden',
        'scale-95 opacity-0 transition-all transition-discrete duration-150',
        'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

/** Kept for API parity; it is a close button rather than a wrapper. */
function PopoverClose({ ...props }: React.ComponentProps<typeof Bedrock.Close>) {
  return <Bedrock.Close data-slot="popover-close" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose }
