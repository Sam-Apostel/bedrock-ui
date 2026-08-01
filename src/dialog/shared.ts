import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { OpenStateAdapter, RootContextValue } from '../types'

/**
 * Whether a `Title` and a `Description` are actually rendered.
 *
 * `aria-labelledby` pointing at an element that does not exist is a broken
 * reference, not a harmless one — the dialog ends up with no accessible name
 * and nothing says so. Deriving the id from the root's id is not enough; the
 * parts have to say they are there.
 */
export interface DialogLabelling {
  labelledBy: string | undefined
  describedBy: string | undefined
  registerTitle(): () => void
  registerDescription(): () => void
}

export type DialogContextValue = RootContextValue & DialogLabelling

export const DialogContext = createContext<DialogContextValue | null>(null)

export function useDialogContext(part: string): DialogContextValue {
  const context = useContext(DialogContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Dialog.Root.`)
  return context
}

/** Counted rather than boolean: two Titles is a bug, but it is the consumer's. */
function useCount() {
  const [count, setCount] = useState(0)

  const register = useCallback(() => {
    setCount((n) => n + 1)
    return () => setCount((n) => n - 1)
  }, [])

  return [count > 0, register] as const
}

export function useDialogLabelling(id: string): DialogLabelling {
  const [hasTitle, registerTitle] = useCount()
  const [hasDescription, registerDescription] = useCount()

  return useMemo(
    () => ({
      labelledBy: hasTitle ? `${id}-title` : undefined,
      describedBy: hasDescription ? `${id}-description` : undefined,
      registerTitle,
      registerDescription,
    }),
    [id, hasTitle, hasDescription, registerTitle, registerDescription],
  )
}

export const dialogAdapter: OpenStateAdapter = {
  isOpen: (node) => (node as HTMLDialogElement).open,
  open: (node) => (node as HTMLDialogElement).showModal(),
  // close(), not requestClose(), and only here. This runs when React has
  // already decided — the user's close was offered to `cancel` and either
  // refused or accepted, so asking a second time is both wrong and impossible:
  // a close watcher ignores requestClose() re-entered from its own cancel
  // action, and drops the call without an error. Dialog.Close still uses
  // command="request-close", which is what keeps the veto vetoable.
  close: (node) => (node as HTMLDialogElement).close(),
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
