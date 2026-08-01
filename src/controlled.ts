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

import { AccordionRoot } from './accordion/controlled-root'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from './accordion/parts'
import { CheckboxRoot } from './checkbox/controlled-root'
import { CheckboxIndicator } from './checkbox/parts'
import { CollapsibleRoot } from './collapsible/controlled-root'
import { CollapsibleContent, CollapsibleTrigger } from './collapsible/parts'
import { RadioGroupRoot } from './radio-group/controlled-root'
import { RadioGroupIndicator, RadioGroupItem } from './radio-group/parts'
import { ToggleRoot } from './toggle/controlled-root'

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
export const Checkbox = { Root: CheckboxRoot, Indicator: CheckboxIndicator }
export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
}
export const Toggle = { Root: ToggleRoot }

export type { ControlledAccordionRootProps } from './accordion/controlled-root'
export type { ControlledCollapsibleRootProps } from './collapsible/controlled-root'
export type { ControlledCheckboxProps } from './checkbox/controlled-root'
export type { ControlledRadioGroupRootProps } from './radio-group/controlled-root'
export type { ControlledToggleProps } from './toggle/controlled-root'

export { useDialogTrigger } from './dialog/shared'
export type { ControlledDialogRootProps } from './dialog/controlled-root'
