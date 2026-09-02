import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import {
  ENGINES,
  ENGINE_NAMES,
  components,
  componentStateAt,
  eras,
  formatDate,
  generated,
  moments,
  nowIndex,
  plain,
  source,
  sourceVersion,
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

const AUTOPLAY_MS = 1600

/** Era bands under the track, sized by how many moments fall in each. */
function bands(): { era: (typeof eras)[number]; count: number }[] {
  const found: { era: (typeof eras)[number]; count: number }[] = []

  for (const moment of moments) {
    const last = found.at(-1)
    if (last && last.era.id === moment.era.id) last.count += 1
    else found.push({ era: moment.era, count: 1 })
  }

  return found
}

const BANDS = bands()

const STATUS_LABEL = {
  dead: 'cannot work yet',
  degraded: 'works, with gaps',
  complete: 'every engine',
  gold: 'widely available',
} as const

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

function Tile({ state }: { state: ComponentState }) {
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
        <span className="tl-badge">{STATUS_LABEL[state.status]}</span>
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

  return (
    <div className="tl-scrub">
      <label className="tl-visually-hidden" htmlFor={id}>
        Point in time
      </label>
      <input
        id={id}
        className="tl-range"
        type="range"
        min={0}
        max={moments.length - 1}
        step={1}
        value={index}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        aria-valuetext={`${formatDate(moment.date)} — ${moment.headline}`}
      />
      <div className="tl-bands" aria-hidden="true">
        {BANDS.map((band) => (
          <span
            key={band.era.id}
            className="tl-band"
            data-era={band.era.id}
            data-current={band.era.id === moment.era.id}
            style={{ '--count': band.count } as CSSProperties}
          >
            <span>{band.era.name}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CompatTimeline() {
  const [index, setIndex] = useState(nowIndex)
  const [playing, setPlaying] = useState(false)

  const moment = moments[index] as Moment
  const states = useMemo(
    () => components.map((component) => componentStateAt(component, moment.date)),
    [moment.date],
  )

  useEffect(() => {
    if (!playing) return

    const timer = setInterval(() => {
      setIndex((current) => {
        if (current >= moments.length - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, AUTOPLAY_MS)

    return () => clearInterval(timer)
  }, [playing])

  const tally = {
    dead: states.filter((state) => state.status === 'dead').length,
    degraded: states.filter((state) => state.status === 'degraded').length,
    done: states.filter((state) => state.status === 'complete' || state.status === 'gold').length,
  }

  const move = (delta: number) => {
    setPlaying(false)
    setIndex((current) => Math.min(moments.length - 1, Math.max(0, current + delta)))
  }

  return (
    <div className="tl" data-era={moment.era.id} data-ahead={moment.ahead || undefined}>
      <div className="tl-head">
        <div className="tl-when">
          <time dateTime={moment.date}>{formatDate(moment.date)}</time>
          <span className="tl-era">
            {moment.era.name} <i>{moment.era.years}</i>
          </span>
        </div>

        <p className="tl-headline" aria-live="polite">
          {moment.headline}
          {moment.ahead ? <em> — projected, not yet</em> : null}
        </p>
        <p className="tl-tagline">{moment.era.tagline}</p>
      </div>

      <div className="tl-controls">
        <button type="button" className="tl-step" onClick={() => move(-1)} disabled={index === 0}>
          <span aria-hidden="true">←</span>
          <span className="tl-visually-hidden">Previous moment</span>
        </button>

        <Scrubber
          index={index}
          moment={moment}
          onChange={(next) => {
            setPlaying(false)
            setIndex(next)
          }}
        />

        <button
          type="button"
          className="tl-step"
          onClick={() => move(1)}
          disabled={index === moments.length - 1}
        >
          <span aria-hidden="true">→</span>
          <span className="tl-visually-hidden">Next moment</span>
        </button>

        <button
          type="button"
          className="tl-play"
          onClick={() => setPlaying((current) => !current)}
          aria-pressed={playing}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <p className="tl-tally">
        <span data-status="dead">{tally.dead} cannot work</span>
        <span data-status="degraded">{tally.degraded} with gaps</span>
        <span data-status="complete">{tally.done} everywhere</span>
        <span className="tl-events">
          {moment.events.length} change{moment.events.length === 1 ? '' : 's'} on this date
        </span>
      </p>

      <div className="tl-grid">
        {states.map((state) => (
          <Tile key={state.component.id} state={state} />
        ))}
      </div>

      <p className="tl-source">
        Versions and dates from <code>{source}</code> {sourceVersion}, generated {generated}.
        Everything above is that file: the components are the real ones, the styling is the era, and
        neither knows about the other.
      </p>
    </div>
  )
}
