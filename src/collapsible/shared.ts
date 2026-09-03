import { createContext, useContext } from 'react'
import type { OpenStateAdapter, RootContextValue } from '../types'

export const CollapsibleContext = createContext<RootContextValue | null>(null)

export function useCollapsibleContext(part: string): RootContextValue {
  const context = useContext(CollapsibleContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Collapsible.Root.`)
  return context
}

/**
 * `<details>` has no invoker and needs none: `<summary>` is the trigger, wired
 * to its parent by the parser. There is also no cancelable hook — no
 * `beforetoggle`, no `cancel` — so a controlled Collapsible cannot refuse a
 * toggle at all. These two calls only ever run from reconciliation, after the
 * `open` prop itself changed; nothing here ever undoes something the user did.
 */
export const collapsibleAdapter: OpenStateAdapter = {
  isOpen: (node) => (node as HTMLDetailsElement).open,
  open: (node) => {
    ;(node as HTMLDetailsElement).open = true
  },
  close: (node) => {
    ;(node as HTMLDetailsElement).open = false
  },
}
