import { useCallback, useEffect, useRef } from 'react'

export type Orientation = 'horizontal' | 'vertical' | 'both'

export interface RovingOptions {
  orientation: Orientation
  loop: boolean
  /** Jump to the item whose text starts with what you typed. */
  typeahead: boolean
}

const ITEM = '[data-bedrock-roving-item]'
const TYPEAHEAD_RESET = 1000

function items(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(ITEM)].filter(
    (item) =>
      !item.hasAttribute('disabled') &&
      item.getAttribute('aria-disabled') !== 'true' &&
      item.offsetParent !== null,
  )
}

function focus(item: HTMLElement | undefined) {
  if (!item) return
  item.focus()
}

/**
 * Roving tabindex, arrow-key navigation and typeahead. One module, built once,
 * because every menu-shaped primitive needs all three and the platform provides
 * none of them outside a radio group.
 *
 * This is the honest half of the library: there is no native roving tabindex,
 * so DropdownMenu, Menubar, Tabs, Toolbar and ToggleGroup all pay for this file
 * whichever entry point they come from. The two-root split saves them almost
 * nothing, and the docs say so rather than implying otherwise.
 *
 * Items are found in the DOM rather than registered through context: a
 * collection built from React children goes stale the moment something renders
 * conditionally, and the DOM is already the source of truth everywhere else
 * here.
 */
export function useRoving({ orientation, loop, typeahead }: RovingOptions) {
  const containerRef = useRef<HTMLElement | null>(null)
  const search = useRef({ query: '', at: 0 })
  const options = useRef({ orientation, loop, typeahead })
  options.current = { orientation, loop, typeahead }

  // Exactly one item is tabbable, so the whole group is a single tab stop.
  const syncTabIndex = useCallback((active?: HTMLElement) => {
    const container = containerRef.current
    if (!container) return

    const all = items(container)
    const current = active ?? all.find((item) => item.tabIndex === 0) ?? all[0]

    for (const item of all) item.tabIndex = item === current ? 0 : -1
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    syncTabIndex()

    const onFocusIn = (event: FocusEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(ITEM)
      if (target) syncTabIndex(target)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      // A toolbar can contain a toggle group, so two containers see the same
      // bubbling event. Whoever acts first calls preventDefault; everyone
      // outside them then leaves it alone rather than stepping a second time.
      if (event.defaultPrevented) return

      const { orientation: axis, loop: wraps, typeahead: types } = options.current
      const all = items(container)
      if (all.length === 0) return

      const active = document.activeElement as HTMLElement | null
      const index = active ? all.indexOf(active.closest<HTMLElement>(ITEM) ?? active) : -1

      const forward = axis === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
      const back = axis === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
      const alsoForward = axis === 'both' ? 'ArrowRight' : null
      const alsoBack = axis === 'both' ? 'ArrowLeft' : null

      const step = (delta: number) => {
        event.preventDefault()
        const next = index + delta
        const bounded = wraps
          ? (next + all.length) % all.length
          : Math.min(Math.max(next, 0), all.length - 1)
        focus(all[bounded])
      }

      if (event.key === forward || event.key === alsoForward) return step(1)
      if (event.key === back || event.key === alsoBack) return step(-1)

      if (event.key === 'Home') {
        event.preventDefault()
        return focus(all[0])
      }

      if (event.key === 'End') {
        event.preventDefault()
        return focus(all[all.length - 1])
      }

      // A single printable character, no modifiers: everything else belongs to
      // the item, including the space bar on a button.
      if (!types || event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === ' ' && search.current.query === '') return

      const now = Date.now()
      if (now - search.current.at > TYPEAHEAD_RESET) search.current.query = ''
      search.current.at = now
      search.current.query += event.key.toLowerCase()

      const { query } = search.current
      // Start from the item after the current one so repeating a letter cycles.
      const ordered = [...all.slice(index + 1), ...all.slice(0, index + 1)]
      const match = ordered.find((item) => item.textContent?.trim().toLowerCase().startsWith(query))

      if (match) {
        event.preventDefault()
        focus(match)
      }
    }

    container.addEventListener('focusin', onFocusIn)
    container.addEventListener('keydown', onKeyDown)

    return () => {
      container.removeEventListener('focusin', onFocusIn)
      container.removeEventListener('keydown', onKeyDown)
    }
  }, [syncTabIndex])

  const registerContainer = useCallback(
    (node: HTMLElement | null) => {
      containerRef.current = node
      if (node) syncTabIndex()
    },
    [syncTabIndex],
  )

  return { registerContainer }
}
