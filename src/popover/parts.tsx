import type { ComponentPropsWithRef, ElementType } from 'react'
import { anchorName, placementStyles, type Align, type Side } from '../anchor'
import { useClientRender } from '../client-render'
import { useComposedRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { validateTrigger } from '../validate-trigger'
import { usePopoverContext } from './shared'

export interface PopoverTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

/**
 * `command="toggle-popover"` rather than `popovertarget`, because an invoker
 * command gives the button implicit `aria-expanded` — measured in Chrome 141,
 * and the one place where the platform hands us the expanded state for free.
 */
export function PopoverTrigger({ asChild, ref, style, ...props }: PopoverTriggerProps) {
  const { id, anchor } = usePopoverContext('Popover.Trigger')
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      type="button"
      commandfor={id}
      command="toggle-popover"
      // The anchor name has to live on the element the content points at, and
      // it is per instance, so it cannot come from a stylesheet.
      style={{ anchorName: anchor, ...style } as typeof style}
      ref={useComposedRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Popover.Trigger'),
      )}
      data-bedrock-popover-trigger=""
    />
  )
}

export interface PopoverAnchorProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

/** Anchors the content to something other than the trigger. */
export function PopoverAnchor({ asChild, style, ...props }: PopoverAnchorProps) {
  const { anchor } = usePopoverContext('Popover.Anchor')
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      style={{ anchorName: anchor, ...style } as typeof style}
      data-bedrock-popover-anchor=""
    />
  )
}

export interface PopoverContentProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  side?: Side
  align?: Align
  sideOffset?: number
  avoidCollisions?: boolean
}

export function PopoverContent({
  asChild,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  avoidCollisions = true,
  style,
  ref,
  ...props
}: PopoverContentProps) {
  const { id, open, kind, anchor, registerContent } = usePopoverContext('Popover.Content')
  const onClient = useClientRender()
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      id={id}
      popover={kind}
      style={{ ...placementStyles(anchor, { side, align, sideOffset, avoidCollisions }), ...style }}
      data-side={side}
      data-align={align}
      ref={useComposedRefs<HTMLElement>(ref, registerContent)}
      data-bedrock-popover=""
    >
      {open || !onClient ? children : null}
    </Part>
  )
}

export interface PopoverCloseProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function PopoverClose({ asChild, ref, ...props }: PopoverCloseProps) {
  const { id } = usePopoverContext('Popover.Close')
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      type="button"
      commandfor={id}
      command="hide-popover"
      ref={useComposedRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Popover.Close'),
      )}
      data-bedrock-popover-close=""
    />
  )
}

export { anchorName }
