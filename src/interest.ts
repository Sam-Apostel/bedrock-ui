import { useCallback, useEffect, useRef } from 'react'
import { supportsInterestInvokers } from './capabilities'

export interface InterestOptions {
  showDelay: number
  hideDelay: number
  /** Whether moving the pointer onto the content keeps it open. */
  hoverableContent: boolean
}

/**
 * Hover and focus intent, in JavaScript, for as long as `interestfor` is not
 * something we can rely on.
 *
 * This is the fallback the compat table calls "replaceable": when the attribute
 * ships, `useInterest` stops attaching anything and the same props become
 * declarative. Nothing above it changes — which is the entire reason
 * `delayDuration` is not called `interest-show-delay`.
 *
 * Deliberately not a general hover library: it does the four things the pattern
 * needs — pointer in, pointer out, focus, blur — and leaves dismissal to the
 * popover, which already handles Escape and light dismiss.
 *
 * Listeners are attached when a node registers, not from an effect that runs
 * each render. That distinction is load-bearing: opening the card is itself a
 * render, so a re-attaching effect drops any pointer event that lands between
 * the teardown and the rebuild — which is exactly when the pointer is moving
 * from the trigger onto the content.
 */
export function useInterest({ showDelay, hideDelay, hoverableContent }: InterestOptions) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLElement | null>(null)
  const timer = useRef<number>(0)

  // Read at call time, so changing a delay never means rebinding anything.
  const options = useRef({ showDelay, hideDelay, hoverableContent })
  options.current = { showDelay, hideDelay, hoverableContent }

  const clear = useCallback(() => window.clearTimeout(timer.current), [])

  const show = useCallback(() => {
    clear()
    timer.current = window.setTimeout(() => {
      const content = contentRef.current
      if (content && !content.matches(':popover-open')) content.showPopover()
    }, options.current.showDelay)
  }, [clear])

  const hide = useCallback(() => {
    clear()
    timer.current = window.setTimeout(() => {
      const content = contentRef.current
      if (content?.matches(':popover-open')) content.hidePopover()
    }, options.current.hideDelay)
  }, [clear])

  const keepOpen = useCallback(() => {
    if (options.current.hoverableContent) clear()
  }, [clear])

  const leaveContent = useCallback(() => {
    if (options.current.hoverableContent) hide()
  }, [hide])

  const bindTrigger = useCallback(
    (node: HTMLElement, add: boolean) => {
      const method = add ? 'addEventListener' : 'removeEventListener'
      node[method]('pointerenter', show)
      node[method]('pointerleave', hide)
      // Focus, not focusin: the trigger itself is the control, and a tooltip
      // should not appear because something inside it was focused.
      node[method]('focus', show)
      node[method]('blur', hide)
    },
    [show, hide],
  )

  const bindContent = useCallback(
    (node: HTMLElement, add: boolean) => {
      const method = add ? 'addEventListener' : 'removeEventListener'
      node[method]('pointerenter', keepOpen)
      node[method]('pointerleave', leaveContent)
    },
    [keepOpen, leaveContent],
  )

  const registerTrigger = useCallback(
    (node: HTMLElement | null) => {
      // When the platform does the work, nothing is attached and no timer runs.
      if (supportsInterestInvokers()) return

      const previous = triggerRef.current
      if (previous) bindTrigger(previous, false)

      triggerRef.current = node
      if (node) bindTrigger(node, true)
    },
    [bindTrigger],
  )

  const registerInterestContent = useCallback(
    (node: HTMLElement | null) => {
      if (supportsInterestInvokers()) return

      const previous = contentRef.current
      if (previous) bindContent(previous, false)

      contentRef.current = node
      if (node) bindContent(node, true)
    },
    [bindContent],
  )

  // Only unmount. A pending timer outliving the component would call
  // showPopover() on a detached node.
  useEffect(() => clear, [clear])

  return { registerTrigger, registerInterestContent }
}
