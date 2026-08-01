import {
  useCallback,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ElementType,
} from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

/** csstype does not know `base-select` yet; the browser does. */
const BASE_SELECT = (style: CSSProperties | undefined): CSSProperties =>
  ({ appearance: 'base-select', ...style }) as CSSProperties

export interface SelectRootProps
  extends Omit<ComponentPropsWithRef<'select'>, 'value' | 'defaultValue'>, AsChildProps {
  defaultValue?: string
  value?: string
  onValueChange?(value: string): void
}

/**
 * A real `<select>`, made stylable by `appearance: base-select`.
 *
 * That is the whole primitive. Listbox semantics, typeahead, the mobile picker,
 * form participation, `:open` — all of it is the element's, including the parts
 * Radix has to rebuild and the parts it cannot (a native picker on a phone).
 *
 * The structure the customizable-select spec expects is the structure Radix
 * already has, which is why the part names line up so well:
 *
 *   <select>            Select.Root
 *     <button>          Select.Trigger
 *       <selectedcontent>   Select.Value
 *     <option>          Select.Item
 */
export function SelectRoot({ asChild, onValueChange, onChange, style, ...props }: SelectRootProps) {
  const Part: ElementType = asChild ? Slot : 'select'

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange?.(event)
      onValueChange?.(event.currentTarget.value)
    },
    [onChange, onValueChange],
  )

  return (
    <Part
      {...props}
      // Opting in to the stylable form. Without support the declaration is
      // dropped and this is an ordinary OS dropdown: accessible, unstylable.
      style={BASE_SELECT(style)}
      onChange={handleChange}
      data-bedrock-select=""
    />
  )
}

export interface SelectTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

/** The in-select button. Only rendered as one under `appearance: base-select`. */
export function SelectTrigger({ asChild, style, ...props }: SelectTriggerProps) {
  const Part: ElementType = asChild ? Slot : 'button'

  return <Part {...props} type="button" style={BASE_SELECT(style)} data-bedrock-select-trigger="" />
}

export interface SelectValueProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/**
 * `<selectedcontent>`, which mirrors the chosen option's markup — so an option
 * with an icon and two lines of text shows both in the closed state without
 * anyone duplicating it into a `Value` render prop.
 */
export function SelectValue({ asChild, ...props }: SelectValueProps) {
  const Part: ElementType = asChild ? Slot : ('selectedcontent' as ElementType)

  return <Part {...props} data-bedrock-select-value="" />
}

export interface SelectContentProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

/** The picker's box. It is the select's own popover, so nothing is portalled. */
export function SelectContent({ asChild, style, ...props }: SelectContentProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return <Part {...props} style={BASE_SELECT(style)} data-bedrock-select-content="" />
}

export interface SelectItemProps extends ComponentPropsWithRef<'option'>, AsChildProps {
  value: string
}

export function SelectItem({ asChild, ...props }: SelectItemProps) {
  const Part: ElementType = asChild ? Slot : 'option'

  return <Part {...props} data-bedrock-select-item="" />
}

export interface SelectItemTextProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

export function SelectItemText({ asChild, ...props }: SelectItemTextProps) {
  const Part: ElementType = asChild ? Slot : 'span'

  return <Part {...props} data-bedrock-select-item-text="" />
}

let warned = false

export interface SelectItemIndicatorProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/** Renders nothing — the tick is `::checkmark` on the selected option. */
export function SelectItemIndicator({ className }: SelectItemIndicatorProps) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      '[bedrock] Select.ItemIndicator renders nothing — style option::checkmark instead.',
    )
  }

  return null
}

export interface SelectGroupProps extends ComponentPropsWithRef<'optgroup'>, AsChildProps {}

export function SelectGroup({ asChild, ...props }: SelectGroupProps) {
  const Part: ElementType = asChild ? Slot : 'optgroup'

  return <Part {...props} data-bedrock-select-group="" />
}

export interface SelectSeparatorProps extends ComponentPropsWithRef<'hr'>, AsChildProps {}

export function SelectSeparator({ asChild, ...props }: SelectSeparatorProps) {
  const Part: ElementType = asChild ? Slot : 'hr'

  return <Part {...props} data-bedrock-select-separator="" />
}
