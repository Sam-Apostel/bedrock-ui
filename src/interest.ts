import { useCallback, useEffect, useRef } from 'react'
import { supportsInterestInvokers } from './capabilities'

export interface InterestOptions {
  showDelay: number
  hideDelay: number
  /** Whether moving the pointer onto the content keeps it open. */
  hoverableContent: boolean
  /** Whether a press that opened it survives the finger coming back up. */
  pressHolds: boolean
}

/**
 * How long a finger rests before the panel opens, in milliseconds.
 *
 * Two numbers, because the wait is not for the gesture — it is for the tap the
 * gesture might have been. An info icon does nothing when you tap it, so there
 * is nothing to protect and the only thing left to wait for is long enough to
 * tell a hold from the start of a scroll. A button or a link does something,
 * and opening before a tap has had time to be a tap would eat it.
 *
 * Neither is `showDelay`. A press is a different gesture from a pointer coming
 * to rest, and a consumer tuning one has said nothing about the other.
 */
const PRESS_WITHOUT_A_TAP = 150
const PRESS_PAST_A_TAP = 250

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
 * Whether tapping this trigger would do anything.
 *
 * Only half the answer is in the DOM — a React handler is not an attribute — so
 * the trigger part passes what it knows and this covers the rest: a link, and a
 * button that submits the form it is in.
 */
function activatesOnTap(node: HTMLElement): boolean {
  if (node.tagName === 'A') return node.hasAttribute('href')

  return (
    node.tagName === 'BUTTON' &&
    (node as HTMLButtonElement).type !== 'button' &&
    node.closest('form') !== null
  )
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
 * This is the fallback the compat table calls "replaceable": where the attribute
 * is supported, `useInterest` stops opening anything and the same props become
 * declarative. Nothing above it changes — which is the entire reason
 * `delayDuration` is not called `interest-show-delay`.
 *
 * One thing stays attached either way. A long press ends in a click, and a
 * browser answering the press itself still lets that click through, so the
 * gesture previews the link *and* follows it. Tracking the press costs four
 * listeners and an early return; leaving it to the platform costs a navigation
 * nobody asked for.
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
export function useInterest({
  showDelay,
  hideDelay,
  hoverableContent,
  pressHolds,
}: InterestOptions) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLElement | null>(null)
  const timer = useRef<number>(0)
  const pressTimer = useRef<number>(0)
  const clickTimer = useRef<number>(0)

  // Null between gestures. `held` flips once our own press has lasted long
  // enough to have opened something, which is what separates a press from a
  // tap; `openAtDown` is what tells a press that opened the panel from a tap on
  // a trigger whose panel was already showing.
  const press = useRef<{ x: number; y: number; held: boolean; openAtDown: boolean } | null>(null)

  // Read at call time, so changing a delay never means rebinding anything.
  const options = useRef({ showDelay, hideDelay, hoverableContent, pressHolds })
  options.current = { showDelay, hideDelay, hoverableContent, pressHolds }

  // What the trigger part knows and the DOM does not: whether a tap has a
  // handler to reach. Set on every registration, read when a press begins.
  const triggerActivates = useRef(false)

  const clear = useCallback(() => window.clearTimeout(timer.current), [])

  const isOpen = useCallback(() => contentRef.current?.matches(':popover-open') === true, [])

  const reveal = useCallback(() => {
    const content = contentRef.current
    if (content && !isOpen()) content.showPopover()
  }, [isOpen])

  /** Now, not after `hideDelay`: a gesture that ended has nothing to wait for. */
  const conceal = useCallback(() => {
    if (isOpen()) contentRef.current?.hidePopover()
  }, [isOpen])

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
   * `interestfor` answers where the platform runs intent itself. The press is
   * tracked either way; only the opening is ours.
   *
   * While ours runs, selection is off. Otherwise the press is a text selection
   * on Android and a selection magnifier on iOS before it is ever ours. It is
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
      press.current = { x: pointer.clientX, y: pointer.clientY, held: false, openAtDown: isOpen() }
      if (supportsInterestInvokers()) return

      node.style.setProperty('user-select', 'none')
      node.style.setProperty('-webkit-user-select', 'none')

      const protecting = triggerActivates.current || activatesOnTap(node)

      pressTimer.current = window.setTimeout(
        () => {
          if (!press.current) return
          press.current.held = true
          reveal()
        },
        protecting ? PRESS_PAST_A_TAP : PRESS_WITHOUT_A_TAP,
      )
    },
    [isOpen, reveal],
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

      // A tooltip is a label held up while you press, so it goes when you let
      // go — and closing it here rather than leaving it to light dismiss is
      // what makes that true on an engine whose light dismiss never runs.
      //
      // A card is somewhere to go, so it stays. That takes work: the lift is a
      // pointerup outside every open popover, and the popover the press opened
      // did not exist when the finger went down, so as far as light dismiss is
      // concerned it was never part of this gesture and it closes. Re-assert in
      // the same task the dismissal ran in — nothing is painted between the
      // two, so the card the press opened simply stays.
      if (state.held) {
        if (options.current.pressHolds) reveal()
        else conceal()
      }

      // Whoever opened it, the lift still produces a click, and on an `<a>` that
      // click is a navigation. A browser answering the hold itself lets it
      // through, so a long press there previews *and* follows the link; only
      // that second half is ours to stop. A panel that was already showing when
      // the finger went down is not this gesture's, and the tap under it stands.
      if (state.held || (!state.openAtDown && isOpen())) swallowClick(node)
    },
    [conceal, endPress, isOpen, reveal, swallowClick],
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

      // Touch captures its pointer implicitly, so every one of these lands on
      // the trigger for the whole gesture, wherever the finger has gone. They
      // are bound even where the platform runs intent itself, because the click
      // a press ends in is left to us there — see `liftPress`.
      node[method]('pointerdown', startPress)
      node[method]('pointermove', movePress)
      node[method]('pointerup', liftPress)
      node[method]('pointercancel', cancelPress)

      if (supportsInterestInvokers()) return

      node[method]('pointerenter', enter)
      node[method]('pointerleave', leave)
      // Focus, not focusin: the trigger itself is the control, and a tooltip
      // should not appear because something inside it was focused.
      node[method]('focus', focus)
      node[method]('blur', hide)
      node[method]('contextmenu', suppressCallout)
    },
    [startPress, movePress, liftPress, cancelPress, enter, leave, focus, hide, suppressCallout],
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
    (node: HTMLElement | null, activates = false) => {
      triggerActivates.current = activates

      const previous = triggerRef.current
      if (previous) bindTrigger(previous, false)

      triggerRef.current = node
      if (node) bindTrigger(node, true)
    },
    [bindTrigger],
  )

  const registerInterestContent = useCallback(
    (node: HTMLElement | null) => {
      const previous = contentRef.current
      if (previous) bindContent(previous, false)

      // Held either way: where the platform runs intent, the lift still has to
      // ask whether this press is the reason the panel is showing.
      contentRef.current = node
      if (node && !supportsInterestInvokers()) bindContent(node, true)
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
