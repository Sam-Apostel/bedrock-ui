import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

interface RadioGroupContextValue {
  name: string
  defaultValue: string | undefined
  value: string | undefined
  report(value: string): void
  orientation: 'horizontal' | 'vertical'
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export function useRadioGroupContext(part: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside RadioGroup.Root.`)
  return context
}

export { RadioGroupContext }

export interface RadioGroupRootProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  name?: string
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
  onValueChange?(value: string): void
}

/**
 * The whole roving-tabindex problem, solved by giving the inputs the same
 * `name`. A radio group is one tab stop, arrow keys move and select, Home and
 * End work — all of it from the browser, none of it from a keydown handler.
 *
 * This is the reason RadioGroup lands in the cheap group and DropdownMenu does
 * not: there is no native equivalent for a menu.
 */
export function RadioGroupRoot({
  asChild,
  children,
  name,
  defaultValue,
  orientation = 'vertical',
  onValueChange,
  ...props
}: RadioGroupRootProps) {
  const generated = useId()
  const Part: ElementType = asChild ? Slot : 'div'

  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  const report = useCallback((value: string) => changeRef.current?.(value), [])
  const initialValue = useRef(defaultValue)

  const context = useMemo(
    () => ({
      name: name ?? generated,
      defaultValue: initialValue.current,
      value: undefined,
      report,
      orientation,
    }),
    [name, generated, report, orientation],
  )

  return (
    <RadioGroupContext.Provider value={context}>
      <Part
        {...props}
        // The inputs carry the group semantics; this is a container for layout
        // and for `aria-labelledby` to attach to.
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

export interface RadioGroupItemProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'name' | 'checked'>, AsChildProps {
  value: string
}

export function RadioGroupItem({ asChild, value, onChange, ...props }: RadioGroupItemProps) {
  const { name, defaultValue, value: controlled, report } = useRadioGroupContext('RadioGroup.Item')
  const Part: ElementType = asChild ? Slot : 'input'
  const checkedProps =
    controlled === undefined
      ? { defaultChecked: defaultValue === value }
      : { checked: controlled === value }

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      if (event.currentTarget.checked) report(value)
    },
    [onChange, report, value],
  )

  return (
    <Part
      {...props}
      {...checkedProps}
      type="radio"
      name={name}
      value={value}
      onChange={handleChange}
      data-bedrock-radio-group-item=""
    />
  )
}

let warned = false

export interface RadioGroupIndicatorProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/** Renders nothing — the dot is a pseudo-element on the input. */
export function RadioGroupIndicator({ className }: RadioGroupIndicatorProps) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      '[bedrock] RadioGroup.Indicator renders nothing — an <input> has no children. ' +
        'Draw the dot with ::before on RadioGroup.Item under :checked.',
    )
  }

  return null
}
