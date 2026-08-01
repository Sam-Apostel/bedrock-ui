'use client'

import * as React from 'react'
import { Collapsible as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * `<details>` and `<summary>`. The trigger is bound to its parent by the
 * parser, so it opens before hydration and keeps working without JavaScript.
 */
function Collapsible({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ className, ...props }: React.ComponentProps<typeof Bedrock.Trigger>) {
  return (
    <Bedrock.Trigger
      data-slot="collapsible-trigger"
      className={cn('cursor-pointer list-none [&::-webkit-details-marker]:hidden', className)}
      {...props}
    />
  )
}

function CollapsibleContent({ className, ...props }: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content
      data-slot="collapsible-content"
      className={cn('overflow-hidden text-sm', className)}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
