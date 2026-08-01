import type { ComponentPropsWithRef, ElementType } from 'react'
import { composeRefs } from '../compose-refs'
import { useControlledRoot, type ControlledRootProps } from '../create-controlled-root'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { CollapsibleContext, collapsibleAdapter } from './shared'

export interface ControlledCollapsibleRootProps
  extends Omit<ComponentPropsWithRef<'details'>, 'open'>, ControlledRootProps, AsChildProps {}

/**
 * `<details>` exposes no cancelable hook — no `beforetoggle`, no `cancel` — so
 * unlike Dialog this root cannot refuse before the fact. It lets the disclosure
 * move, reports it, and puts it back if you decline: one frame of visible
 * movement, in the refusal case only.
 *
 * That is the documented fallback rather than a shortcoming of this primitive,
 * and it is why the veto is worth having on Dialog and Popover, where the
 * platform does give a cancelable event.
 */
export function CollapsibleRoot({
  asChild,
  children,
  open,
  onOpenChange,
  ref,
  ...props
}: ControlledCollapsibleRootProps) {
  const context = useControlledRoot({ open, onOpenChange }, collapsibleAdapter)
  const Part: ElementType = asChild ? Slot : 'details'

  return (
    <CollapsibleContext.Provider value={context}>
      <Part
        {...props}
        ref={composeRefs<HTMLElement>(ref, context.registerContent)}
        data-bedrock-collapsible=""
      >
        {children}
      </Part>
    </CollapsibleContext.Provider>
  )
}
