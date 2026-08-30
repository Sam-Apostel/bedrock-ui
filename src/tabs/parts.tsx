import { useCallback, type ComponentPropsWithRef, type ElementType, type MouseEvent } from 'react'
import { useClientRender } from '../client-render'
import { useComposedRefs } from '../compose-refs'
import { useRoving } from '../roving'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { panelId, tabId, useTabsContext } from './shared'

export interface TabsListProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  loop?: boolean
}

/**
 * The tab list is one tab stop and the arrow keys move within it — the roving
 * pattern the ARIA APG asks for, and the reason Tabs is in the "still
 * substantially JavaScript" group. There is no native tab list.
 */
export function TabsList({ asChild, loop = true, ref, ...props }: TabsListProps) {
  const { orientation } = useTabsContext('Tabs.List')
  const { registerContainer } = useRoving({ orientation, loop, typeahead: false })
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      role="tablist"
      aria-orientation={orientation === 'both' ? undefined : orientation}
      data-orientation={orientation}
      ref={useComposedRefs<HTMLElement>(ref, registerContainer)}
      data-bedrock-tabs-list=""
    />
  )
}

export interface TabsTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {
  value: string
}

export function TabsTrigger({ asChild, value, onClick, ...props }: TabsTriggerProps) {
  const { baseId, value: selected, select } = useTabsContext('Tabs.Trigger')
  const Part: ElementType = asChild ? Slot : 'button'
  const active = selected === value

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) select(value)
    },
    [onClick, select, value],
  )

  return (
    <Part
      {...props}
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={active}
      aria-controls={panelId(baseId, value)}
      // Selection follows focus, which is the APG default for tabs.
      onFocus={() => select(value)}
      onClick={handleClick}
      data-bedrock-roving-item=""
      data-bedrock-tabs-trigger=""
    />
  )
}

export interface TabsContentProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  value: string
}

export function TabsContent({ asChild, value, children, ...props }: TabsContentProps) {
  const { baseId, value: selected } = useTabsContext('Tabs.Content')
  const onClient = useClientRender()
  const Part: ElementType = asChild ? Slot : 'div'
  const active = selected === value

  // Unmounted rather than hidden, on the same rule as every other content part.
  if (onClient && !active) return null

  return (
    <Part
      {...props}
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      hidden={!active}
      tabIndex={0}
      data-bedrock-tabs-content=""
    >
      {children}
    </Part>
  )
}
