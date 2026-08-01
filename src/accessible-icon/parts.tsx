import { cloneElement, isValidElement, type ReactElement } from 'react'
import type { AnyProps } from '../types'

export interface AccessibleIconProps {
  /** What a screen reader should announce in place of the glyph. */
  label: string
  children: ReactElement
}

/**
 * Radix hides the icon and appends a visually hidden `<span>` carrying the
 * label. Two elements, one of them off-screen text that has to be styled.
 *
 * `role="img"` plus `aria-label` says the same thing to assistive technology in
 * one element and no CSS — an image with an accessible name, which is what an
 * icon is.
 */
export function AccessibleIconRoot({ label, children }: AccessibleIconProps) {
  if (!isValidElement(children)) {
    throw new Error('[bedrock] AccessibleIcon expects exactly one React element child.')
  }

  const props = children.props as AnyProps

  return cloneElement(children, {
    ...props,
    role: 'img',
    'aria-label': label,
    'aria-hidden': undefined,
    focusable: false,
    'data-bedrock-accessible-icon': '',
  } as AnyProps)
}
