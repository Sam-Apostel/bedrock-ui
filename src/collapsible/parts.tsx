import type { ComponentPropsWithRef, ElementType } from 'react'
import { useClientRender } from '../client-render'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { useCollapsibleContext } from './shared'

export interface CollapsibleTriggerProps extends ComponentPropsWithRef<'summary'>, AsChildProps {}

/**
 * A `<summary>`. Not a button with `aria-expanded` and a click handler — the
 * parser binds it to its `<details>` parent, so it opens before hydration and
 * keeps working without JavaScript.
 */
export function CollapsibleTrigger({ asChild, ...props }: CollapsibleTriggerProps) {
  useCollapsibleContext('Collapsible.Trigger')
  const Part: ElementType = asChild ? Slot : 'summary'

  return <Part {...props} data-bedrock-collapsible-trigger="" />
}

export interface CollapsibleContentProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

export function CollapsibleContent({ asChild, children, ...props }: CollapsibleContentProps) {
  const { open } = useCollapsibleContext('Collapsible.Content')
  const onClient = useClientRender()
  const Part: ElementType = asChild ? Slot : 'div'

  // Same rule as Dialog: present in server-rendered markup, mounted on the
  // client only while open, so closing discards whatever it was holding.
  const mounted = open || !onClient

  return (
    <Part {...props} data-bedrock-collapsible-content="">
      {mounted ? children : null}
    </Part>
  )
}
