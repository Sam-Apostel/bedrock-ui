import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  AXIS,
  ENGINES,
  ENGINE_NAMES,
  TODAY_AT,
  components,
  componentStateAt,
  daysInto,
  featuresOf,
  formatDate,
  moments,
  nearest,
  nowIndex,
  plain,
  years,
  type ComponentState,
  type Engine,
  type Moment,
  type RowState,
} from './data'
import { TILES } from './tiles'
import './timeline.css'
import './eras.css'

/**
 * The support matrix as a thing you can scrub through.
 *
 * The table below this widget is the same data and stays the reference: it
 * works with JavaScript off, on a browser too old to run any of this, and it
 * says exactly which version of what. This is the other half — what those
 * numbers meant to a person trying to build a dialog in 2016, in 2022, and
 * last Tuesday.
 *
 * Three claims it makes at once, none of which a table makes well:
 *
 *   1. Most of these components could not exist until recently, and you can
 *      watch them switch on.
 *   2. The ones built on markup that shipped a decade ago never went dark, and
 *      that is an argument for building on markup.
 *   3. None of it has a look. The same fifteen components are restyled every
 *      time the era changes, and not one line of the components changes.
 */

const STATUS_LABEL = {
  dead: 'cannot work yet',
  degraded: 'works, with gaps',
  complete: 'every engine',
  gold: 'widely available',
} as const

/** Gold, but for the other reason: it never needed anything to begin with. */
const badge = (state: ComponentState) =>
  state.evergreen ? 'nothing to wait for' : STATUS_LABEL[state.status]

function engineSummary(state: RowState): string {
  const yes = ENGINES.filter((engine) => state.engines[engine] === 'yes')
  const preview = ENGINES.filter((engine) => state.engines[engine] === 'preview')

  if (yes.length === ENGINES.length) return 'every engine'
  if (yes.length > 0) return `${yes.map((engine) => ENGINE_NAMES[engine]).join(' and ')} only`
  if (preview.length > 0) {
    return `${preview.map((engine) => ENGINE_NAMES[engine]).join(' and ')}, not switched on`
  }
  return 'nowhere yet'
}

/** When the first engine ships the thing that is currently blocking a tile. */
function arrives(state: RowState): string | null {
  const dates = ENGINES.map((engine) => state.row.support[engine].date)
    .filter((date): date is string => Boolean(date))
    .toSorted()

  return dates.length > 0 ? (dates[0] as string) : null
}

function note(state: ComponentState): string {
  if (state.status === 'dead') {
    const blocker = state.blockers[0] as RowState
    const when = arrives(blocker)
    const rest =
      state.blockers.length > 1 ? ` (and ${state.blockers.length - 1} more it needs)` : ''

    return when
      ? `Waiting on ${plain(blocker.row.name)}${rest}, first shipped ${formatDate(when)}.`
      : `Waiting on ${plain(blocker.row.name)}${rest}, which no engine has shipped.`
  }

  if (state.evergreen) return 'Nothing to wait for: markup and JavaScript, no platform feature.'

  if (state.status === 'degraded') {
    const first = state.missing[0] as RowState
    const rest = state.missing.length > 1 ? `, and ${state.missing.length - 1} more` : ''
    return `${plain(first.row.name)}: ${engineSummary(first)}${rest}.`
  }

  if (state.status === 'gold') return 'Everything it uses has been everywhere for thirty months.'

  return 'Every feature it uses works in every engine.'
}

function Chips({ state }: { state: RowState }) {
  return (
    <span className="tl-chips">
      {ENGINES.map((engine: Engine) => (
        <span key={engine} className="tl-chip" data-state={state.engines[engine]}>
          {ENGINE_NAMES[engine].slice(0, 2)}
        </span>
      ))}
    </span>
  )
}

export function Tile({ state }: { state: ComponentState }) {
  const { component } = state
  const Live = TILES[component.id]
  const dead = state.status === 'dead'
  const rows = [...state.required, ...state.enhancing, ...state.polyfilled]

  return (
    <article
      className="tl-tile"
      data-status={state.status}
      style={{ '--span': component.span } as CSSProperties}
    >
      <header className="tl-tile-head">
        <h4>{component.name}</h4>
        <span className="tl-badge">{badge(state)}</span>
      </header>

      {/*
        `inert` rather than a click blocker: a component that could not work at
        this point in history should not be operable, focusable or read out as
        if it were. The attribute is the platform's answer and it is one word.
      */}
      <div className="tl-stage" inert={dead}>
        {Live ? <Live /> : null}
      </div>

      <details className="tl-detail">
        <summary>{note(state)}</summary>
        <ul>
          {rows.map((row) => (
            <li key={row.row.id} data-level={row.level}>
              <Chips state={row} />
              <span className="tl-feature">{plain(row.row.name)}</span>
              <span className="tl-why">
                {row.level === 'absent' || row.level === 'preview'
                  ? plain(row.row.degrade)
                  : engineSummary(row)}
              </span>
            </li>
          ))}
          {rows.length === 0 ? <li className="tl-none">{component.blurb}</li> : null}
        </ul>
      </details>
    </article>
  )
}

/**
 * The scrubber: a time axis, not a list of stops.
 *
 * Borrowed from the shape every video editor and every photo library uses,
 * because the problem is the same — a long stretch where nothing happens and a
 * short one where everything does. Four layers, back to front: year gridlines,
 * the era ribbon, a tick per moment sized by how much that date mattered, and
 * the playhead. A transparent range input lies over all of it, so dragging,
 * arrow keys, Home and End are the platform's rather than mine.
 *
 * The input counts in days, which is what puts the thumb exactly where the
 * date is; every change snaps to the nearest stop.
 */
