import type { Ref } from 'react'

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
