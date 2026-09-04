/**
 * Every non-Baseline feature test lives here, so swapping an implementation
 * when a spec lands is one file rather than a search.
 *
 * All of them are safe to call while server-rendering.
 */

import { useSyncExternalStore } from 'react'

const hasDom = typeof window !== 'undefined'
const noopSubscribe = () => () => {}

/**
 * `interestfor` — hover and focus intent without timers. In Chrome since 142
 * and in no other engine, and still not on a standards track, which is why
 * Tooltip and HoverCard ship the JavaScript path as their normal one rather
 * than as a contingency.
 */
export function supportsInterestInvokers(): boolean {
  return hasDom && 'interestForElement' in HTMLButtonElement.prototype
}

/** Anchor positioning. Without it, overlays land where the UA puts them. */
export function supportsAnchorPositioning(): boolean {
  return hasDom && CSS.supports('anchor-name', '--a')
}

/**
 * `popover=hint`, which layers above an open menu instead of closing it.
 *
 * Asking is not optional politeness. `popover` is an enumerated attribute whose
 * invalid-value default is **manual**, so an engine that has never heard of
 * `hint` does not ignore it and fall back to `auto` — it reads the element as a
 * popover nothing dismisses. Emitting it unasked costs light dismiss and
 * Escape on every engine but Chrome.
 */
export function supportsHintPopovers(): boolean {
  if (!hasDom) return false

  const element = document.createElement('div')
  element.popover = 'hint'
  return element.popover === 'hint'
}

/**
 * The same test, as a hook, for anything that changes what is rendered.
 *
 * A plain call would return false on the server and true on the client's first
 * render, which is a hydration mismatch. This reports the server's answer for
 * the hydrating render and the real one immediately after.
 */
export function useSupportsInterestInvokers(): boolean {
  return useSyncExternalStore(noopSubscribe, supportsInterestInvokers, () => false)
}

/** Likewise: the answer decides which attribute value is written. */
export function useSupportsHintPopovers(): boolean {
  return useSyncExternalStore(noopSubscribe, supportsHintPopovers, () => false)
}
