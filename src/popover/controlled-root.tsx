import { useMemo, type ReactNode } from 'react'
import { anchorName } from '../anchor'
import { useControlledRoot, type ControlledRootProps } from '../create-controlled-root'
import { usePopoverKind, PopoverContext, popoverAdapter, type PopoverKind } from './shared'

export interface ControlledPopoverRootProps extends ControlledRootProps {
  children?: ReactNode
  kind?: PopoverKind
}

/**
 * The best case for the veto model. A popover's `beforetoggle` is cancelable in
 * both directions, so refusing an open or a close moves nothing at all — no
 * revert, no frame of visible movement, no `flushSync`.
 */
export function PopoverRoot({
  children,
  kind: asked = 'auto',
  ...props
}: ControlledPopoverRootProps) {
  const context = useControlledRoot(props, popoverAdapter)
  const anchor = useMemo(() => anchorName(context.id), [context.id])
  const kind = usePopoverKind(asked)

  const value = useMemo(() => ({ ...context, anchor, kind }), [context, anchor, kind])

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
}
