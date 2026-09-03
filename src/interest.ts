import { useCallback, useEffect, useRef } from 'react'
import { supportsInterestInvokers } from './capabilities'

export interface InterestOptions {
  showDelay: number
  hideDelay: number
  /** Whether moving the pointer onto the content keeps it open. */
  hoverableContent: boolean
}

/**
 * A press long enough to be a deliberate gesture rather than a tap. iOS and
 * Android both use half a second for their own long-press, so it is the number
 * a thumb already knows — and it is deliberately not `showDelay`, because a
 * press is a different gesture from a pointer coming to rest, and a consumer
 * tuning one has said nothing about the other.
 */
const PRESS_DURATION = 500

/** How far a finger may drift and still be pressing rather than scrolling. */
const PRESS_SLOP = 10

/** Long enough to catch the click a lift produces, short enough to catch only that one. */
const CLICK_GRACE = 400

/**
 * Whether the focus is one a tooltip should answer.
 *
 * Tapping a control focuses it on Android, and a tooltip that appears on tap is
 * a popover with extra steps. `:focus-visible` is the platform's own answer to
 * "did this focus come from a pointer", so we ask it rather than tracking the
 * last input type ourselves.
 */
function focusIsVisible(node: Element): boolean {
  try {
    return node.matches(':focus-visible')
  } catch {
    // An engine that does not know the selector throws. Showing on every focus
    // is the older behaviour and the safer one: an unwanted tooltip beats a
    // keyboard user who can never see one.
    return true
  }
}

/**
 * A touch pointer reports enter on touchdown and leave on lift, so the hover
 * path would make every tap a half-open tooltip. Touch has its own gesture; the
 * hover handlers are for the pointers that actually hover.
 */
function hovering(event: Event): boolean {
  return (event as PointerEvent).pointerType !== 'touch'
}

