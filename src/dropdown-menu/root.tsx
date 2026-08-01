import { useCallback, useId, useMemo, useRef, type ReactNode } from 'react'
import { anchorName } from '../anchor'
import { MenuContext } from '../menu/shared'
import { useOpenState } from '../open-state'

export interface DropdownMenuRootProps {
  children?: ReactNode
  onOpenChange?(open: boolean): void
}

/**
 * The same shape as Popover.Root, because a dropdown menu *is* a popover with a
 * roving list inside it. What it does not share is the bundle saving: the
 * roving module ships either way, so `/controlled` costs almost nothing extra
 * here and the docs do not pretend otherwise.
 */
export function DropdownMenuRoot({ children, onOpenChange }: DropdownMenuRootProps) {
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
