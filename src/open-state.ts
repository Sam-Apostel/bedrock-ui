import { useCallback, useRef, useState } from 'react'

/**
 * Separate calls, not `:open, :popover-open`. An unknown selector invalidates a
 * whole selector list and makes `matches()` throw, so combining them would mean
 * an engine missing either one reports every element as closed.
 */
function matchesSelector(node: HTMLElement, selector: string): boolean {
  try {
    return node.matches(selector)
  } catch {
    return false
  }
}

/**
 * Whether the element is open, by the DOM's own reckoning.
 *
 * `:open` covers `<dialog>`, `<details>` and `<select>`. It does **not** match
 * an open popover in Chrome today — measured, not assumed — which is why
 * `:popover-open` is asked separately rather than trusted to be covered.
 *
 * Getting this wrong is not subtle: `settle()` reads it a frame after opening,
 * concludes a perfectly open popover is closed, and unmounts the children. The
 * popover stays open and empty, collapsing to the width of nothing.
 */
function isOpen(node: HTMLElement): boolean {
  return matchesSelector(node, ':popover-open') || matchesSelector(node, ':open')
}

/**
 * Tracks what the DOM is actually doing, so parts can render children only
 * while there is something to see.
 *
 * Three timing details, each of which is a bug if you get it wrong:
 *
 *  1. Children mount on `beforetoggle`, not `toggle`, so an opening element is
 *     never briefly empty. `beforetoggle` fires before the frame that shows it.
 *  2. A refused open fires `beforetoggle` and then nothing at all, so a check
 *     after the dispatch puts the flag back.
 *  3. Children stay mounted until the exit animation finishes. `allow-discrete`
 *     keeps the element displayed while it plays; unmounting at `toggle` would
 *     empty it halfway through the fade.
 *
 * Shared by both roots, and identical under each — a part must never be able to
 * tell which one it is under.
 */
export function useOpenState(onToggle?: (open: boolean) => void, initialOpen = false) {
  // `defaultOpen` seeds this so the children are already in the DOM when the
  // root calls showModal(). Open an empty dialog and the browser focuses the
  // dialog itself; open a populated one and it focuses the first control, which
  // is the behaviour everyone expects and Radix implements by hand.
  const [open, setOpen] = useState(initialOpen)
  const nodeRef = useRef<HTMLElement | null>(null)
  const callbackRef = useRef(onToggle)
  callbackRef.current = onToggle

  // The last state the consumer has been told about, seeded with the initial
  // one: an element born open declaratively has nothing to report, because
  // nobody opened it. Only the recovery path reads this — a toggle event fires
  // solely on a real change, so it always reports.
  const reportedRef = useRef(initialOpen)

  const report = useCallback((next: boolean) => {
    reportedRef.current = next
    callbackRef.current?.(next)
  }, [])

  const settle = useCallback((node: HTMLElement) => {
    // A frame, so transitions started by the state change exist to be found.
    requestAnimationFrame(() => {
      if (isOpen(node)) return setOpen(true)

      const running = node.getAnimations({ subtree: true })
      if (running.length === 0) return setOpen(false)

      void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
        if (!isOpen(node)) setOpen(false)
      })
    })
  }, [])

  const handleBeforeToggle = useCallback(
    (event: Event) => {
      const node = nodeRef.current
      if (!node) return
      if ((event as ToggleEvent).newState === 'open') setOpen(true)
      settle(node)
    },
    [settle],
  )

  const handleToggle = useCallback(
    (event: Event) => {
      const next = (event as ToggleEvent).newState === 'open'
      report(next)

      const node = nodeRef.current
      if (!node) return setOpen(next)
      if (next) return setOpen(true)
      settle(node)
    },
    [report, settle],
  )

  const observe = useCallback(
    (node: HTMLElement | null) => {
      const previous = nodeRef.current
      if (previous) {
        previous.removeEventListener('beforetoggle', handleBeforeToggle)
        previous.removeEventListener('toggle', handleToggle)
      }

      nodeRef.current = node
      if (!node) return

      node.addEventListener('beforetoggle', handleBeforeToggle)
      node.addEventListener('toggle', handleToggle)

      // An invoker works with no JavaScript at all, so the element can already
      // be open by the time this listener attaches — a click landing before
      // hydration finishes is enough. Recover both halves: the state, so the
      // children mount, and the report, so a consumer watching `onOpenChange`
      // is not left believing it is still closed.
      //
      // `reportedRef` is what separates that from `defaultOpen`, where the
      // element is open because we asked for it and there is nothing to report.
      // It also keeps a ref that reattaches while open from reporting twice.
      if (isOpen(node)) {
        setOpen(true)
        if (!reportedRef.current) report(true)
      }
    },
    [handleBeforeToggle, handleToggle, report],
  )

  return { open, observe, nodeRef }
}
