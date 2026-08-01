import { useCallback, useRef, useState } from 'react'

/** `:open` covers dialog, popover, details and select alike. */
function isOpen(node: HTMLElement): boolean {
  try {
    return node.matches(':open')
  } catch {
    return false
  }
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
      callbackRef.current?.(next)

      const node = nodeRef.current
      if (!node) return setOpen(next)
      if (next) return setOpen(true)
      settle(node)
    },
    [settle],
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
      if (isOpen(node)) setOpen(true)
    },
    [handleBeforeToggle, handleToggle],
  )

  return { open, observe, nodeRef }
}
