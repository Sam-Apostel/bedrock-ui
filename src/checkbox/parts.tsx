import {
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import { composeRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface CheckboxProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'checked'>, AsChildProps {
  defaultChecked?: boolean
  /**
   * Property-only in the DOM — there is no `indeterminate` attribute — so this
   * is the one thing here that needs an effect. Expected, not a lapse.
   */
  indeterminate?: boolean
  onCheckedChange?(checked: boolean): void
}

/**
 * A real `<input type="checkbox">`. The role, the `:checked` state, form
 * participation, `required` validation and the space-bar behaviour are all the
 * element's own.
 *
 * Radix renders a `<button role="checkbox">` next to a hidden input, and keeps
 * the two in sync. There is nothing here to keep in sync.
 */
export function CheckboxRoot({
  asChild,
  children: _children,
  indeterminate = false,
  onCheckedChange,
  onChange,
  ref,
  ...props
}: CheckboxProps) {
  const Part: ElementType = asChild ? Slot : 'input'
  const nodeRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (nodeRef.current) nodeRef.current.indeterminate = indeterminate
  }, [indeterminate])

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
      onChange={handleChange}
      ref={composeRefs<HTMLInputElement>(ref, (node) => {
        nodeRef.current = node
      })}
      data-bedrock-checkbox=""
    />
  )
}

let warned = false

export interface CheckboxIndicatorProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/**
 * Renders nothing: an `<input>` cannot have children, so the tick is drawn by
 * the element. Set `appearance: none` and draw it with `::before` under
 * `:checked` and `:indeterminate`.
 */
export function CheckboxIndicator({ className }: CheckboxIndicatorProps) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      '[bedrock] Checkbox.Indicator renders nothing — an <input> has no children. ' +
        'Draw the mark with ::before on Checkbox.Root under :checked / :indeterminate.',
    )
  }

  return null
}
