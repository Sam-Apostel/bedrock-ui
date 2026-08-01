import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  AccessibleIcon,
  Accordion,
  AspectRatio,
  Avatar,
  Checkbox,
  Collapsible,
  Label,
  Progress,
  RadioGroup,
  Separator,
  Switch,
  Toggle,
  VisuallyHidden,
} from '../../src/index'
import { Checkbox as ControlledCheckbox } from '../../src/controlled'

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

function FormControls() {
  const [log, setLog] = useState<string[]>([])
  const push = (entry: string) => setLog((l) => [...l, entry])

  return (
    <>
      <output data-testid="log">{log.join(',')}</output>

      <Checkbox.Root data-testid="checkbox" onCheckedChange={(v) => push(`checkbox:${v}`)} />
      <Checkbox.Root data-testid="indeterminate" indeterminate />

      <Switch.Root data-testid="switch" onCheckedChange={(v) => push(`switch:${v}`)} />

      <RadioGroup.Root defaultValue="b" onValueChange={(v) => push(`radio:${v}`)}>
        <RadioGroup.Item value="a" data-testid="radio-a" />
        <RadioGroup.Item value="b" data-testid="radio-b" />
        <RadioGroup.Item value="c" data-testid="radio-c" />
      </RadioGroup.Root>

      <Toggle.Root data-testid="toggle" onPressedChange={(v) => push(`toggle:${v}`)}>
        Bold
      </Toggle.Root>
    </>
  )
}

/** React refuses every change, so the DOM must snap back. */
function RefusedCheckbox() {
  const [attempts, setAttempts] = useState(0)

  return (
    <>
      <output data-testid="attempts">{attempts}</output>
      <ControlledCheckbox.Root
        data-testid="refused"
        checked={false}
        onCheckedChange={() => setAttempts((n) => n + 1)}
      />
    </>
  )
}

export const PRIMITIVE_CASES: Record<string, ReactNode> = {
  'form-controls': <FormControls />,
  'refused-checkbox': <RefusedCheckbox />,
  markup: <Markup />,
  avatars: <Avatars />,
  collapsible: <CollapsibleCase />,
  'accordion-single': <AccordionCase />,
  'accordion-multiple': <AccordionCase type="multiple" />,
}
