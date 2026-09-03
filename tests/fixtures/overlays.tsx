import type { ReactNode } from 'react'
import { useState } from 'react'
import { HoverCard, Popover, Tooltip } from '../../src/index'
import { Popover as ControlledPopover } from '../../src/controlled'

const SPACER = { height: 200 } as const

function PopoverCase() {
  const [log, setLog] = useState<string[]>([])

  return (
    <div style={SPACER}>
      <Popover.Root onOpenChange={(open) => setLog((l) => [...l, String(open)])}>
        <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
        <Popover.Content data-testid="content" side="bottom" align="start" sideOffset={8}>
          <p>Popover body</p>
          <input data-testid="field" defaultValue="" />
          <Popover.Close data-testid="close">Close</Popover.Close>
        </Popover.Content>
      </Popover.Root>
      <output data-testid="log">{log.join(',')}</output>
    </div>
  )
}

/** React refuses every open, and a popover's beforetoggle is cancelable. */
function RefusedPopover() {
  const [attempts, setAttempts] = useState(0)

  return (
    <ControlledPopover.Root open={false} onOpenChange={() => setAttempts((n) => n + 1)}>
      <ControlledPopover.Trigger data-testid="trigger">Open</ControlledPopover.Trigger>
      <ControlledPopover.Content data-testid="content">Body</ControlledPopover.Content>
      <output data-testid="attempts">{attempts}</output>
    </ControlledPopover.Root>
  )
}

function TooltipCase() {
  const [clicks, setClicks] = useState(0)

  return (
    <div style={{ padding: 100 }}>
      <Tooltip.Root delayDuration={50} closeDelay={20}>
        <Tooltip.Trigger data-testid="trigger" onClick={() => setClicks((n) => n + 1)}>
          Save
        </Tooltip.Trigger>
        <Tooltip.Content data-testid="content">Saves your work</Tooltip.Content>
      </Tooltip.Root>
      <output data-testid="clicks">{clicks}</output>
    </div>
  )
}

/**
 * An info icon: nothing happens when you tap it, so a press has nothing to be
 * careful of and the tooltip can come up almost at once.
 */
function TooltipIconCase() {
  return (
    <div style={{ padding: 100 }}>
      <Tooltip.Root delayDuration={50} closeDelay={20}>
        <Tooltip.Trigger data-testid="trigger" aria-label="About billing">
          i
        </Tooltip.Trigger>
        <Tooltip.Content data-testid="content">Charged monthly</Tooltip.Content>
      </Tooltip.Root>
    </div>
  )
}

function HoverCardCase() {
  return (
    <div style={{ padding: 100 }}>
      <HoverCard.Root openDelay={50} closeDelay={200}>
        <HoverCard.Trigger asChild data-testid="trigger">
          <a href="/?case=pricing">Pricing</a>
        </HoverCard.Trigger>
        <HoverCard.Content data-testid="content">
          <a href="/plans" data-testid="inner-link">
            Compare plans
          </a>
        </HoverCard.Content>
      </HoverCard.Root>
    </div>
  )
}

export const OVERLAY_CASES: Record<string, ReactNode> = {
  popover: <PopoverCase />,
  'refused-popover': <RefusedPopover />,
  tooltip: <TooltipCase />,
  'tooltip-icon': <TooltipIconCase />,
  'hover-card': <HoverCardCase />,
}
