import type { ComponentPropsWithRef, ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface ProgressProps
  extends Omit<ComponentPropsWithRef<'progress'>, 'value'>, AsChildProps {
  /** Omit or pass null for an indeterminate bar. */
  value?: number | null
  max?: number
}

/**
 * A real `<progress>`. The role, the value semantics and the indeterminate
 * state are the element's own, so there is nothing to reimplement and nothing
 * to keep in sync with `aria-valuenow`.
 *
 * The fill is `::-webkit-progress-value`, which is why there is no `Indicator`
 * element to put a `className` on.
 */
export function ProgressRoot({ asChild, value, max = 100, ...props }: ProgressProps) {
  const Part: ElementType = asChild ? Slot : 'progress'

  return (
    <Part
      {...props}
      // `undefined`, not null: omitting the attribute is what makes it
      // indeterminate, and null would stringify.
      value={value ?? undefined}
      max={max}
      data-bedrock-progress=""
    />
  )
}

let warned = false

export interface ProgressIndicatorProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

/**
 * Kept so Radix-shaped code compiles, and renders nothing. `<progress>` draws
 * its own fill; style it with `::-webkit-progress-value` and
 * `::-webkit-progress-bar` after `appearance: none`.
 */
export function ProgressIndicator({ className }: ProgressIndicatorProps) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      '[bedrock] Progress.Indicator renders nothing — <progress> draws its own fill. ' +
        'Style ::-webkit-progress-value on Progress.Root instead.',
    )
  }

  return null
}
