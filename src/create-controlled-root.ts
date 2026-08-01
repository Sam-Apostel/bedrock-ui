import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { OpenStateAdapter, RootContextValue } from './types'

export interface ControlledRootProps {
  open: boolean
  onOpenChange?(open: boolean): void
}

/**
 * Builds the context value for a controlled root.
 *
 * This is the entire cost of controlled mode, and it lives on the root. Every
 * child part — Trigger, Content, Close — is byte-identical under both roots and
 * never branches on which one it's under. If children had to ask "am I
 * controlled?", the branch would ship in both bundles and the split would buy
 * nothing.
 *
 * The model is DOM leads, React vetoes:
 *
 *   1. The user acts. `beforetoggle` fires. Where it's cancelable — popovers —
 *      and the `open` prop disagrees, we preventDefault and nothing moved.
 *   2. `onOpenChange` fires regardless, so the consumer can decide.
 *   3. An effect on `open` reconciles the DOM whenever the prop changes without
 *      user interaction.
 *
 * Where step 1 isn't available, step 3 is the whole mechanism: the DOM moves,
 * we report, and if the consumer refuses we put it back. That's one frame of
 * visible movement, in the refusal case only. Worth knowing; not worth a
 * synchronous re-render to avoid.
 */
export function useControlledRoot(
  { open, onOpenChange }: ControlledRootProps,
  adapter: OpenStateAdapter,
): RootContextValue {
  const id = useId()
  const [node, setNode] = useState<HTMLElement | null>(null)

  // Read through refs inside listeners so we never rebind on every render.
  const openRef = useRef(open)
  const changeRef = useRef(onOpenChange)
  openRef.current = open
  changeRef.current = onOpenChange

  useEffect(() => {
    if (!node) return

    const onBeforeToggle = (event: Event) => {
      const next = (event as ToggleEvent).newState === 'open'
      if (next === openRef.current) return

      if (event.cancelable) event.preventDefault()
      changeRef.current?.(next)
    }

    // Only reached when beforetoggle couldn't be canceled.
    const onToggle = (event: Event) => {
      const next = (event as ToggleEvent).newState === 'open'
      if (next !== openRef.current) changeRef.current?.(next)
    }

    const onCloseVeto = (event: Event) => {
      if (openRef.current) event.preventDefault()
      changeRef.current?.(false)
    }

    node.addEventListener('beforetoggle', onBeforeToggle)
    node.addEventListener('toggle', onToggle)
    if (adapter.closeVetoEvent) node.addEventListener(adapter.closeVetoEvent, onCloseVeto)

    return () => {
      node.removeEventListener('beforetoggle', onBeforeToggle)
      node.removeEventListener('toggle', onToggle)
      if (adapter.closeVetoEvent) node.removeEventListener(adapter.closeVetoEvent, onCloseVeto)
    }
  }, [node, adapter])

  // Reconcile: the prop is the source of truth once React has settled.
  useEffect(() => {
    if (!node) return
    if (adapter.isOpen(node) === open) return

    // Note for adapter authors: a state update from a discrete event is flushed
    // synchronously, so this runs while the browser is still inside the dispatch
    // it is reacting to. An adapter whose close is a *request* — anything built
    // on a close watcher — will find that call silently dropped as re-entrant.
    // Adapters must close outright here; the veto already happened.
    if (open) adapter.open(node)
    else adapter.close(node)
  }, [node, open, adapter])

  const registerContent = useCallback((next: HTMLElement | null) => setNode(next), [])

  return { id, registerContent }
}
