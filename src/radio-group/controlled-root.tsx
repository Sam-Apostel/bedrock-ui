import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { RadioGroupContext } from './parts'

export interface ControlledRadioGroupRootProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'>, AsChildProps {
  name?: string
  value: string
  orientation?: 'horizontal' | 'vertical'
  onValueChange?: ((value: string) => void) | undefined
}

/**
 * As with Checkbox, the veto is React's own: the items become controlled inputs
 * because the context carries a `value`, so a prop that does not change is a
 * refusal and React writes the DOM back before paint.
 *
 * `RadioGroup.Item` never branches on which root it is under — it branches on
 * whether the context has a value, which is a property of the data rather than
 * of the bundle it came from.
 */
export function RadioGroupRoot({
  asChild,
  children,
  name,
  value,
  orientation = 'vertical',
  onValueChange,
  ...props
}: ControlledRadioGroupRootProps) {
  const generated = useId()
  const Part: ElementType = asChild ? Slot : 'div'

  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  const report = useCallback((next: string) => changeRef.current?.(next), [])

  const context = useMemo(
    () => ({
      name: name ?? generated,
      defaultValue: undefined,
      value,
      report,
      orientation,
    }),
    [name, generated, value, report, orientation],
  )

  return (
    <RadioGroupContext.Provider value={context}>
      <Part
        {...props}
        role="radiogroup"
        aria-orientation={orientation}
        data-orientation={orientation}
        data-bedrock-radio-group=""
      >
        {children}
      </Part>
    </RadioGroupContext.Provider>
  )
}
