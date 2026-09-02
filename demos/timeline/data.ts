import raw from '../../docs/compat.json'

/**
 * The compat page's data, reshaped into a timeline.
 *
 * docs/compat.json is the same file the static table is built from — versions
 * and dates written by scripts/build-compat.mjs out of MDN's data, prose
 * written by hand. Nothing here invents a date. Everything here is arithmetic
 * on the ones already in that file, which is why the grid and the table can
 * never disagree.
 */

export const ENGINES = ['chrome', 'firefox', 'safari'] as const

export type Engine = (typeof ENGINES)[number]

export const ENGINE_NAMES: Record<Engine, string> = {
  chrome: 'Chrome',
  firefox: 'Firefox',
  safari: 'Safari',
}

interface Support {
  version: string | null
  date: string | null
  status?: string
  preview?: { version: string; date: string | null; kind: string; label: string }
}

export interface Row {
  id: string
  group: string
  name: string
  uses: string
  critical: boolean
  degrade: string
  support: Record<Engine, Support>
  everywhere: string | null
  baseline: {
    feature: string | null
    status: string | null
    newly: string | null
    widely: string | null
    projectedWidely: string | null
  }
}

export interface Component {
  id: string
  name: string
  span: number
  blurb: string
  requires: string[]
  enhances: string[]
  replaces?: string[]
}

export interface Era {
  id: string
  name: string
  years: string
  from: string
  tagline: string
}

interface Compat {
  source: string
  sourceVersion: string
  generated: string
  rows: Row[]
  components: Component[]
  timeline: { from: string; eras: Era[] }
}

// The JSON is a build artefact with a stable shape, and inferring types from a
// 900-line literal buys nothing but slow editors.
const compat = raw as unknown as Compat

export const { components, source, sourceVersion, generated } = compat
export const eras = compat.timeline.eras
export const rows = new Map(compat.rows.map((row) => [row.id, row]))

