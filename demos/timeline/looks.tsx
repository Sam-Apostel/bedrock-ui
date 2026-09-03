import { Tabs } from '../../src/index'
import './looks.css'

/**
 * One component, rendered five times, with five stylesheets over it.
 *
 * The grid above makes this claim as you scrub, and it makes it badly: you
 * cannot hold March 2016 in your head while you look at last Tuesday. Five
 * renderings at once is the only way to see that the difference between them
 * is not in the markup, which is printed once, directly above.
 *
 * Eras are not named here, for the same reason they are not named in the grid:
 * a caption reading "Neumorphism, 2019" turns a demonstration about headless
 * components into a quiz about design history.
 */

/** Exactly the snippet printed above the widget in docs/compat.md. */
function Sample() {
  return (
    <Tabs.Root className="t-stack" defaultValue="editor">
      <Tabs.List className="t-tabs">
        <Tabs.Trigger className="t-tab" value="editor">
          Editor
        </Tabs.Trigger>
        <Tabs.Trigger className="t-tab" value="preview">
          Preview
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content className="t-tab-body" value="editor">
        Saved just now.
      </Tabs.Content>
      <Tabs.Content className="t-tab-body" value="preview">
        Nothing to preview yet.
      </Tabs.Content>
    </Tabs.Root>
  )
}

/**
 * Five of the seven the grid cycles through, in order, ending on the one the
 * grid above is currently wearing. The two left out fail at this size rather
 * than in general: Material's ground is within a hair of the docs page, so its
 * cell reads as a hole, and Glassmorphism's is three radial gradients tens of
 * rem across, which inside a 180px cell is one flat purple.
 */
const LOOKS = ['flat', 'gradient', 'neumorphic', 'brutal', 'bento']

export default function CompatLooks() {
  return (
    <ul className="tl-looks">
      {LOOKS.map((era) => (
        <li key={era} className="tl tl-look" data-era={era}>
          <Sample />
        </li>
      ))}
    </ul>
  )
}
