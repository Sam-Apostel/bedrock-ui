import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactNode,
} from 'react'
import { anchorName } from '../anchor'
import { composeRefs } from '../compose-refs'
import { MenuContext } from '../menu/shared'
import { MenuTrigger, type MenuTriggerProps } from '../menu/parts'
import { useOpenState } from '../open-state'
import { useRoving } from '../roving'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface MenubarRootProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  loop?: boolean
}

/**
 * A row of menu triggers sharing one tab stop. Each menu is an ordinary
 * popover, so opening one closes the last — the popover stack does that, not a
 * "which menu is open" reducer.
 */
export function MenubarRoot({ asChild, loop = true, ref, ...props }: MenubarRootProps) {
  const { registerContainer } = useRoving({ orientation: 'horizontal', loop, typeahead: true })
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part
      {...props}
      role="menubar"
      ref={composeRefs<HTMLElement>(ref, registerContainer)}
      data-bedrock-menubar=""
    />
  )
}

export interface MenubarMenuProps {
  children?: ReactNode
  onOpenChange?(open: boolean): void
}

export function MenubarMenu({ children, onOpenChange }: MenubarMenuProps) {
  const id = useId()
  const anchor = useMemo(() => anchorName(id), [id])

  const changeRef = useRef(onOpenChange)
  changeRef.current = onOpenChange

  const report = useCallback((next: boolean) => changeRef.current?.(next), [])
  const { open, observe } = useOpenState(report)

  const context = useMemo(
    () => ({ id, open, anchor, registerContent: observe }),
    [id, open, anchor, observe],
  )

  return <MenuContext.Provider value={context}>{children}</MenuContext.Provider>
}

/** A menu trigger that is also a roving item in the bar above it. */
export function MenubarTrigger(props: MenuTriggerProps) {
  return <MenuTrigger {...props} data-bedrock-roving-item="" />
}
