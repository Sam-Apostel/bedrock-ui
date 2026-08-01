import { createContext, useContext } from 'react'
import type { OpenStateAdapter, RootContextValue } from '../types'

export type PopoverKind = 'auto' | 'manual' | 'hint'

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
