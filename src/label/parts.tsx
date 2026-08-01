import type { ComponentPropsWithRef, ElementType, MouseEvent } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface LabelProps extends ComponentPropsWithRef<'label'>, AsChildProps {}

/**
 * A `<label>`, plus the one thing the platform gets wrong: double-clicking a
 * label selects its text instead of activating the control twice, which looks
 * like a bug in every form on earth.
 *
 * `user-select: none` would fix it in CSS, but this library does not require its
 * stylesheet, so the fix has to survive an unstyled consumer.
 */
export function LabelRoot({ asChild, onMouseDown, ...props }: LabelProps) {
  const Part: ElementType = asChild ? Slot : 'label'

  return (
    <Part
      {...props}
      onMouseDown={(event: MouseEvent<HTMLLabelElement>) => {
        onMouseDown?.(event)
        // Only the second click of a double-click, and only when the consumer
        // has not already handled it.
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault()
      }}
      data-bedrock-label=""
    />
  )
}
