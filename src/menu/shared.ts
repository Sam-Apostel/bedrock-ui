import { createContext, useContext } from 'react'
import type { RootContextValue } from '../types'

export interface MenuContextValue extends RootContextValue {
  anchor: string
}

export const MenuContext = createContext<MenuContextValue | null>(null)

export function useMenuContext(part: string): MenuContextValue {
  const context = useContext(MenuContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside a menu root.`)
  return context
}
