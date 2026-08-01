import type { ReactNode } from 'react'
import { TooltipContext } from './shared'
import { useInterestRoot } from './use-interest-root'

export interface TooltipRootProps {
  children?: ReactNode
  /**
   * How long the pointer must rest before it opens. Named for what it does,
   * not for the CSS property or the timer that currently implements it.
   */
  delayDuration?: number
  closeDelay?: number
  onOpenChange?(open: boolean): void
}

export function TooltipRoot({
  children,
  delayDuration = 700,
  closeDelay = 150,
  onOpenChange,
}: TooltipRootProps) {
  const context = useInterestRoot({
    showDelay: delayDuration,
    hideDelay: closeDelay,
    // A tooltip is a label, not somewhere to move the pointer.
    hoverableContent: false,
    // `hint` layers above an open menu rather than closing it.
    kind: 'hint',
    role: 'tooltip',
    onOpenChange,
  })

  return <TooltipContext.Provider value={context}>{children}</TooltipContext.Provider>
}
