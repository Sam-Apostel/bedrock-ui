import {
  useCallback,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type MouseEvent,
} from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface ToggleProps extends ComponentPropsWithRef<'button'>, AsChildProps {
  defaultPressed?: boolean
  onPressedChange?(pressed: boolean): void
}

/**
 * The one control in this group with no native element behind it.
 *
 * A checkbox with `appearance: none` would give the state for free, but a
 * toggle button is a different thing to assistive technology — `aria-pressed`
 * on a button, not `:checked` on an input — and picking the wrong one to save
 * six lines of state would be the wrong trade.
 *
 * So this is a `<button aria-pressed>` with a `useState`, and it is honest
 * about being JavaScript. It is also why `data-state` still does not appear:
 * `[aria-pressed="true"]` is the selector.
 */
export function ToggleRoot({
  asChild,
  defaultPressed = false,
  onPressedChange,
  onClick,
  ...props
}: ToggleProps) {
  const [pressed, setPressed] = useState(defaultPressed)
  const Part: ElementType = asChild ? Slot : 'button'

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return

      const next = !pressed
      setPressed(next)
      onPressedChange?.(next)
    },
    [onClick, onPressedChange, pressed],
  )

  return (
    <Part
      {...props}
      type="button"
      aria-pressed={pressed}
      onClick={handleClick}
      data-bedrock-toggle=""
    />
  )
}
