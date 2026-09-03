import type { ReactNode } from 'react'
import { TooltipContext } from '../tooltip/shared'
import { useInterestRoot } from '../tooltip/use-interest-root'

export interface HoverCardRootProps {
  children?: ReactNode
  openDelay?: number
  closeDelay?: number
  onOpenChange?(open: boolean): void
}

/**
 * A Tooltip whose content you can put the pointer into, and which is a region
 * rather than a label. Same machinery, three different arguments.
 */
export function HoverCardRoot({
  children,
  openDelay = 700,
  closeDelay = 300,
  onOpenChange,
}: HoverCardRootProps) {
  const context = useInterestRoot({
    showDelay: openDelay,
    hideDelay: closeDelay,
    hoverableContent: true,
    // Somewhere to go, so the lift leaves it up to be read and reached into.
    pressHolds: true,
    kind: 'auto',
    role: undefined,
    onOpenChange,
  })

  return <TooltipContext.Provider value={context}>{children}</TooltipContext.Provider>
}
