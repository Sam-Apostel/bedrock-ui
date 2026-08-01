'use client'

/**
 * Separate module graph from the root entry point. If nothing in an app
 * imports '@apostel/bedrock/controlled', none of this reaches the bundle —
 * a guarantee from the exports map, not from tree shaking.
 */
export { useControlledRoot } from './create-controlled-root'
export type { ControlledRootProps } from './create-controlled-root'

import { DialogRoot } from './dialog/controlled-root'
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
export type { ControlledDialogRootProps } from './dialog/controlled-root'
