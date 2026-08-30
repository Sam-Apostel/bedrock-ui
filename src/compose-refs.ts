import { useCallback, useRef, type Ref } from 'react'

type RefCleanup = () => void

/**
 * Assigns `value` to a single ref, returning React 19's cleanup function when
 * the ref is a callback that provides one.
 */
function assign<T>(ref: Ref<T> | undefined, value: T | null): RefCleanup | void {
  if (typeof ref === 'function') return ref(value) as RefCleanup | void
  if (ref) (ref as { current: T | null }).current = value
}

/**
 * Merges any number of refs into one callback ref.
 *
 * Slot always needs this: the consumer's ref on the child element has to keep
 * working while we also read the node ourselves for tag validation and, in
 * controlled mode, event wiring.
 */
export function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null): RefCleanup => {
    const cleanups = refs.map((ref) => assign(ref, node)).filter(Boolean) as RefCleanup[]

    return () => {
      if (cleanups.length > 0) {
        for (const cleanup of cleanups) cleanup()
        return
      }
      // Object refs and cleanup-less callback refs still need unsetting.
      for (const ref of refs) assign(ref, null)
    }
  }
}

/**
 * The same thing, with a stable identity, for use inside a component.
 *
 * `composeRefs` returns a new function on every call, and React treats a new
 * ref callback as a different ref: it detaches the old one and attaches the new
 * one on every render. For a ref that only stores a node that is merely
 * wasteful. For one that attaches event listeners it is a bug — an event
 * arriving in the gap between detach and attach is dropped, and nothing
 * re-delivers it. A popover that opens in that window stays open with its
 * content never mounted, because the `toggle` that would have told React went
 * nowhere.
 *
 * The returned callback never changes, so React attaches once and detaches at
 * unmount. The refs are read through a box, so a consumer passing a new ref
 * each render still gets the current one.
 */
export function useComposedRefs<T>(...refs: Array<Ref<T> | undefined>) {
  const latest = useRef(refs)
  latest.current = refs

  return useCallback((node: T | null): RefCleanup => {
    const current = latest.current
    const cleanups = current.map((ref) => assign(ref, node)).filter(Boolean) as RefCleanup[]

    return () => {
      if (cleanups.length > 0) {
        for (const cleanup of cleanups) cleanup()
        return
      }
      for (const ref of current) assign(ref, null)
    }
  }, [])
}
