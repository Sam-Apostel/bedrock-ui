import { createContext, useContext } from 'react'
import type { Orientation } from '../roving'

export interface TabsContextValue {
  baseId: string
  value: string | undefined
  select(value: string): void
  orientation: Orientation
}

export const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Tabs.Root.`)
  return context
}

export const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`
export const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`