/**
 * Hover, focus and press intent, in JavaScript, for as long as `interestfor` is
 * not something we can rely on.
 *
 * This is the fallback the compat table calls "replaceable": when the attribute
 * ships, `useInterest` stops attaching anything and the same props become
 * declarative. Nothing above it changes — which is the entire reason
 * `delayDuration` is not called `interest-show-delay`.
 *
 * Deliberately not a general hover library: it does the gestures the pattern
 * needs — pointer in, pointer out, focus, blur, and the long press that stands
 * in for all four on a touch screen — and leaves dismissal to the popover,
 * which already handles Escape and light dismiss.
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
  const pressTimer = useRef<number>(0)
  const clickTimer = useRef<number>(0)

  // Null between gestures; `held` flips once the press has lasted long enough
  // to have opened something, which is what separates a press from a tap.
  const press = useRef<{ x: number; y: number; held: boolean } | null>(null)

  // Read at call time, so changing a delay never means rebinding anything.
  const options = useRef({ showDelay, hideDelay, hoverableContent })
  options.current = { showDelay, hideDelay, hoverableContent }

  const clear = useCallback(() => window.clearTimeout(timer.current), [])

  const reveal = useCallback(() => {
    const content = contentRef.current
    if (content && !content.matches(':popover-open')) content.showPopover()
  }, [])

  const show = useCallback(() => {
    clear()
    timer.current = window.setTimeout(reveal, options.current.showDelay)
  }, [clear, reveal])

  const hide = useCallback(() => {
    clear()
    timer.current = window.setTimeout(() => {
      const content = contentRef.current
      if (content?.matches(':popover-open')) content.hidePopover()
    }, options.current.hideDelay)
  }, [clear])

  const enter = useCallback(
    (event: Event) => {
      if (hovering(event)) show()
    },
    [show],
  )

  const leave = useCallback(
    (event: Event) => {
      if (hovering(event)) hide()
    },
    [hide],
  )

  const focus = useCallback(
    (event: Event) => {
      if (focusIsVisible(event.currentTarget as Element)) show()
    },
    [show],
  )

  const keepOpen = useCallback(
    (event: Event) => {
      if (hovering(event) && options.current.hoverableContent) clear()
    },
    [clear],
  )

  const leaveContent = useCallback(
    (event: Event) => {
      if (hovering(event) && options.current.hoverableContent) hide()
    },
    [hide],
  )

  const suppressClick = useCallback((event: Event) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  /**
   * The lift of a press produces a click, and on an `<a>` that click is a
   * navigation. A press asked to see more about the control, not to activate
   * it, so exactly one click is swallowed — with a deadline, so a press that
   * ends without one does not leave a trap for the next real click.
   */
  const swallowClick = useCallback(
    (node: HTMLElement) => {
      node.addEventListener('click', suppressClick, { capture: true, once: true })
      window.clearTimeout(clickTimer.current)
      clickTimer.current = window.setTimeout(
        () => node.removeEventListener('click', suppressClick, true),
        CLICK_GRACE,
      )
    },
    [suppressClick],
  )

  /**
   * A long press is how a touch screen asks to see something without
   * activating it — the gesture iOS uses for its own link previews, and the one
   * `interestfor` is specified to answer where the platform does this itself.
   *
   * While it runs, selection is off. Otherwise the press is a text selection on
   * Android and a selection magnifier on iOS before it is ever ours. It is
   * turned off for the gesture rather than for the life of the trigger, because
   * a hover card trigger is usually a link in a paragraph and permanently
   * unselectable text drops out of the selection around it.
   */
  const startPress = useCallback(
    (event: Event) => {
      const pointer = event as PointerEvent
      if (pointer.pointerType !== 'touch') return

      const node = event.currentTarget as HTMLElement
      window.clearTimeout(pressTimer.current)
      press.current = { x: pointer.clientX, y: pointer.clientY, held: false }
      node.style.setProperty('user-select', 'none')
      node.style.setProperty('-webkit-user-select', 'none')

      pressTimer.current = window.setTimeout(() => {
        if (!press.current) return
        press.current.held = true
        reveal()
      }, PRESS_DURATION)
    },
    [reveal],
  )

  const endPress = useCallback((node: HTMLElement) => {
    window.clearTimeout(pressTimer.current)
    press.current = null
    node.style.removeProperty('user-select')
    node.style.removeProperty('-webkit-user-select')
  }, [])

  const movePress = useCallback(
    (event: Event) => {
      const state = press.current
      if (!state || state.held) return

      const pointer = event as PointerEvent
      const drifted =
        Math.abs(pointer.clientX - state.x) > PRESS_SLOP ||
        Math.abs(pointer.clientY - state.y) > PRESS_SLOP

      // A finger that has moved that far is scrolling, and a page that opens
      // tooltips while you scroll past them is unusable.
      if (drifted) endPress(event.currentTarget as HTMLElement)
    },
    [endPress],
  )

  const liftPress = useCallback(
    (event: Event) => {
      const state = press.current
      const node = event.currentTarget as HTMLElement
      if (!state) return

      endPress(node)
      if (!state.held) return

      // The lift is a pointerup outside every open popover, and the popover the
      // press opened did not exist when the finger went down — so as far as
      // light dismiss is concerned it was never part of this gesture, and it
      // closes. Re-assert it in the same task the dismissal ran in: nothing is
      // painted between the two, so the card the press opened simply stays.
      reveal()
      swallowClick(node)
    },
    [endPress, reveal, swallowClick],
  )

  const cancelPress = useCallback(
    (event: Event) => endPress(event.currentTarget as HTMLElement),
    [endPress],
  )

  // Android offers its own long-press menu on the same gesture, and whichever
  // of the two the user gets should not be a race. iOS is asked in CSS instead,
  // by the `-webkit-touch-callout` the trigger carries.
  const suppressCallout = useCallback((event: Event) => {
    if (press.current) event.preventDefault()
  }, [])

  const bindTrigger = useCallback(
    (node: HTMLElement, add: boolean) => {
      const method = add ? 'addEventListener' : 'removeEventListener'
      node[method]('pointerenter', enter)
      node[method]('pointerleave', leave)
      // Focus, not focusin: the trigger itself is the control, and a tooltip
      // should not appear because something inside it was focused.
      node[method]('focus', focus)
      node[method]('blur', hide)
      // Touch captures its pointer implicitly, so every one of these lands on
      // the trigger for the whole gesture, wherever the finger has gone.
      node[method]('pointerdown', startPress)
      node[method]('pointermove', movePress)
      node[method]('pointerup', liftPress)
      node[method]('pointercancel', cancelPress)
      node[method]('contextmenu', suppressCallout)
    },
    [enter, leave, focus, hide, startPress, movePress, liftPress, cancelPress, suppressCallout],
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
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      window.clearTimeout(pressTimer.current)
      window.clearTimeout(clickTimer.current)
    },
    [],
  )

  return { registerTrigger, registerInterestContent }
}
