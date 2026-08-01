import { useCallback, useId, useMemo, useRef } from 'react'
import { anchorName } from '../anchor'
import { useSupportsInterestInvokers } from '../capabilities'
import { useInterest } from '../interest'
import { useOpenState } from '../open-state'
import type { TooltipContextValue } from './shared'

export interface InterestRootOptions {
  showDelay: number
  hideDelay: number
  hoverableContent: boolean
  kind: 'hint' | 'auto'
  role: 'tooltip' | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
}

/**
 * Everything Tooltip and HoverCard share, which is almost all of it: the two
 * differ in their delays, in whether the content is hoverable, and in whether
 * the thing is a label or a region. Not enough to justify two implementations.
 */
export function useInterestRoot(options: InterestRootOptions): TooltipContextValue {
  const id = useId()
  const anchor = useMemo(() => anchorName(id), [id])
  const native = useSupportsInterestInvokers()

  const changeRef = useRef(options.onOpenChange)
  changeRef.current = options.onOpenChange

  const report = useCallback((next: boolean) => changeRef.current?.(next), [])
  const { open, observe } = useOpenState(report)

  const { registerTrigger, registerInterestContent } = useInterest({
    showDelay: options.showDelay,
    hideDelay: options.hideDelay,
    hoverableContent: options.hoverableContent,
  })

  const registerContent = useCallback(
    (node: HTMLElement | null) => {
      observe(node)
      registerInterestContent(node)
    },
    [observe, registerInterestContent],
  )

  return useMemo(
    () => ({
      id,
      open,
      anchor,
      native,
      kind: options.kind,
      role: options.role,
      registerContent,
      registerTrigger,
    }),
    [id, open, anchor, native, options.kind, options.role, registerContent, registerTrigger],
  )
}
