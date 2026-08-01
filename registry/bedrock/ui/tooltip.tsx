'use client'

import * as React from 'react'
import { Tooltip as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * `popover="hint"`, so a tooltip layers above an open menu instead of closing
 * it. There is no Provider: the delay is a prop on the root, because there is
 * no shared timer to coordinate.
 */
function TooltipProvider({ children }: { children?: React.ReactNode; delayDuration?: number }) {
  return <>{children}</>
}

function Tooltip({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return <Bedrock.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        'bg-primary text-primary-foreground w-fit rounded-md px-3 py-1.5 text-xs text-balance',
        'scale-95 opacity-0 transition-all transition-discrete duration-100',
        'open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0',
        className,
      )}
      {...props}
    >
      {children}
    </Bedrock.Content>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
