'use client'

import * as React from 'react'
import { ToggleGroup as Bedrock } from '@apostel/bedrock'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { toggleVariants } from '@/components/ui/toggle'

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof Bedrock.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <Bedrock.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        'group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </Bedrock.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Bedrock.Item> & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <Bedrock.Item
      data-slot="toggle-group-item"
      data-variant={context.variant ?? variant}
      data-size={context.size ?? size}
      className={cn(
        toggleVariants({ variant: context.variant ?? variant, size: context.size ?? size }),
        'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10',
        className,
      )}
      {...props}
    >
      {children}
    </Bedrock.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
