import type { ComponentPropsWithRef, ElementType } from 'react'
import { useComposedRefs } from '../compose-refs'
import { useControlledRoot, type ControlledRootProps } from '../create-controlled-root'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { CollapsibleContext, collapsibleAdapter } from './shared'

export interface ControlledCollapsibleRootProps
  extends Omit<ComponentPropsWithRef<'details'>, 'open'>, ControlledRootProps, AsChildProps {}

/**
 * `<details>` exposes no cancelable hook — no `beforetoggle`, no `cancel`, only
 * a `toggle` once the disclosure has already moved — so unlike Dialog this root
 * cannot refuse. Control here runs one way: change `open` and the DOM follows.
 * Declining a toggle is heard and nothing more, and the disclosure is left
 * where the user put it. It is a documented gap, not a bug in this file; the
 * reasoning is in `create-controlled-root.ts` and docs/known-gaps.md.
 *
 * A consumer who genuinely needs a veto has one, and it isn't this root:
 * `preventDefault()` on the Trigger's click stops the toggle before it happens,
 * for pointer and keyboard alike, because a `<summary>` toggles its parent as
 * that click's default action.
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
        ref={useComposedRefs<HTMLElement>(ref, context.registerContent)}
        data-bedrock-collapsible=""
      >
        {children}
      </Part>
    </CollapsibleContext.Provider>
  )
}
