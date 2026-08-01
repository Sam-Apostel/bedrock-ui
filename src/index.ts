// Every part uses hooks or context, so the whole graph is client-side.
// Without this the package cannot be imported from a React Server Component.
'use client'

export { Slot } from './slot'
export { composeRefs } from './compose-refs'
export { validateTrigger } from './validate-trigger'
export { VISUALLY_HIDDEN } from './visually-hidden/parts'
export type { AsChildProps, InvokerKind, OpenStateAdapter, RootContextValue } from './types'

import { AccessibleIconRoot } from './accessible-icon/parts'
import { AccordionRoot } from './accordion/root'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from './accordion/parts'
import { AspectRatioRoot } from './aspect-ratio/parts'
import { AvatarFallback, AvatarImage, AvatarRoot } from './avatar/parts'
import { DialogRoot } from './dialog/root'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './dialog/parts'
import { CollapsibleRoot } from './collapsible/root'
import { CollapsibleContent, CollapsibleTrigger } from './collapsible/parts'
import { LabelRoot } from './label/parts'
import { ProgressIndicator, ProgressRoot } from './progress/parts'
import { SeparatorRoot } from './separator/parts'
import { VisuallyHiddenRoot } from './visually-hidden/parts'

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
}

export const AccessibleIcon = { Root: AccessibleIconRoot }
export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
}
export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
}
export const AspectRatio = { Root: AspectRatioRoot }
export const Avatar = { Root: AvatarRoot, Image: AvatarImage, Fallback: AvatarFallback }
export const Label = { Root: LabelRoot }
export const Progress = { Root: ProgressRoot, Indicator: ProgressIndicator }
export const Separator = { Root: SeparatorRoot }
export const VisuallyHidden = { Root: VisuallyHiddenRoot }

export { useDialogTrigger } from './dialog/shared'

export type { DialogRootProps } from './dialog/root'
export type { AccessibleIconProps } from './accessible-icon/parts'
export type { AccordionRootProps } from './accordion/root'
export type {
  AccordionContentProps,
  AccordionHeaderProps,
  AccordionItemProps,
  AccordionTriggerProps,
} from './accordion/parts'
export type { CollapsibleRootProps } from './collapsible/root'
export type { CollapsibleContentProps, CollapsibleTriggerProps } from './collapsible/parts'
export type { AspectRatioProps } from './aspect-ratio/parts'
export type { AvatarFallbackProps, AvatarImageProps, AvatarProps } from './avatar/parts'
export type { LabelProps } from './label/parts'
export type { ProgressIndicatorProps, ProgressProps } from './progress/parts'
export type { SeparatorProps } from './separator/parts'
export type { VisuallyHiddenProps } from './visually-hidden/parts'
