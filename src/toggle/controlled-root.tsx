import { useCallback, type ComponentPropsWithRef, type ElementType, type MouseEvent } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface ControlledToggleProps
  extends Omit<ComponentPropsWithRef<'button'>, 'defaultValue'>, AsChildProps {
  pressed: boolean
  onPressedChange?: ((pressed: boolean) => void) | undefined
}

/** `pressed` decides; the click reports and changes nothing on its own. */
export function ToggleRoot({
  asChild,
  pressed,
  onPressedChange,
  onClick,
  ...props
}: ControlledToggleProps) {
  const Part: ElementType = asChild ? Slot : 'button'

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) onPressedChange?.(!pressed)
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
