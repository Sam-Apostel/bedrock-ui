'use client'

import * as React from 'react'
import { AspectRatio as Bedrock } from '@apostel/bedrock'

/**
 * One element with `aspect-ratio`. Radix wraps a padding-bottom box around an
 * absolutely positioned child; the CSS property has been Baseline since 2021,
 * so both go away and the element lays out normally.
 */
function AspectRatio({ ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return <Bedrock.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
