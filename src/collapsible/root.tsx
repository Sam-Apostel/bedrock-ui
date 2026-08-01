import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import { composeRefs } from '../compose-refs'
import { useOpenState } from '../open-state'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { CollapsibleContext } from './shared'

export interface CollapsibleRootProps extends ComponentPropsWithRef<'details'>, AsChildProps {
  defaultOpen?: boolean
  /** Reports; cannot refuse. Import from `/controlled` for a veto. */
  onOpenChange?(open: boolean): void
}

/**
 * Unlike Dialog, the root *is* the element: `<summary>` only works as a child
 * of `<details>`, so there is nothing to wire by id and no invoker involved.
 *
 * Which means `defaultOpen` is a plain attribute rather than an imperative call
 * on mount — the disclosure is open in the HTML before any script runs.
 */
export function CollapsibleRoot({
  asChild,
  children,
  defaultOpen = false,
  onOpenChange,
  ref,
  ...props
}: CollapsibleRootProps) {
  const id = useId()
  const Part: ElementType = asChild ? Slot : 'details'

  const changeRef = useRef(onOpenChange)
  changeRef.current = onOpenChange

  const report = useCallback((next: boolean) => changeRef.current?.(next), [])
  const { open, observe } = useOpenState(report, defaultOpen)
  const defaultOpenRef = useRef(defaultOpen)

  const context = useMemo(() => ({ id, open, registerContent: observe }), [id, open, observe])

  return (
    <CollapsibleContext.Provider value={context}>
      <Part
        {...props}
        // Read once. React only writes a DOM property when the value it renders
        // changes, so the user's own toggling is never undone by a re-render.
        open={defaultOpenRef.current}
        ref={composeRefs<HTMLElement>(ref, observe)}
        data-bedrock-collapsible=""
      >
        {children}
      </Part>
    </CollapsibleContext.Provider>
  )
}
