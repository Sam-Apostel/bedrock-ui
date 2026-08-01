import { useCallback, type ChangeEvent, type ComponentPropsWithRef, type ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface SwitchProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'checked'>, AsChildProps {
  defaultChecked?: boolean
  onCheckedChange?(checked: boolean): void
}

/**
 * A checkbox with `role="switch"`, which is exactly what the ARIA pattern says
 * a switch is: the same two-state control, announced as on/off rather than
 * checked/unchecked.
 *
 * Everything else — form participation, the space bar, `:checked` — comes from
 * the input, so the difference between this and Checkbox really is one
 * attribute.
 */
export function SwitchRoot({ asChild, onCheckedChange, onChange, ...props }: SwitchProps) {
  const Part: ElementType = asChild ? Slot : 'input'

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onCheckedChange?.(event.currentTarget.checked)
    },
    [onChange, onCheckedChange],
  )

  return (
    <Part {...props} type="checkbox" role="switch" onChange={handleChange} data-bedrock-switch="" />
  )
}

let warned = false

export interface SwitchThumbProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/** Renders nothing — the thumb is a pseudo-element on the input. */
export function SwitchThumb({ className }: SwitchThumbProps) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      '[bedrock] Switch.Thumb renders nothing — an <input> has no children. ' +
        'Draw the thumb with ::before on Switch.Root and move it under :checked.',
    )
  }

  return null
}
