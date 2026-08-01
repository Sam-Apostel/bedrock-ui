import { useCallback, type ChangeEvent, type ComponentPropsWithRef, type ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface ControlledCheckboxProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'defaultChecked'>, AsChildProps {
  checked: boolean
  indeterminate?: boolean
  onCheckedChange?: ((checked: boolean) => void) | undefined
}

/**
 * The veto for a form control is React's own controlled input, and it works the
 * way the rest of this library does: the user clicks, the DOM flips, you are
 * told, and if your prop does not change React puts it back before paint.
 *
 * So there is no reconciliation layer here, no adapter and no listener — which
 * is why this file is fifteen lines rather than ninety. `useControlledRoot`
 * exists for top-layer elements, where the platform's events are the only hook.
 */
export function CheckboxRoot({
  asChild,
  checked,
  indeterminate = false,
  onCheckedChange,
  onChange,
  ...props
}: ControlledCheckboxProps) {
  const Part: ElementType = asChild ? Slot : 'input'

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onCheckedChange?.(event.currentTarget.checked)
    },
    [onChange, onCheckedChange],
  )

  return (
    <Part
      {...props}
      type="checkbox"
      checked={checked}
      // Deliberately not a ref effect: React writes `checked` on every render,
      // and `indeterminate` has to be written alongside it or a controlled
      // checkbox can show a tick and a dash at once.
      ref={(node: HTMLInputElement | null) => {
        if (node) node.indeterminate = indeterminate
      }}
      onChange={handleChange}
      data-bedrock-checkbox=""
    />
  )
}
