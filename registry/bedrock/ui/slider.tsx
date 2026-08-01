'use client'

import * as React from 'react'
import { Slider as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * `<input type="range">`. Keyboard, page-up/down, pointer capture and
 * `aria-valuenow` are the element's.
 *
 * One value, not an array: a range input has one thumb. A two-thumb range needs
 * two inputs and a shared track, and this component does not pretend otherwise.
 */
function Slider({ className, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root
      data-slot="slider"
      className={cn(
        'w-full appearance-none bg-transparent outline-none disabled:opacity-50',
        '[&::-webkit-slider-runnable-track]:bg-muted [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full',
        '[&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-[color,box-shadow]',
        'focus-visible:[&::-webkit-slider-thumb]:ring-ring/50 focus-visible:[&::-webkit-slider-thumb]:ring-4',
        className,
      )}
      {...props}
    />
  )
}

export { Slider }
