import { useId, useMemo, type ComponentPropsWithRef, type ElementType, type ReactNode } from 'react'
import { anchorName } from '../anchor'
import { composeRefs } from '../compose-refs'
import { MenuContext } from '../menu/shared'
import { useOpenState } from '../open-state'
import { useRoving } from '../roving'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface NavigationMenuRootProps extends ComponentPropsWithRef<'nav'>, AsChildProps {}

export function NavigationMenuRoot({ asChild, ...props }: NavigationMenuRootProps) {
  const Part: ElementType = asChild ? Slot : 'nav'

  return <Part {...props} data-bedrock-navigation-menu="" />
}

export interface NavigationMenuListProps extends ComponentPropsWithRef<'ul'>, AsChildProps {
  loop?: boolean
}

export function NavigationMenuList({
  asChild,
  loop = false,
  ref,
  ...props
}: NavigationMenuListProps) {
  const { registerContainer } = useRoving({ orientation: 'horizontal', loop, typeahead: false })
  const Part: ElementType = asChild ? Slot : 'ul'

  return (
    <Part
      {...props}
      ref={composeRefs<HTMLElement>(ref, registerContainer)}
      data-bedrock-navigation-menu-list=""
    />
  )
}

export interface NavigationMenuItemProps extends ComponentPropsWithRef<'li'>, AsChildProps {
  children?: ReactNode
}

/** Each item owns a popover, anchored to itself. */
export function NavigationMenuItem({
  asChild,
  children,
  ref,
  style,
  ...props
}: NavigationMenuItemProps) {
  const id = useId()
  const anchor = useMemo(() => anchorName(id), [id])
  const { open, observe } = useOpenState()
  const Part: ElementType = asChild ? Slot : 'li'

  const context = useMemo(
    () => ({ id, open, anchor, registerContent: observe }),
    [id, open, anchor, observe],
  )

  return (
    <MenuContext.Provider value={context}>
      <Part
        {...props}
        style={{ anchorName: anchor, ...style } as typeof style}
        ref={composeRefs<HTMLElement>(ref)}
        data-bedrock-navigation-menu-item=""
      >
        {children}
      </Part>
    </MenuContext.Provider>
  )
}

export interface NavigationMenuLinkProps extends ComponentPropsWithRef<'a'>, AsChildProps {
  active?: boolean
}

export function NavigationMenuLink({ asChild, active, ...props }: NavigationMenuLinkProps) {
  const Part: ElementType = asChild ? Slot : 'a'

  return (
    <Part
      {...props}
      aria-current={active ? 'page' : undefined}
      data-bedrock-roving-item=""
      data-bedrock-navigation-menu-link=""
    />
  )
}

let warned = false

export interface NavigationMenuViewportProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

/**
 * Renders nothing. Radix's viewport exists to give every menu one shared,
 * animatable box outside the list; anchor positioning and the top layer make
 * that unnecessary, since each content is already positioned against its own
 * item and painted above everything.
 */
export function NavigationMenuViewport({ className }: NavigationMenuViewportProps) {
  if (process.env.NODE_ENV !== 'production' && className && !warned) {
    warned = true
    console.warn(
      '[bedrock] NavigationMenu.Viewport renders nothing — each content is anchored to its ' +
        'own item and already in the top layer. Style NavigationMenu.Content instead.',
    )
  }

  return null
}
