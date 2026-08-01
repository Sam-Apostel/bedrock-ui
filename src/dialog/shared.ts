import { createContext, useContext } from 'react'
import type { OpenStateAdapter, RootContextValue } from '../types'

export const DialogContext = createContext<RootContextValue | null>(null)

export function useDialogContext(part: string): RootContextValue {
  const context = useContext(DialogContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Dialog.Root.`)
  return context
}

export const dialogAdapter: OpenStateAdapter = {
  isOpen: (node) => (node as HTMLDialogElement).open,
  open: (node) => (node as HTMLDialogElement).showModal(),
  // requestClose rather than close, so `cancel` fires and stays vetoable.
  close: (node) => (node as HTMLDialogElement).requestClose(),
  closeVetoEvent: 'cancel',
}

/**
 * Escape hatch for consumers who must attach a trigger to something that
 * isn't a button — a third-party component they can't change, typically.
 *
 * Named, deliberate, and documented as your problem: the props are handed over
 * without any of the accessibility guarantees that Dialog.Trigger enforces.
 */
export function useDialogTrigger() {
  const { id } = useDialogContext('useDialogTrigger')
  // Lowercase: react-dom 19.2 doesn't recognise a camelCased `commandFor` and
  // warns the consumer about a prop they never wrote.
  return { commandfor: id, command: 'show-modal' } as const
}