/** Row names carry markup for the table. The grid wants words. */
export function plain(name: string): string {
  return name
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

export const TODAY = new Date().toISOString().slice(0, 10)

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function eraAt(date: string): Era {
  // Guaranteed by the first era starting at the timeline's own start date.
  let found = eras[0] as Era
  for (const era of eras) if (date >= era.from) found = era
  return found
}

/* ── Moments ─────────────────────────────────────────────────────────────── */

export type EventKind = 'preview' | 'ship' | 'everywhere' | 'widely'

export interface TimelineEvent {
  row: Row
  kind: EventKind
  engine?: Engine
  text: string
  weight: number
}

export interface Moment {
  date: string
  era: Era
  events: TimelineEvent[]
  headline: string
  /** A date the browsers have not reached yet: arithmetic, not an announcement. */
  ahead: boolean
}

/**
 * How loudly a milestone deserves to name the moment it happens in.
 *
 * Several things land on one date often enough that picking arbitrarily would
 * read as noise — 2022-03-14 is Safari shipping `<dialog>`, `<dialog>` reaching
 * every engine, and `::backdrop` doing both. The heading should be the last of
 * those, not the first one the loop happened to see.
 */
const WEIGHT: Record<EventKind, number> = { everywhere: 60, widely: 40, ship: 30, preview: 10 }

function events(row: Row): TimelineEvent[] {
  const found: TimelineEvent[] = []
  const critical = row.critical ? 15 : 0
  const name = plain(row.name)

  for (const engine of ENGINES) {
    const support = row.support[engine]
    const label = ENGINE_NAMES[engine]

    if (support.date) {
      found.push({
        row,
        kind: 'ship',
        engine,
        text: `${label} ${support.version} ships ${name}`,
        weight: WEIGHT.ship + critical,
      })
    }

    if (support.preview?.date) {
      found.push({
        row,
        kind: 'preview',
        engine,
        text: `${label} ${support.preview.version} has ${name} ${support.preview.label}`,
        weight: WEIGHT.preview,
      })
    }
  }

  if (row.everywhere) {
    found.push({
      row,
      kind: 'everywhere',
      text: `${name} now works in every engine`,
      weight: WEIGHT.everywhere + critical,
    })
  }

  const widely = row.baseline.widely ?? row.baseline.projectedWidely

  if (widely) {
    found.push({
      row,
      kind: 'widely',
      text: row.baseline.widely
        ? `${name} is Baseline widely available`
        : `${name} passes 30 months in every engine — Baseline's bar for widely available`,
      weight: WEIGHT.widely + critical,
    })
  }

  return found
}

function dateOf(row: Row, event: TimelineEvent): string | null {
  if (event.kind === 'ship') return row.support[event.engine as Engine].date
  if (event.kind === 'preview') return row.support[event.engine as Engine].preview?.date ?? null
  if (event.kind === 'everywhere') return row.everywhere
  return row.baseline.widely ?? row.baseline.projectedWidely
}

/**
 * Every date on which something changed, oldest first.
 *
 * The start is the timeline's, not the data's: `<select>` shipped in 2003 and
 * `<progress>` in 2010, and opening on a decade in which nothing happens is a
 * worse first impression than starting where the story does.
 */
export const moments: Moment[] = (() => {
  const byDate = new Map<string, TimelineEvent[]>()

  for (const row of compat.rows) {
    for (const event of events(row)) {
      const date = dateOf(row, event)
      if (!date || date < compat.timeline.from) continue

      const bucket = byDate.get(date)
      if (bucket) bucket.push(event)
      else byDate.set(date, [event])
    }
  }

  const dated = [...byDate.entries()].toSorted(([a], [b]) => a.localeCompare(b))

  return dated.map(([date, found]) => {
    const ranked = found.toSorted((a, b) => b.weight - a.weight)

    return {
      date,
      era: eraAt(date),
      events: ranked,
      headline: (ranked[0] as TimelineEvent).text,
      ahead: date > TODAY,
    }
  })
})()

/** The moment nearest today, which is where the slider should open. */
export const nowIndex = Math.max(
  0,
  moments.reduce((latest, moment, index) => (moment.ahead ? latest : index), 0),
)

/* ── State at a date ─────────────────────────────────────────────────────── */

export type EngineState = 'no' | 'preview' | 'yes'

/** Absent everywhere, visible somewhere, shipped somewhere, shipped everywhere. */
export type Level = 'absent' | 'preview' | 'partial' | 'everywhere' | 'wide'

export interface RowState {
  row: Row
  level: Level
  engines: Record<Engine, EngineState>
}

export function rowStateAt(row: Row, date: string): RowState {
  const engines = {} as Record<Engine, EngineState>
  let shipped = 0
  let previewed = 0

  for (const engine of ENGINES) {
    const support = row.support[engine]

    if (support.date && date >= support.date) {
      engines[engine] = 'yes'
      shipped += 1
    } else if (support.preview?.date && date >= support.preview.date) {
      engines[engine] = 'preview'
      previewed += 1
    } else {
      engines[engine] = 'no'
    }
  }

  const widely = row.baseline.widely ?? row.baseline.projectedWidely

  const level: Level =
    shipped === ENGINES.length
      ? widely && date >= widely
        ? 'wide'
        : 'everywhere'
      : shipped > 0
        ? 'partial'
        : previewed > 0
          ? 'preview'
          : 'absent'

  return { row, level, engines }
}

export type Status = 'dead' | 'degraded' | 'complete' | 'gold'

export interface ComponentState {
  component: Component
  status: Status
  /** Required rows that no engine has yet: the reason a tile is switched off. */
  blockers: RowState[]
  /** Shipped somewhere but not everywhere, or missing entirely. */
  missing: RowState[]
  /** Rows a JavaScript fallback stands in for while they are missing. */
  polyfilled: RowState[]
  required: RowState[]
  enhancing: RowState[]
  /** Nothing to wait for: this component is markup and JavaScript, no more. */
  evergreen: boolean
}

const rowsOf = (ids: string[], date: string) =>
  ids.flatMap((id) => {
    const row = rows.get(id)
    return row ? [rowStateAt(row, date)] : []
  })

const usable = (state: RowState) => state.level !== 'absent' && state.level !== 'preview'

export function componentStateAt(component: Component, date: string): ComponentState {
  const required = rowsOf(component.requires, date)
  const enhancing = rowsOf(component.enhances, date)
  const polyfilled = rowsOf(component.replaces ?? [], date).filter((state) => !usable(state))

  const blockers = required.filter((state) => !usable(state))
  const tracked = [...required, ...enhancing]
  const missing = tracked.filter((state) => state.level !== 'everywhere' && state.level !== 'wide')

  const evergreen = tracked.length === 0

  const status: Status =
    blockers.length > 0
      ? 'dead'
      : missing.length > 0
        ? 'degraded'
        : // Everything it touches has been in every engine for thirty months.
          // That is Baseline's own bar for "you can stop thinking about this".
          !evergreen && tracked.every((state) => state.level === 'wide')
          ? 'gold'
          : 'complete'

  return { component, status, blockers, missing, polyfilled, required, enhancing, evergreen }
}
