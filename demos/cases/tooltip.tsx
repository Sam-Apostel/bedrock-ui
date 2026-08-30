import { HoverCard, Tooltip } from '../../src/index'

/**
 * Both are hover and focus intent over an anchored popover. The tooltip
 * *describes* its trigger, so the button keeps its own name; the hover card is
 * a region you can move the pointer into, which is why its content holds a
 * link and the tooltip's does not.
 *
 * The intent timers are JavaScript today. When `interestfor` ships, the same
 * props become declarative and nothing above this changes — which is why the
 * prop is `delayDuration` and not `interest-show-delay`.
 */
export default function TooltipDemo() {
  return (
    <>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger>Save</Tooltip.Trigger>
        <Tooltip.Content side="top" sideOffset={6}>
          Saves without closing
        </Tooltip.Content>
      </Tooltip.Root>

      <HoverCard.Root openDelay={150} closeDelay={200}>
        <HoverCard.Trigger asChild>
          <a href="https://bedrock.sams.land">bedrock</a>
        </HoverCard.Trigger>
        <HoverCard.Content side="bottom" align="start" sideOffset={8}>
          <strong>@apostel/bedrock</strong>
          <p style={{ margin: '.4rem 0 0' }}>
            Headless React primitives built on native platform features.
          </p>
        </HoverCard.Content>
      </HoverCard.Root>
    </>
  )
}
