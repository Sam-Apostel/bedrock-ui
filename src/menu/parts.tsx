import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { anchorName, placementStyles, type Align, type Side } from '../anchor'
import { useClientRender } from '../client-render'
import { useComposedRefs } from '../compose-refs'
import { useRoving } from '../roving'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { validateTrigger } from '../validate-trigger'
import { MenuContext, useMenuContext } from './shared'

export interface MenuTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function MenuTrigger({ asChild, ref, style, ...props }: MenuTriggerProps) {
  const { id, anchor } = useMenuContext('Menu.Trigger')
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      type="button"
      commandfor={id}
      command="toggle-popover"
      aria-haspopup="menu"
      style={{ anchorName: anchor, ...style } as typeof style}
      ref={useComposedRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Menu.Trigger'),
      )}
      data-bedrock-menu-trigger=""
    />
  )
}

export interface MenuContentProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  side?: Side
  align?: Align
  sideOffset?: number
  avoidCollisions?: boolean
  loop?: boolean
}

/**
 * The menu itself: a popover for the layering and the dismissal, and the roving
 * module for everything the platform does not do — arrow keys, Home and End,
 * and typeahead.
 *
 * Focus is moved to the first item when it opens, which a popover does not do
 * on its own. That is the one imperative line, and it is what the APG requires.
 */
export function MenuContent({
  asChild,
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  avoidCollisions = true,
  loop = true,
  style,
  ref,
  ...props
}: MenuContentProps) {
  const { id, open, anchor, registerContent } = useMenuContext('Menu.Content')
  const { registerContainer } = useRoving({ orientation: 'vertical', loop, typeahead: true })
  const onClient = useClientRender()
  const nodeRef = useRef<HTMLElement | null>(null)
  const Part: ElementType = asChild ? Slot : 'div'

  useEffect(() => {
    if (!open) return

    // The popover opens synchronously on the invoker's click; this effect runs
    // a frame or two later. Anything the user did in between — a key that
    // already moved focus into the menu — wins, because re-focusing the first
    // item here would silently undo it.
    const menu = nodeRef.current
    if (!menu || menu.contains(document.activeElement)) return

    menu.querySelector<HTMLElement>('[data-bedrock-roving-item]')?.focus()
  }, [open])

  return (
    <Part
      {...props}
      id={id}
      popover="auto"
      role="menu"
      style={{ ...placementStyles(anchor, { side, align, sideOffset, avoidCollisions }), ...style }}
      data-side={side}
      data-align={align}
      ref={useComposedRefs<HTMLElement>(ref, registerContent, registerContainer, (node) => {
        nodeRef.current = node
      })}
      data-bedrock-menu=""
    >
      {open || !onClient ? children : null}
    </Part>
  )
}

export interface MenuItemProps extends ComponentPropsWithRef<'button'>, AsChildProps {
  /** Close the menu when this is chosen. Off for checkbox and radio items. */
  closeOnSelect?: boolean
}

export function MenuItem({ asChild, closeOnSelect = true, onClick, ...props }: MenuItemProps) {
  const Part: ElementType = asChild ? Slot : 'button'

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented || !closeOnSelect) return
      event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover()
    },
    [closeOnSelect, onClick],
  )

  return (
    <Part
      {...props}
      type="button"
      role="menuitem"
      onClick={handleClick}
      data-bedrock-roving-item=""
      data-bedrock-menu-item=""
    />
  )
}

export interface MenuCheckboxItemProps extends Omit<MenuItemProps, 'closeOnSelect'> {
  checked?: boolean
  onCheckedChange?(checked: boolean): void
}

export function MenuCheckboxItem({
  asChild,
  checked = false,
  onCheckedChange,
  onClick,
  ...props
}: MenuCheckboxItemProps) {
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) onCheckedChange?.(!checked)
      }}
      data-bedrock-roving-item=""
      data-bedrock-menu-item=""
    />
  )
}

interface MenuRadioContextValue {
  value: string | undefined
  select(value: string): void
}

