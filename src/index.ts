// Every part uses hooks or context, so the whole graph is client-side.
// Without this the package cannot be imported from a React Server Component.
'use client'

export { Slot } from './slot'
export { composeRefs } from './compose-refs'
export { validateTrigger } from './validate-trigger'
export type { AsChildProps, InvokerKind, OpenStateAdapter, RootContextValue } from './types'

import { DialogRoot } from './dialog/root'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './dialog/parts'

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
}

export { useDialogTrigger } from './dialog/shared'
export type { DialogRootProps } from './dialog/root'
