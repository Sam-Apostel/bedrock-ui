import type { ReactNode } from 'react'
import type { ControlledRootProps } from '../create-controlled-root'
import { TooltipContext } from '../tooltip/shared'
import { useControlledInterestRoot } from '../tooltip/use-controlled-interest-root'

export interface ControlledHoverCardRootProps extends ControlledRootProps {
  children?: ReactNode
  openDelay?: number
  closeDelay?: number
}

export function HoverCardRoot({
  children,
  openDelay = 700,
  closeDelay = 300,
  ...props
}: ControlledHoverCardRootProps) {
  const context = useControlledInterestRoot({
    ...props,
    showDelay: openDelay,
    hideDelay: closeDelay,
    hoverableContent: true,
    // Somewhere to go, so the lift leaves it up to be read and reached into.
    pressHolds: true,
    kind: 'auto',
    role: undefined,
  })

  return <TooltipContext.Provider value={context}>{children}</TooltipContext.Provider>
}
