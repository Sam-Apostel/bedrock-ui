import type { ReactNode } from 'react'
import type { ControlledRootProps } from '../create-controlled-root'
import { TooltipContext } from './shared'
import { useControlledInterestRoot } from './use-controlled-interest-root'

export interface ControlledTooltipRootProps extends ControlledRootProps {
  children?: ReactNode
  delayDuration?: number
  closeDelay?: number
}

export function TooltipRoot({
  children,
  delayDuration = 700,
  closeDelay = 150,
  ...props
}: ControlledTooltipRootProps) {
  const context = useControlledInterestRoot({
    ...props,
    showDelay: delayDuration,
    hideDelay: closeDelay,
    hoverableContent: false,
    kind: 'hint',
    role: 'tooltip',
  })

  return <TooltipContext.Provider value={context}>{children}</TooltipContext.Provider>
}
