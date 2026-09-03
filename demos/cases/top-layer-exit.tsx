import { Popover } from '../../src/index'

/**
 * What `transition: overlay` is for, in the only form that settles it.
 *
 * Both panels are the same markup with the same 900ms exit. The left one keeps
 * `overlay ... allow-discrete` in its transition list and the right one does
 * not, which is the whole difference between them.
 *
 * The grey band is an ordinary element with a `z-index`. While a panel is open
 * it is in the top layer, so the band cannot touch it. On close, the panel that
 * kept `overlay` stays up there for the whole fade; the other one is returned
 * to normal flow on the first frame and spends its fade cut in half by a card
 * it was above a moment ago.
 *
 * This is the bug that gets reported as "z-index is broken in my dialog".
 */
function Lane({ keeps }: { keeps: boolean }) {
  return (
    <div className="tle-lane" data-keeps={keeps || undefined}>
      <p className="tle-label">
        {keeps ? (
          <code>transition: overlay 900ms allow-discrete</code>
        ) : (
          <code>the same, without overlay</code>
        )}
      </p>

      <Popover.Root>
        <Popover.Trigger className="tle-trigger">Open, then close</Popover.Trigger>
        <Popover.Content className="tle-panel" side="bottom" align="start" sideOffset={4}>
          <span>Watch this fade.</span>
        </Popover.Content>
      </Popover.Root>

      <div className="tle-card">a card, z-index 2</div>
    </div>
  )
}

export default function TopLayerExitDemo() {
  return (
    <div className="tle">
      <Lane keeps />
      <Lane keeps={false} />
    </div>
  )
}
