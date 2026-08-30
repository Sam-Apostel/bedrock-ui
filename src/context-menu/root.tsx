import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type ElementType,
  type MouseEvent,
} from 'react'
import { anchorName } from '../anchor'
import { useComposedRefs } from '../compose-refs'
import { MenuContext } from '../menu/shared'
import { useOpenState } from '../open-state'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

export interface ContextMenuRootProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  onOpenChange?(open: boolean): void
}

/**
 * Anchor positioning can only target an element, and a context menu opens at a
 * pointer coordinate. So the root renders a zero-size element, moves it to
 * where the pointer was, and anchors the menu to that.
 *
 * It is the one place in this library that positions something in JavaScript,
 * and it is two `style` writes rather than a positioning loop: the menu follows
 * the anchor from then on, including on scroll, because that is anchor
 * positioning's job.
 */
export function ContextMenuRoot({
  asChild,
  children,
  onOpenChange,
  onContextMenu,
  ref,
  ...props
}: ContextMenuRootProps) {
  const id = useId()
  const anchor = useMemo(() => anchorName(id), [id])
  const pointRef = useRef<HTMLElement | null>(null)
  const Part: ElementType = asChild ? Slot : 'div'

  const changeRef = useRef(onOpenChange)
  changeRef.current = onOpenChange

  const report = useCallback((next: boolean) => changeRef.current?.(next), [])
  const { open, observe } = useOpenState(report)

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onContextMenu?.(event)
      if (event.defaultPrevented) return

      event.preventDefault()
      const point = pointRef.current
      const menu = document.getElementById(id)
      if (!point || !menu) return

      point.style.left = `${event.clientX}px`
      point.style.top = `${event.clientY}px`

      // Not synchronously. `contextmenu` fires between pointerdown and
      // pointerup, and an auto popover light-dismisses on the pointerup that
      // lands outside it — so showing it here opens and closes it in one
      // gesture. Yielding a task puts the open after the sequence that would
      // have dismissed it.
      setTimeout(() => menu.showPopover(), 0)
    },
    [id, onContextMenu],
  )

  const context = useMemo(
    () => ({ id, open, anchor, registerContent: observe }),
    [id, open, anchor, observe],
  )

  return (
    <MenuContext.Provider value={context}>
      <Part
        {...props}
        onContextMenu={handleContextMenu}
        ref={useComposedRefs<HTMLElement>(ref)}
        data-bedrock-context-menu-trigger=""
      >
        {children}
        <span
          aria-hidden="true"
          ref={(node) => {
            pointRef.current = node
          }}
          style={{ position: 'fixed', width: 0, height: 0, anchorName: anchor } as never}
        />
      </Part>
    </MenuContext.Provider>
  )
}
