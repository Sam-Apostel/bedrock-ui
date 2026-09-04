import { createContext, useContext } from 'react'
import { useSupportsHintPopovers } from '../capabilities'
import type { OpenStateAdapter, RootContextValue } from '../types'

export type PopoverKind = 'auto' | 'manual' | 'hint'

/**
 * The kind the browser will actually honour.
 *
 * `popover` is an enumerated attribute whose invalid-value default is
 * **manual**, so `hint` on an engine that has never heard of it does not
 * degrade to `auto` — it produces a popover that neither light dismiss nor
 * Escape reaches, which on a phone is a tooltip you cannot get rid of. Asking
 * first is what makes the documented fallback the real one.
 *
 * Resolved in the roots, so no part ever branches on it.
 */
export function usePopoverKind<Kind extends PopoverKind>(kind: Kind): Kind | 'auto' {
  const hint = useSupportsHintPopovers()
  return kind === 'hint' && !hint ? 'auto' : kind
}

export interface PopoverContextValue extends RootContextValue {
  /** The `anchor-name` this instance owns, shared by trigger and content. */
  anchor: string
  kind: PopoverKind
}

export const PopoverContext = createContext<PopoverContextValue | null>(null)

export function usePopoverContext(part: string): PopoverContextValue {
  const context = useContext(PopoverContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Popover.Root.`)
  return context
}

/**
 * `beforetoggle` on a popover is cancelable in both directions, so a controlled
 * Popover refuses outright — no frame of visible movement, unlike Collapsible.
 *
 * `hidePopover()` is not a close *request*, so unlike `<dialog>` there is no
 * re-entrancy trap when reconciliation runs inside the dispatch it reacts to.
 */
export const popoverAdapter: OpenStateAdapter = {
  isOpen: (node) => node.matches(':popover-open'),
  open: (node) => node.showPopover(),
  close: (node) => node.hidePopover(),
}

export function usePopoverTrigger() {
  const { id } = usePopoverContext('usePopoverTrigger')
  return { commandfor: id, command: 'toggle-popover' } as const
}
