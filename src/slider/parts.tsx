import { useCallback, type ChangeEvent, type ComponentPropsWithRef, type ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface SliderProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'value' | 'defaultValue'>, AsChildProps {
  defaultValue?: number
  value?: number
  min?: number
  max?: number
  step?: number
  orientation?: 'horizontal' | 'vertical'
  onValueChange?(value: number): void
}

/**
 * An `<input type="range">`. Keyboard, `aria-valuenow`, page-up and page-down,
 * touch, and the pointer capture that makes dragging work are all the element's.
 *
 * Radix implements every one of those. The cost of not doing so is real and
 * named in the docs: this takes a single value, because a range input has one
 * thumb and a two-thumb range has no native equivalent.
 */
/**
 * `children` is accepted and dropped. Radix nests Track, Range and Thumb inside
 * the root, and an `<input>` is a void element that React refuses to give
 * children to — so the markup would not compile at all. Dropping them lets
 * Radix-shaped code keep its shape while the element stays one element.
 */
export function SliderRoot({
  asChild,
  children: _children,
  orientation = 'horizontal',
  onValueChange,
  onChange,
  style,
  ...props
}: SliderProps) {
  const Part: ElementType = asChild ? Slot : 'input'

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onValueChange?.(event.currentTarget.valueAsNumber)
    },
    [onChange, onValueChange],
  )

  return (
    <Part
      {...props}
      type="range"
      // A vertical range input is a writing mode, not a transform: the arrow
      // keys and the drag direction follow it, which a rotation would break.
      style={orientation === 'vertical' ? { writingMode: 'vertical-rl', ...style } : style}
      data-orientation={orientation}
      onChange={handleChange}
      data-bedrock-slider=""
    />
  )
}

let warned = false

export interface SliderPartProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/**
 * Track, Range and Thumb all render nothing — an `<input>` has no children.
 * `::-webkit-slider-runnable-track` and `::-webkit-slider-thumb` are the hooks,
 * after `appearance: none`.
 */
function nothing(className: string | undefined, part: string) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      `[bedrock] Slider.${part} renders nothing — an <input> has no children. ` +
        'Style ::-webkit-slider-runnable-track and ::-webkit-slider-thumb on Slider.Root.',
    )
  }

  return null
}

export function SliderTrack({ className }: SliderPartProps) {
  return nothing(className, 'Track')
}

export function SliderRange({ className }: SliderPartProps) {
  return nothing(className, 'Range')
}

export function SliderThumb({ className }: SliderPartProps) {
  return nothing(className, 'Thumb')
}
