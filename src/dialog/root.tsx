import { useCallback, useId, useMemo, useRef, type ReactNode } from 'react'
import { DialogContext, dialogAdapter } from './shared'

export interface DialogRootProps {
  children?: ReactNode
  /** Open on mount. Read once; later changes do nothing. */
  defaultOpen?: boolean
  /**
   * Fires after the DOM has already moved. Read-only by design — it is a
   * `toggle` listener, not a state hook. If React needs to refuse an open or a
   * close, import Dialog from '@apostel/bedrock/controlled' instead.
   */
  onOpenChange?(open: boolean): void
}

/**
 * The default root. Nothing here opens or closes the dialog: the trigger's
 * `commandfor` does that in the parser, before hydration and without us.
 *
 * What's left is a `toggle` listener, which is what "I need to know when it
 * closed so I can reset the form" actually needs, and which is why that case
 * doesn't have to reach for the controlled entry point.
 */
export function DialogRoot({ children, defaultOpen = false, onOpenChange }: DialogRootProps) {
  const id = useId()

  // Read through refs inside the listener so a changing callback never forces
  // us to detach and reattach.
  const changeRef = useRef(onOpenChange)
  changeRef.current = onOpenChange

  const defaultOpenRef = useRef(defaultOpen)
  const openedRef = useRef(false)
  const nodeRef = useRef<HTMLElement | null>(null)

  const handleToggle = useCallback((event: Event) => {
    changeRef.current?.((event as ToggleEvent).newState === 'open')
  }, [])

  const registerContent = useCallback(
    (node: HTMLElement | null) => {
      if (nodeRef.current) nodeRef.current.removeEventListener('toggle', handleToggle)
      nodeRef.current = node
      if (!node) return

      node.addEventListener('toggle', handleToggle)

      // The `open` attribute renders a <dialog> inline — no top layer, no
      // backdrop, no focus trap — so it is not the declarative form of
      // showModal() and can't stand in for it here. Once, on first mount.
      if (defaultOpenRef.current && !openedRef.current) {
        openedRef.current = true
        dialogAdapter.open(node)
      }
    },
    [handleToggle],
  )

  const context = useMemo(() => ({ id, registerContent }), [id, registerContent])

  return <DialogContext.Provider value={context}>{children}</DialogContext.Provider>
}
