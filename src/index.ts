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
import { CheckboxIndicator, CheckboxRoot } from './checkbox/parts'
import { CollapsibleRoot } from './collapsible/root'
import { CollapsibleContent, CollapsibleTrigger } from './collapsible/parts'
import { LabelRoot } from './label/parts'
import { ContextMenuRoot } from './context-menu/root'
import { DropdownMenuRoot } from './dropdown-menu/root'
import { HoverCardRoot } from './hover-card/root'
import {
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from './menu/parts'
import { MenubarMenu, MenubarRoot, MenubarTrigger } from './menubar/parts'
import {
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuViewport,
} from './navigation-menu/parts'
import { PopoverRoot } from './popover/root'
import { PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger } from './popover/parts'
import { ProgressIndicator, ProgressRoot } from './progress/parts'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from './radio-group/parts'
import { SwitchRoot, SwitchThumb } from './switch/parts'
import { TabsRoot } from './tabs/root'
import { TabsContent, TabsList, TabsTrigger } from './tabs/parts'
import { ToggleGroupItem, ToggleGroupRoot } from './toggle-group/parts'
import { ToolbarButton, ToolbarLink, ToolbarRoot, ToolbarSeparator } from './toolbar/parts'
import { TooltipRoot } from './tooltip/root'
import { TooltipContent, TooltipTrigger } from './tooltip/parts'
import { ToggleRoot } from './toggle/parts'
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
export const Checkbox = { Root: CheckboxRoot, Indicator: CheckboxIndicator }
export const Label = { Root: LabelRoot }
export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
}
export const HoverCard = {
  Root: HoverCardRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
}
export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Anchor: PopoverAnchor,
  Content: PopoverContent,
  Close: PopoverClose,
}
export const ContextMenu = {
  Root: ContextMenuRoot,
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Label: MenuLabel,
  Group: MenuGroup,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
}
export const DropdownMenu = {
  Root: DropdownMenuRoot,
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Label: MenuLabel,
  Group: MenuGroup,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
}
export const Menubar = {
  Root: MenubarRoot,
  Menu: MenubarMenu,
  Trigger: MenubarTrigger,
  Content: MenuContent,
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Label: MenuLabel,
  Group: MenuGroup,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
}
export const NavigationMenu = {
  Root: NavigationMenuRoot,
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: MenuTrigger,
  Content: MenuContent,
  Link: NavigationMenuLink,
  Viewport: NavigationMenuViewport,
}
export const Switch = { Root: SwitchRoot, Thumb: SwitchThumb }
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
}
export const ToggleGroup = { Root: ToggleGroupRoot, Item: ToggleGroupItem }
export const Toolbar = {
  Root: ToolbarRoot,
  Button: ToolbarButton,
  Link: ToolbarLink,
  Separator: ToolbarSeparator,
  ToggleGroup: ToggleGroupRoot,
  ToggleItem: ToggleGroupItem,
}
export const Tooltip = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
}
export const Toggle = { Root: ToggleRoot }
export const Progress = { Root: ProgressRoot, Indicator: ProgressIndicator }
export const Separator = { Root: SeparatorRoot }
export const VisuallyHidden = { Root: VisuallyHiddenRoot }

export { useDialogTrigger } from './dialog/shared'
export { usePopoverTrigger } from './popover/shared'
export {
  supportsAnchorPositioning,
  supportsHintPopovers,
  supportsInterestInvokers,
} from './capabilities'
export type { Align, Side } from './anchor'

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
export type { CheckboxIndicatorProps, CheckboxProps } from './checkbox/parts'
export type { LabelProps } from './label/parts'
export type {
  RadioGroupIndicatorProps,
  RadioGroupItemProps,
  RadioGroupRootProps,
} from './radio-group/parts'
export type { HoverCardRootProps } from './hover-card/root'
export type { PopoverRootProps } from './popover/root'
export type {
  PopoverAnchorProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverTriggerProps,
} from './popover/parts'
export type { SwitchProps, SwitchThumbProps } from './switch/parts'
export type { ContextMenuRootProps } from './context-menu/root'
export type { DropdownMenuRootProps } from './dropdown-menu/root'
export type {
  MenuCheckboxItemProps,
  MenuContentProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSeparatorProps,
  MenuSubTriggerProps,
  MenuTriggerProps,
} from './menu/parts'
export type { MenubarMenuProps, MenubarRootProps } from './menubar/parts'
export type {
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuRootProps,
} from './navigation-menu/parts'
export type { TabsRootProps } from './tabs/root'
export type { TabsContentProps, TabsListProps, TabsTriggerProps } from './tabs/parts'
export type { ToggleGroupItemProps, ToggleGroupRootProps } from './toggle-group/parts'
export type { ToolbarButtonProps, ToolbarLinkProps, ToolbarRootProps } from './toolbar/parts'
export type { Orientation } from './roving'
export type { TooltipRootProps } from './tooltip/root'
export type { TooltipContentProps, TooltipTriggerProps } from './tooltip/parts'
export type { ToggleProps } from './toggle/parts'
export type { ProgressIndicatorProps, ProgressProps } from './progress/parts'
export type { SeparatorProps } from './separator/parts'
export type { VisuallyHiddenProps } from './visually-hidden/parts'
