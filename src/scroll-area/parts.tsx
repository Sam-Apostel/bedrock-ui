import type { ComponentPropsWithRef, CSSProperties, ElementType } from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface ScrollAreaProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  /** `auto` shows scrollbars only when there is something to scroll. */
  type?: 'auto' | 'always' | 'hover'
}

const SCROLLBAR: Record<string, string> = {
  auto: 'auto',
  always: 'scroll',
  hover: 'auto',
}

/**
 * A scroll container. Radix rebuilds scrollbars out of divs because browsers
 * used to disagree about styling them; `scrollbar-width` and `scrollbar-color`
 * are now the standard way, and `::-webkit-scrollbar` remains for the parts they
 * do not cover.
 *
 * What that costs: no custom scrollbar *elements*, so a design with a scrollbar
 * that has its own hover animation or sits outside the box is a redesign. What
 * it buys: momentum scrolling, overscroll behaviour, the scroll anchoring the
 * browser does, and no wheel listeners.
 */
export function ScrollAreaRoot({ asChild, type = 'auto', style, ...props }: ScrollAreaProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      style={{ overflow: SCROLLBAR[type] ?? 'auto', ...style } as CSSProperties}
      data-bedrock-scroll-area=""
    />
  )
}

export interface ScrollAreaViewportProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

/** Kept so Radix-shaped markup compiles; the root is already the viewport. */
export function ScrollAreaViewport({ asChild, ...props }: ScrollAreaViewportProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return <Part {...props} data-bedrock-scroll-area-viewport="" />
}

let warned = false

export interface ScrollAreaScrollbarProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

/** Renders nothing — the scrollbar is the browser's. */
export function ScrollAreaScrollbar({ className }: ScrollAreaScrollbarProps) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      '[bedrock] ScrollArea.Scrollbar renders nothing — the scrollbar is the browser’s. ' +
        'Use scrollbar-width / scrollbar-color, or ::-webkit-scrollbar, on ScrollArea.Root.',
    )
  }

  return null
}

export function ScrollAreaThumb() {
  return null
}

export function ScrollAreaCorner() {
  return null
}
