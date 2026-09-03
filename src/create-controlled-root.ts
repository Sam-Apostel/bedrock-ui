import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useOpenState } from './open-state'
import type { OpenStateAdapter, RootContextValue } from './types'

export interface ControlledRootProps {
  open: boolean
  // Explicitly `| undefined` so a root can destructure its props and pass the
  // pieces on under exactOptionalPropertyTypes.
  onOpenChange?: ((open: boolean) => void) | undefined
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
 * Where step 1 isn't available there is no veto, only a report. `<details>` is
 * the case: no `beforetoggle`, no `cancel`, just a `toggle` once the disclosure
 * has already moved. Step 3 does not stand in for it, because step 3 is keyed
 * on the prop and a refusal is exactly the case where the prop does not change.
 * So a declined toggle on a `<details>`-backed primitive stays where the user
 * put it, with `open` disagreeing until something else moves it.
 *
 * That is the documented gap rather than a bug to fix here — see
 * docs/known-gaps.md. Reverting afterwards would be a visible flicker, and the
 * accept path could not be told from the refusal path reliably: `toggle` is
 * dispatched asynchronously, so a consumer who accepts has not necessarily
 * re-rendered by the time we would have to decide.
 */
export function useControlledRoot(
  { open, onOpenChange }: ControlledRootProps,
  adapter: OpenStateAdapter,
): RootContextValue {
  const id = useId()
  const [node, setNode] = useState<HTMLElement | null>(null)

  // The same DOM-observed open state the plain root publishes, from the same
  // hook. It is deliberately not derived from the `open` prop: during a refused
  // open the prop and the DOM disagree, and children follow the DOM.
  const { open: domOpen, observe } = useOpenState()

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

    // Reached when `beforetoggle` couldn't be canceled, or — `<details>` —
    // never fired at all. The move has happened; reporting it is all that is
    // left, and the consumer's answer cannot change it.
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

  const registerContent = useCallback(
    (next: HTMLElement | null) => {
      observe(next)
      setNode(next)
    },
    [observe],
  )

  return { id, open: domOpen, registerContent }
}
