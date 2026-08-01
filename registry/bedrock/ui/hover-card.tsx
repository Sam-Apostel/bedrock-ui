'use client'

import * as React from 'react'
import { HoverCard as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/** The trigger may be an `<a>`, which is what link previews need. */
function HoverCard({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger({ ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return <Bedrock.Trigger data-slot="hover-card-trigger" {...props} />
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="hover-card-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground w-64 rounded-md border p-4 shadow-md outline-hidden',
        'scale-95 opacity-0 transition-all transition-discrete duration-150',
        'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
