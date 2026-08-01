'use client'

import * as React from 'react'
import { Progress as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * A real `<progress>`. `role="progressbar"`, the value semantics and the
 * indeterminate state are the element's; omit `value` for indeterminate.
 *
 * The fill is `::-webkit-progress-value`, so there is no `Indicator` element and
 * no `translateX(-${100 - value}%)` to compute.
 */
function Progress({ className, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full appearance-none overflow-hidden rounded-full',
        '[&::-webkit-progress-bar]:bg-primary/20 [&::-webkit-progress-bar]:rounded-full',
        '[&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all',
        className,
      )}
      {...props}
    />
  )
}

export { Progress }
