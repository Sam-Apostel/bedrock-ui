import { useMemo, type ReactNode } from 'react'
import { anchorName } from '../anchor'
import { useControlledRoot, type ControlledRootProps } from '../create-controlled-root'
import { MenuContext } from '../menu/shared'
import { popoverAdapter } from '../popover/shared'

export interface ControlledDropdownMenuRootProps extends ControlledRootProps {
  children?: ReactNode
}

export function DropdownMenuRoot({ children, ...props }: ControlledDropdownMenuRootProps) {
  const context = useControlledRoot(props, popoverAdapter)
  const anchor = useMemo(() => anchorName(context.id), [context.id])
  const value = useMemo(() => ({ ...context, anchor }), [context, anchor])

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}
