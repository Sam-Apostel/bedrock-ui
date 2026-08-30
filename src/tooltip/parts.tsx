import type { ComponentPropsWithRef, ElementType } from 'react'
import { placementStyles, type Align, type Side } from '../anchor'
import { useClientRender } from '../client-render'
import { useComposedRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { validateTrigger } from '../validate-trigger'
import { useTooltipContext } from './shared'

export interface TooltipTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

/**
 * Buttons *and* anchors, unlike every other trigger in this library: an
 * `interestfor` invoker accepts both, and that is exactly what makes a link
 * preview possible without a wrapper element.
 *
 * The `interestfor` attribute is emitted only when the platform can act on it.
 * Otherwise the same node is handed to the JavaScript fallback, and nothing
 * about the markup a consumer writes changes either way.
 */
export function TooltipTrigger({ asChild, ref, style, ...props }: TooltipTriggerProps) {
  const { id, anchor, native, registerTrigger } = useTooltipContext('Tooltip.Trigger')
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      {...(native ? { interestfor: id } : {})}
      // Describes rather than labels: the trigger keeps its own name.
      aria-describedby={id}
      style={{ anchorName: anchor, ...style } as typeof style}
      ref={useComposedRefs<HTMLElement>(ref, registerTrigger, (node) =>
        validateTrigger(node, 'interest', 'Tooltip.Trigger'),
      )}
      data-bedrock-tooltip-trigger=""
    />
  )
}

export interface TooltipContentProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  side?: Side
  align?: Align
  sideOffset?: number
  avoidCollisions?: boolean
}

export function TooltipContent({
  asChild,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  avoidCollisions = true,
  style,
  ref,
  ...props
}: TooltipContentProps) {
  const { id, open, anchor, kind, role, registerContent } = useTooltipContext('Tooltip.Content')
  const onClient = useClientRender()
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      id={id}
      popover={kind}
      role={role}
      style={{ ...placementStyles(anchor, { side, align, sideOffset, avoidCollisions }), ...style }}
      data-side={side}
      data-align={align}
      ref={useComposedRefs<HTMLElement>(ref, registerContent)}
      data-bedrock-tooltip=""
    >
      {open || !onClient ? children : null}
    </Part>
  )
}