function Scrubber({
  index,
  moment,
  onChange,
}: {
  index: number
  moment: Moment
  onChange(next: number): void
}) {
  const id = useId()

  const step = (event: KeyboardEvent<HTMLInputElement>) => {
    const move: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -5,
      PageUp: 5,
    }

    // Days are the input's unit, so its own arrow key would move by one day and
    // snap straight back to the stop it started on. Stops are the unit a reader
    // wants, so the keys move by those instead.
    if (event.key in move) {
      event.preventDefault()
      onChange(Math.min(moments.length - 1, Math.max(0, index + (move[event.key] as number))))
    } else if (event.key === 'Home') {
      event.preventDefault()
      onChange(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      onChange(moments.length - 1)
    }
  }

  return (
    <div className="tl-axis">
      <div className="tl-years" aria-hidden="true">
        {years.map(({ year, at }) => (
          <span key={year} className="tl-year" style={{ '--at': `${at}%` } as CSSProperties}>
            {year % 2 === 0 ? <i>{year}</i> : null}
          </span>
        ))}
      </div>

      {/* Past today the stops are arithmetic rather than news. */}
      <span
        className="tl-ahead"
        aria-hidden="true"
        title="Projected: thirty months in every engine is Baseline's bar for widely available"
        style={{ '--at': `${TODAY_AT}%` } as CSSProperties}
      />

      <div className="tl-ticks" aria-hidden="true">
        {moments.map((stop, position) => (
          <span
            key={stop.date}
            className="tl-tick"
            data-kind={stop.kind}
            data-past={position <= index || undefined}
            style={{ '--at': `${stop.at}%` } as CSSProperties}
          />
        ))}
      </div>

      <div
        className="tl-playhead"
        aria-hidden="true"
        style={{ '--at': `${moment.at}%` } as CSSProperties}
      >
        <span className="tl-playhead-date">{formatDate(moment.date)}</span>
      </div>

      <label className="tl-visually-hidden" htmlFor={id}>
        Point in time
      </label>
      <input
        id={id}
        className="tl-range"
        type="range"
        min={0}
        max={Math.round(AXIS.days)}
        step={1}
        value={Math.round(daysInto(moment.date))}
        onChange={(event) => onChange(nearest(event.target.valueAsNumber))}
        onKeyDown={step}
        aria-valuetext={`${formatDate(moment.date)}. ${moment.headline}`}
      />
    </div>
  )
}

export default function CompatTimeline() {
  const [index, setIndex] = useState(nowIndex)

  const moment = moments[index] as Moment
  const states = useMemo(
    () => components.map((component) => componentStateAt(component, moment.date)),
    [moment.date],
  )

  /*
   * One bar rather than three counts.
   *
   * Which components are which is what the grid underneath is for; the number
   * worth having at the top is how much of the library you could have used on
   * that date at all. The darker part of the fill is the share that worked
   * with nothing missing, because "works" and "works properly" are not the
   * same promise.
   */
  const working = states.filter((state) => state.status !== 'dead')
  const whole = states.filter((state) => state.status === 'complete' || state.status === 'gold')
  const ready = Math.round((working.length / states.length) * 100)

  const move = (delta: number) =>
    setIndex((current) => Math.min(moments.length - 1, Math.max(0, current + delta)))

  return (
    <div className="tl" data-era={moment.era.id} data-ahead={moment.ahead || undefined}>
      <div className="tl-controls">
        <button type="button" className="tl-step" onClick={() => move(-1)} disabled={index === 0}>
          <span aria-hidden="true">←</span>
          <span className="tl-visually-hidden">Previous moment</span>
        </button>

        <Scrubber index={index} moment={moment} onChange={setIndex} />

        <button
          type="button"
          className="tl-step"
          onClick={() => move(1)}
          disabled={index === moments.length - 1}
        >
          <span aria-hidden="true">→</span>
          <span className="tl-visually-hidden">Next moment</span>
        </button>
      </div>

      <div className="tl-head">
        <time className="tl-when" dateTime={moment.date}>
          {formatDate(moment.date)}
        </time>

        <p className="tl-headline" aria-live="polite">
          {moment.headline}
          {moment.ahead ? <em> (projected, not yet)</em> : null}
        </p>

        {/*
          What the features in that headline actually do. The table below the
          widget says what breaks without them; this says what they are for,
          and every link is MDN's own URL out of the compat data rather than a
          slug someone typed.
        */}
        <ul className="tl-features">
          {featuresOf(moment).map((row) => (
            <li key={row.id}>
              {row.mdn ? (
                <a className="tl-feature-name" href={row.mdn} target="_blank" rel="noreferrer">
                  {plain(row.name)}
                </a>
              ) : (
                <span className="tl-feature-name">{plain(row.name)}</span>
              )}
              <span className="tl-does">{row.does}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="tl-ready"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ready}
        aria-valuetext={`${working.length} of ${states.length} components usable, ${whole.length} of them with nothing missing`}
        aria-label="How much of the library works on this date"
      >
        <span
          className="tl-ready-fill"
          style={{ '--at': `${(working.length / states.length) * 100}%` } as CSSProperties}
        />
        <span
          className="tl-ready-whole"
          style={{ '--at': `${(whole.length / states.length) * 100}%` } as CSSProperties}
        />
      </div>

      <div className="tl-grid">
        {states.map((state) => (
          <Tile key={state.component.id} state={state} />
        ))}
      </div>
    </div>
  )
}
