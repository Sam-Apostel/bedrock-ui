import { useCallback, useId, useMemo, useRef, type ReactNode } from 'react'
import { anchorName } from '../anchor'
import { useOpenState } from '../open-state'
import { usePopoverKind, PopoverContext, type PopoverKind } from './shared'

export interface PopoverRootProps {
  children?: ReactNode
  /**
   * `auto` light-dismisses and closes other auto popovers; `manual` does
   * neither; `hint` layers above an open menu without closing it.
   *
   * Named for behaviour rather than for the attribute — the values happen to
   * match today, and the prop survives if the platform's do not.
   */
  kind?: PopoverKind
  onOpenChange?(open: boolean): void
}

/**
 * Renders nothing. The trigger is bound to the content by `commandfor`, so
 * opening is the parser's job and there is no state here in the common case.
 *
 * There is no `defaultOpen`: a popover cannot be shown until its element is
 * connected, and an imperative `showPopover()` on mount is the sort of thing
 * this library exists to avoid. Use `open` from `/controlled` if you need it.
 */
export function PopoverRoot({ children, kind: asked = 'auto', onOpenChange }: PopoverRootProps) {
  const id = useId()
  const anchor = useMemo(() => anchorName(id), [id])
  const kind = usePopoverKind(asked)

  const changeRef = useRef(onOpenChange)
  changeRef.current = onOpenChange

  const report = useCallback((next: boolean) => changeRef.current?.(next), [])
  const { open, observe } = useOpenState(report)

  const context = useMemo(
    () => ({ id, open, anchor, kind, registerContent: observe }),
    [id, open, anchor, kind, observe],
  )

  return <PopoverContext.Provider value={context}>{children}</PopoverContext.Provider>
}
