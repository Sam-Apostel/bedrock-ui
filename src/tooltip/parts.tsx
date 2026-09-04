import { isValidElement, useCallback, type ComponentPropsWithRef, type ElementType } from 'react'
import { placementStyles, type Align, type Side } from '../anchor'
import { useClientRender } from '../client-render'
import { useComposedRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { validateTrigger } from '../validate-trigger'
import { useTooltipContext } from './shared'

export interface TooltipTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

/**
 * Whether tapping this trigger would do anything a press has to be careful of.
 *
 * A handler is not an attribute, so the DOM cannot answer this and the ref
 * callback in `interest.ts` cannot either — it only sees links and submit
 * buttons. Here the props are still props: the trigger's own, and under
 * `asChild` the child's, which `Slot` will chain into the same element.
 *
 * Wrong in one direction only, and deliberately: a component that binds its own
 * handler out of sight reads as inert, and gets the shorter press. The cost is
 * a preview where a tap was meant, on a hold already past a tap's length.
 */
function activatesOnTap(asChild: boolean | undefined, props: TooltipTriggerProps): boolean {
  if (props.onClick) return true
  if (!asChild) return false

  const child = props.children
  return isValidElement<{ onClick?: unknown }>(child) && Boolean(child.props.onClick)
}

/**
 * Buttons *and* anchors, unlike every other trigger in this library: an
 * `interestfor` invoker accepts both, and that is exactly what makes a link
 * preview possible without a wrapper element.
 *
 * The `interestfor` attribute is emitted only when the platform can act on it.
 * Otherwise the same node is handed to the JavaScript fallback, and nothing
 * about the markup a consumer writes changes either way.
 *
 * The callout suppression goes with the fallback rather than with the trigger:
 * a long press is how a touch screen asks to see more, and on iOS the callout
 * menu — the share sheet on a link, the copy bar on text — takes that gesture
 * first. Where the platform runs intent itself it also owns that conflict, so
 * we leave it alone. Selection is only turned off for the length of a press,
 * in `interest.ts`, so a link in a paragraph still comes with the paragraph.
 */
export function TooltipTrigger({ asChild, ref, style, ...props }: TooltipTriggerProps) {
  const { id, anchor, native, registerTrigger } = useTooltipContext('Tooltip.Trigger')
  const Part: ElementType = asChild ? Slot : 'button'

  const activates = activatesOnTap(asChild, props)
  const register = useCallback(
    (node: HTMLElement | null) => registerTrigger(node, activates),
    [registerTrigger, activates],
  )

  return (
    <Part
      {...props}
      {...(native ? { interestfor: id } : {})}
      // Describes rather than labels: the trigger keeps its own name.
      aria-describedby={id}
      style={
        {
          anchorName: anchor,
          ...(native ? null : { WebkitTouchCallout: 'none' }),
          ...style,
        } as typeof style
      }
      ref={useComposedRefs<HTMLElement>(ref, register, (node) =>
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
