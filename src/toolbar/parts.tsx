import type { ComponentPropsWithRef, ElementType } from 'react'
import { useComposedRefs } from '../compose-refs'
import { useRoving, type Orientation } from '../roving'
import { SeparatorRoot, type SeparatorProps } from '../separator/parts'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface ToolbarRootProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  orientation?: Orientation
  loop?: boolean
}

/**
 * `role="toolbar"`, one tab stop, arrows between the controls. Mixed content —
 * buttons, links, toggle groups — all of which register as roving items, so the
 * order follows the DOM rather than a registry.
 */
export function ToolbarRoot({
  asChild,
  orientation = 'horizontal',
  loop = true,
  ref,
  ...props
}: ToolbarRootProps) {
  const { registerContainer } = useRoving({ orientation, loop, typeahead: false })
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      role="toolbar"
      aria-orientation={orientation === 'both' ? undefined : orientation}
      data-orientation={orientation}
      ref={useComposedRefs<HTMLElement>(ref, registerContainer)}
      data-bedrock-toolbar=""
    />
  )
}

export interface ToolbarButtonProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function ToolbarButton({ asChild, ...props }: ToolbarButtonProps) {
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part {...props} type="button" data-bedrock-roving-item="" data-bedrock-toolbar-button="" />
  )
}

export interface ToolbarLinkProps extends ComponentPropsWithRef<'a'>, AsChildProps {}

export function ToolbarLink({ asChild, ...props }: ToolbarLinkProps) {
  const Part: ElementType = asChild ? Slot : 'a'

  return <Part {...props} data-bedrock-roving-item="" data-bedrock-toolbar-link="" />
}

export function ToolbarSeparator(props: SeparatorProps) {
  return <SeparatorRoot decorative {...props} />
}