const MenuRadioContext = createContext<MenuRadioContextValue | null>(null)

export interface MenuRadioGroupProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  value?: string
  onValueChange?(value: string): void
}

export function MenuRadioGroup({
  asChild,
  value,
  onValueChange,
  children,
  ...props
}: MenuRadioGroupProps) {
  const Part: ElementType = asChild ? Slot : 'div'
  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  const select = useCallback((next: string) => changeRef.current?.(next), [])
  const context = useMemo(() => ({ value, select }), [value, select])

  return (
    <MenuRadioContext.Provider value={context}>
      <Part {...props} role="group" data-bedrock-menu-radio-group="">
        {children}
      </Part>
    </MenuRadioContext.Provider>
  )
}

export interface MenuRadioItemProps extends ComponentPropsWithRef<'button'>, AsChildProps {
  value: string
}

export function MenuRadioItem({ asChild, value, onClick, ...props }: MenuRadioItemProps) {
  const context = useContext(MenuRadioContext)
  if (!context) throw new Error('[bedrock] Menu.RadioItem must be used inside Menu.RadioGroup.')

  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      type="button"
      role="menuitemradio"
      aria-checked={context.value === value}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.select(value)
      }}
      data-bedrock-roving-item=""
      data-bedrock-menu-item=""
    />
  )
}

export interface MenuLabelProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

export function MenuLabel({ asChild, ...props }: MenuLabelProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return <Part {...props} data-bedrock-menu-label="" />
}

export interface MenuGroupProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

export function MenuGroup({ asChild, ...props }: MenuGroupProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return <Part {...props} role="group" data-bedrock-menu-group="" />
}

export interface MenuSeparatorProps extends ComponentPropsWithRef<'hr'>, AsChildProps {}

export function MenuSeparator({ asChild, ...props }: MenuSeparatorProps) {
  const Part: ElementType = asChild ? Slot : 'hr'

  return <Part {...props} role="separator" data-bedrock-menu-separator="" />
}

export interface MenuSubProps {
  children?: React.ReactNode
}

/**
 * A nested popover. Because the invoker lives inside the parent popover, the
 * browser keeps that parent open — nesting is the popover stack's own rule, so
 * there is no "which layer is topmost" bookkeeping here.
 */
export function MenuSub({ children }: MenuSubProps) {
  const id = useId()
  const anchor = useMemo(() => anchorName(id), [id])
  const [open, setOpen] = useState(false)

  const registerContent = useCallback((node: HTMLElement | null) => {
    if (!node) return
    node.addEventListener('toggle', (event) => {
      setOpen((event as ToggleEvent).newState === 'open')
    })
  }, [])

  const context = useMemo(
    () => ({ id, open, anchor, registerContent }),
    [id, open, anchor, registerContent],
  )

  return <MenuContext.Provider value={context}>{children}</MenuContext.Provider>
}

export interface MenuSubTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function MenuSubTrigger({ asChild, ref, style, onKeyDown, ...props }: MenuSubTriggerProps) {
  const { id, anchor } = useMenuContext('Menu.SubTrigger')
  const Part: ElementType = asChild ? Slot : 'button'

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || event.key !== 'ArrowRight') return

      event.preventDefault()
      const submenu = document.getElementById(id)
      submenu?.showPopover()
      submenu?.querySelector<HTMLElement>('[data-bedrock-roving-item]')?.focus()
    },
    [id, onKeyDown],
  )

  return (
    <Part
      {...props}
      type="button"
      role="menuitem"
      commandfor={id}
      command="toggle-popover"
      aria-haspopup="menu"
      onKeyDown={handleKeyDown}
      style={{ anchorName: anchor, ...style } as typeof style}
      ref={useComposedRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Menu.SubTrigger'),
      )}
      data-bedrock-roving-item=""
      data-bedrock-menu-item=""
    />
  )
}

export function MenuSubContent(props: MenuContentProps) {
  return <MenuContent side="right" align="start" {...props} />
}
