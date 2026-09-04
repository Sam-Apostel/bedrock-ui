import { createContext, useContext } from 'react'
import type { RootContextValue } from '../types'

export interface TooltipContextValue extends RootContextValue {
  anchor: string
  /** Set when the platform can do intent itself; drives the attribute path. */
  native: boolean
  /** `activates` is what only React can see: a handler on the trigger. */
  registerTrigger(node: HTMLElement | null, activates?: boolean): void
  /** Tooltips are labels; hover cards are regions with content. */
  role: 'tooltip' | undefined
  kind: 'hint' | 'auto'
}

export const TooltipContext = createContext<TooltipContextValue | null>(null)

export function useTooltipContext(part: string): TooltipContextValue {
  const context = useContext(TooltipContext)
  if (!context)
    throw new Error(`[bedrock] ${part} must be used inside a Tooltip or HoverCard root.`)
  return context
}
