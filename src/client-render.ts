import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * True on the client, false while server-rendering and for the hydrating render
 * that has to match it.
 *
 * It is what lets closed content be absent in the browser and present in the
 * HTML: a page whose JavaScript never arrives keeps working content, and a page
 * whose JavaScript does arrive stops paying for closed subtrees on load.
 */
export function useClientRender(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}
