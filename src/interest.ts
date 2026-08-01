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
 */
export function useInterest({ showDelay, hideDelay, hoverableContent }: InterestOptions) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLElement | null>(null)
  const timer = useRef<number>(0)
  const options = useRef({ showDelay, hideDelay, hoverableContent })
  options.current = { showDelay, hideDelay, hoverableContent }

  useEffect(() => {
    // When the platform does the work, none of these listeners are attached and
    // the timers never exist.
    if (supportsInterestInvokers()) return

    const trigger = triggerRef.current
    const content = contentRef.current
    if (!trigger || !content) return

    const clear = () => window.clearTimeout(timer.current)

    const show = () => {
      clear()
      timer.current = window.setTimeout(() => {
        if (!content.matches(':popover-open')) content.showPopover()
      }, options.current.showDelay)
    }

    const hide = () => {
      clear()
      timer.current = window.setTimeout(() => {
        if (content.matches(':popover-open')) content.hidePopover()
      }, options.current.hideDelay)
    }

    trigger.addEventListener('pointerenter', show)
    trigger.addEventListener('pointerleave', hide)
    // Focus, not focusin: the trigger itself is the control, and a tooltip
    // should not appear because something inside it was focused.
    trigger.addEventListener('focus', show)
    trigger.addEventListener('blur', hide)

    if (options.current.hoverableContent) {
      content.addEventListener('pointerenter', clear)
      content.addEventListener('pointerleave', hide)
    }

    return () => {
      clear()
      trigger.removeEventListener('pointerenter', show)
      trigger.removeEventListener('pointerleave', hide)
      trigger.removeEventListener('focus', show)
      trigger.removeEventListener('blur', hide)
      content.removeEventListener('pointerenter', clear)
      content.removeEventListener('pointerleave', hide)
    }
  })

  const registerTrigger = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node
  }, [])

  const registerInterestContent = useCallback((node: HTMLElement | null) => {
    contentRef.current = node
  }, [])

  return { registerTrigger, registerInterestContent }
}
