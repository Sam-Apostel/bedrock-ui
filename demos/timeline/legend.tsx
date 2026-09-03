import type { ReactNode } from 'react'
import type { Component } from './data'
import { TODAY, componentStateAt, components, eraAt, formatDate } from './data'
import { Tile } from './index'
import './legend.css'

/**
 * The key to the grid above, made of the thing it is a key to.
 *
 * This was a three-row table reading "Greyed out / Plain / Outlined" beside a
 * sentence each. A table can name a look; it cannot show one, and the reader
 * was left translating "outlined" into a mental image of a tile they had
 * already scrolled past. These are real tiles, in real states, from the same
 * data the grid runs on.
 *
 * One era for all three, deliberately. The state encoding is what is being
 * read here, and three different looks side by side would be a second variable
 * in a picture that is meant to have one.
 */

/**
 * A component, a date, and the sentence the date is there to earn.
 *
 * Popover is dated because a greyed Popover with no date on it reads as a
 * component that is broken now, which is the opposite of the claim. The other
 * two are today, and say so.
 */
const KEYS: { id: string; date: string; note: ReactNode }[] = [
  {
    id: 'popover',
    date: '2016-01-01',
    note: (
      <>
        A feature it cannot work without is in no engine yet. The tile is <code>inert</code>,
        because a component that could not have been built then should not be operable now.
      </>
    ),
  },
  {
    id: 'tooltip',
    date: TODAY,
    note: 'It works, with something missing: placement, a transition, single-open exclusivity. The line under each tile says which, and opens onto the rest.',
  },
  {
    id: 'slider',
    date: TODAY,
    note: 'Everything it uses is in every engine, and has been for long enough that you can stop checking.',
  },
]

const byId = new Map(components.map((component) => [component.id, component]))

/**
 * The scrubber's other encoding: how tall a tick is, and whether it has colour.
 *
 * Rendered with the same `.tl-tick` markup the axis uses rather than four hand
 * drawn swatches, so a change to how a milestone looks cannot leave its key
 * behind describing the old one.
 */
const TICKS: { kind: string; note: string }[] = [
  { kind: 'preview', note: 'Shipped behind a flag' },
  { kind: 'ship', note: 'Shipped in one engine' },
  { kind: 'everywhere', note: 'Reached every engine' },
  { kind: 'widely', note: 'Widely available' },
]

export default function CompatLegend() {
  return (
    <div className="tl tl-legend" data-era={eraAt(TODAY).id}>
      <ul className="tl-legend-grid">
        {KEYS.map(({ id, date, note }) => {
          const component = byId.get(id) as Component
          const state = componentStateAt(component, date)

          return (
            <li key={id} className="tl-legend-key">
              <div className="tl-legend-tile">
                <Tile state={state} />
              </div>

              <p className="tl-legend-note">
                <span className="tl-legend-when">
                  {date === TODAY ? 'Today' : formatDate(date)}
                </span>
                {note}
              </p>
            </li>
          )
        })}
      </ul>

      <ul className="tl-legend-ticks">
        {TICKS.map(({ kind, note }) => (
          <li key={kind}>
            <span className="tl-legend-tick" aria-hidden="true">
              <span className="tl-tick" data-kind={kind} data-past="" />
            </span>
            <span className="tl-legend-note">{note}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
