import { createContext, useContext } from 'react'

export interface AccordionContextValue {
  /**
   * Shared `name` for the items. A group of `<details>` with the same name is
   * mutually exclusive in the browser — that is the whole of `type="single"`,
   * with no state and no JavaScript.
   */
  name: string | undefined
  orientation: 'horizontal' | 'vertical'
  /** Reported up from an item's `toggle`, for `onValueChange`. */
  report(value: string, open: boolean): void
  /** Which values the root wants open, when it is the controlled root. */
  value: readonly string[] | undefined
  defaultValue: readonly string[]
}

export const AccordionContext = createContext<AccordionContextValue | null>(null)

export function useAccordionContext(part: string): AccordionContextValue {
  const context = useContext(AccordionContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Accordion.Root.`)
  return context
}

export interface AccordionItemContextValue {
  value: string
  open: boolean
}

export const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

export function useAccordionItemContext(part: string): AccordionItemContextValue {
  const context = useContext(AccordionItemContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Accordion.Item.`)
  return context
}
