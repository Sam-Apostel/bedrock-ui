'use client'

import * as React from 'react'
import { Avatar as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

function Avatar({ className, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof Bedrock.Image>) {
  return (
    <Bedrock.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof Bedrock.Fallback>) {
  return (
    <Bedrock.Fallback
      data-slot="avatar-fallback"
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
