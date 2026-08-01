import type { ReactNode } from 'react'
import { useControlledRoot, type ControlledRootProps } from '../create-controlled-root'
import { DialogContext, dialogAdapter } from './shared'

export interface ControlledDialogRootProps extends ControlledRootProps {
  children?: ReactNode
}

/**
 * Same name, same parts, same props on every part as the plain root — swapping
 * between them is an import change and nothing else.
 *
 * All the extra weight is `useControlledRoot`. The context this publishes is
 * the same shape the plain root publishes, so no child part can tell the
 * difference, and none of this reaches an app that never imports it.
 */
export function DialogRoot({ children, ...props }: ControlledDialogRootProps) {
  const context = useControlledRoot(props, dialogAdapter)

  return <DialogContext.Provider value={context}>{children}</DialogContext.Provider>
}
