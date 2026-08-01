'use client'

import * as React from 'react'
import { Accordion as Bedrock } from '@apostel/bedrock'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * `<details name>` — single-open exclusivity is the browser's, so no effect
 * closes the siblings and nothing can get out of step.
 *
 * Two structural differences from Radix: `AccordionTrigger` renders inside the
 * `<summary>` rather than being a button (a button inside a summary is two tab
 * stops for one control), and `type="single"` always allows closing the open
 * item, because a summary toggles.
 */
function Accordion({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="accordion" {...props} />
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof Bedrock.Item>) {
  return (
    <Bedrock.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.Trigger>) {
  return (
    <Bedrock.Header className="flex cursor-pointer list-none [&::-webkit-details-marker]:hidden">
      <Bedrock.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 py-4 text-left text-sm font-medium transition-all outline-none hover:underline',
          '[details[open]_&>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </Bedrock.Trigger>
    </Bedrock.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.Content>) {
  return (
    <Bedrock.Content data-slot="accordion-content" className="overflow-hidden text-sm" {...props}>
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </Bedrock.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
