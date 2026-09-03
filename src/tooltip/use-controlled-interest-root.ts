import { useCallback, useMemo } from 'react'
import { anchorName } from '../anchor'
import { useSupportsInterestInvokers } from '../capabilities'
import { useControlledRoot, type ControlledRootProps } from '../create-controlled-root'
import { useInterest } from '../interest'
import { popoverAdapter, usePopoverKind } from '../popover/shared'
import type { TooltipContextValue } from './shared'

export interface ControlledInterestOptions extends ControlledRootProps {
  showDelay: number
  hideDelay: number
  hoverableContent: boolean
  /** Whether a press that opened it survives the finger coming back up. */
  pressHolds: boolean
  kind: 'hint' | 'auto'
  role: 'tooltip' | undefined
}

/**
 * Controlled Tooltip and HoverCard. Only ever imported from `/controlled`, so
 * the reconciliation layer stays out of the default bundle — the graph lint
 * checks that rather than trusting it.
 *
 * The intent layer is unchanged: hover still decides *when* to ask, and `open`
 * still decides whether it happens.
 */
export function useControlledInterestRoot(options: ControlledInterestOptions): TooltipContextValue {
  const { open, onOpenChange, showDelay, hideDelay, hoverableContent, pressHolds, role } = options
  const context = useControlledRoot({ open, onOpenChange }, popoverAdapter)
  const anchor = useMemo(() => anchorName(context.id), [context.id])
  const native = useSupportsInterestInvokers()
  const kind = usePopoverKind(options.kind)

  const { registerTrigger, registerInterestContent } = useInterest({
    showDelay,
    hideDelay,
    hoverableContent,
    pressHolds,
  })

  const registerContent = useCallback(
    (node: HTMLElement | null) => {
      context.registerContent(node)
      registerInterestContent(node)
    },
    [context, registerInterestContent],
  )

  return useMemo(
    () => ({ ...context, anchor, native, kind, role, registerContent, registerTrigger }),
    [context, anchor, native, kind, role, registerContent, registerTrigger],
  )
}
