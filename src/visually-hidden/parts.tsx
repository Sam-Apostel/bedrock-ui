import type { ComponentPropsWithRef, CSSProperties, ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

/**
 * The clip-rect recipe, inline, so it works without the stylesheet. Every line
 * is load-bearing: `display: none` or `visibility: hidden` would remove it from
 * the accessibility tree, which is the opposite of the point.
 */
export const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  wordWrap: 'normal',
}

export interface VisuallyHiddenProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

export function VisuallyHiddenRoot({ asChild, style, ...props }: VisuallyHiddenProps) {
  const Part: ElementType = asChild ? Slot : 'span'

  return (
    <Part {...props} style={{ ...VISUALLY_HIDDEN, ...style }} data-bedrock-visually-hidden="" />
  )
}
