import type { ComponentPropsWithRef, ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface SeparatorProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  orientation?: 'horizontal' | 'vertical'
  /** A line that is only visual. Removes it from the accessibility tree. */
  decorative?: boolean
}

/**
 * `<hr>` would be the native element, but it cannot be vertical without
 * fighting its own UA styles, and a decorative separator has to leave the
 * accessibility tree entirely — which `role="none"` on a div does cleanly.
 */
export function SeparatorRoot({
  asChild,
  orientation = 'horizontal',
  decorative = false,
  ...props
}: SeparatorProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      // `aria-orientation` is only meaningful on a real separator, and only
      // vertical is worth stating: horizontal is the default.
      role={decorative ? 'none' : 'separator'}
      aria-orientation={!decorative && orientation === 'vertical' ? 'vertical' : undefined}
      data-orientation={orientation}
      data-bedrock-separator=""
    />
  )
}
