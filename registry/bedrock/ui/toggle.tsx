'use client'

import * as React from 'react'
import { Toggle as Bedrock } from '@apostel/bedrock'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** State is `[aria-pressed=true]`, not `[data-state=on]`. */
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-[color,box-shadow] outline-none hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 aria-pressed:bg-accent aria-pressed:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent shadow-xs hover:bg-accent',
      },
      size: {
        default: 'h-9 px-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Bedrock.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <Bedrock.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
