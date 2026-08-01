import type { ReactNode } from 'react'
import {
  AccessibleIcon,
  Accordion,
  AspectRatio,
  Avatar,
  Collapsible,
  Label,
  Progress,
  Separator,
  VisuallyHidden,
} from '../../src/index'

function Markup() {
  return (
    <>
      <Separator.Root data-testid="separator" orientation="vertical" />
      <Separator.Root data-testid="separator-decorative" decorative />
      <AspectRatio.Root data-testid="aspect" ratio={16 / 9} />
      <Label.Root data-testid="label" htmlFor="named">
        Name
      </Label.Root>
      <input id="named" data-testid="input" />
      <VisuallyHidden.Root data-testid="hidden">Screen readers only</VisuallyHidden.Root>
      <Progress.Root data-testid="progress" value={40} max={100} />
      <Progress.Root data-testid="progress-indeterminate" />
      <AccessibleIcon.Root label="Close">
        <svg data-testid="icon" viewBox="0 0 10 10" width="10" height="10">
          <path d="M0 0 L10 10" />
        </svg>
      </AccessibleIcon.Root>
    </>
  )
}

function Avatars() {
  return (
    <>
      <Avatar.Root data-testid="broken">
        <Avatar.Image data-testid="broken-image" src="/does-not-exist.png" alt="Nobody" />
        <Avatar.Fallback data-testid="broken-fallback">NB</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root data-testid="working">
        <Avatar.Image
          data-testid="working-image"
          alt="A pixel"
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />
        <Avatar.Fallback data-testid="working-fallback">OK</Avatar.Fallback>
      </Avatar.Root>
    </>
  )
}

function CollapsibleCase() {
  return (
    <Collapsible.Root data-testid="collapsible">
      <Collapsible.Trigger data-testid="collapsible-trigger">Show more</Collapsible.Trigger>
      <Collapsible.Content data-testid="collapsible-content">
        <input data-testid="collapsible-field" defaultValue="" />
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

function AccordionCase({ type = 'single' as const }) {
  return (
    <Accordion.Root type={type} data-testid="accordion">
      {['one', 'two', 'three'].map((value) => (
        <Accordion.Item key={value} value={value} data-testid={`item-${value}`}>
          <Accordion.Header data-testid={`header-${value}`}>
            <Accordion.Trigger>{value}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content data-testid={`content-${value}`}>Panel {value}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}

export const PRIMITIVE_CASES: Record<string, ReactNode> = {
  markup: <Markup />,
  avatars: <Avatars />,
  collapsible: <CollapsibleCase />,
  'accordion-single': <AccordionCase />,
  'accordion-multiple': <AccordionCase type="multiple" />,
}
