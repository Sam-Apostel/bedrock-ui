import type { ComponentPropsWithRef, ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface AspectRatioProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  /** Width divided by height. `16 / 9`, not the string. */
  ratio?: number
}

/**
 * One `aspect-ratio` declaration. Radix ships a padding-bottom wrapper and an
 * absolutely positioned child because the CSS property did not exist when it
 * was written; it has been Baseline since 2021.
 *
 * The nested element and the position juggling go with it, so this is a single
 * element that can be laid out normally.
 */
export function AspectRatioRoot({ asChild, ratio = 1, style, ...props }: AspectRatioProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return <Part {...props} style={{ aspectRatio: ratio, ...style }} data-bedrock-aspect-ratio="" />
}
