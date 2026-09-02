import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'

/**
 * Refreshes the generated half of docs/compat.json from MDN's data.
 *
 * The file is half prose and half measurement. The prose — what a feature is
 * for, what breaks without it, which components lean on it — is written by
 * hand and never touched here. The versions, the release dates behind them and
 * the Baseline status come from @mdn/browser-compat-data and web-features, and
 * are rewritten wholesale on every run.
 *
 * Both packages are devDependencies, and neither is needed to build the site:
 * the output is committed, so `npm run docs:build` reads JSON and nothing else.
 * Run this when a browser ships something.
 *
 *     npm run compat:build
 *
 * Dates are the point. A version number answers "does it work"; a date answers
 * "since when", which is what the timeline on the compat page is built out of.
 */
const load = createRequire(import.meta.url)
const bcd = load('@mdn/browser-compat-data')
const { features } = load('web-features')

/** Neither package puts its own version anywhere an import can reach it. */
const installed = (name) =>
  JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version

const FILE = 'docs/compat.json'
const ENGINES = ['chrome', 'firefox', 'safari']

/** Baseline's own definition of "widely available": 30 months after newly. */
const WIDELY_MONTHS = 30

const compat = JSON.parse(readFileSync(FILE, 'utf8'))

/* ── BCD lookup ──────────────────────────────────────────────────────────── */

const node = (path) => path.split('.').reduce((value, key) => value?.[key], bcd)

const releaseDate = (engine, version) =>
  bcd.browsers[engine]?.releases?.[version]?.release_date ?? null

const releaseStatus = (engine, version) => bcd.browsers[engine]?.releases?.[version]?.status ?? null

/**
 * Why a support entry is not the real thing yet.
 *
 * BCD says this four different ways and the difference matters to a reader:
 * "behind a preference" is a thing you can turn on tonight, "under the old
 * name" is a thing your CSS has to spell differently, and "recognised but
 * inert" is a trap. They all become one milestone kind — the feature was
 * visible before it was usable — with the distinction kept as a label.
 */
function previewKind(entry) {
  if (entry.flags?.length) return 'flag'
  if (entry.prefix) return 'prefix'
  if (entry.alternative_name) return 'alias'
  if (entry.partial_implementation) return 'partial'
  return null
}

function previewLabel(entry, kind) {
  if (kind === 'flag') return `behind ${entry.flags[0].name}`
  if (kind === 'prefix') return `as ${entry.prefix}`
  if (kind === 'alias') return `as ${entry.alternative_name}`
  return 'partial implementation'
}

/**
 * The support story for one engine: when it landed, and what came before it.
 *
 * BCD lists entries newest first, and a feature that was renamed or unflagged
 * carries the older statement alongside the current one. Taking the first entry
 * would be right most of the time and silently wrong exactly where this file is
 * most interesting — `position-area` shipped as `inset-area` a full four months
 * before it shipped under its own name.
 */
function support(path, engine) {
  const entries = node(`${path}.__compat.support.${engine}`)
  if (!entries) return { version: null, date: null }

  const all = (Array.isArray(entries) ? entries : [entries]).filter(
    (entry) => entry.version_added !== false && entry.version_added !== null,
  )

  const shipped = all.filter((entry) => !previewKind(entry) && !entry.version_removed)
  const previews = all.filter((entry) => previewKind(entry))

  // "preview" is BCD for Safari Technology Preview: real, dated by nothing.
  const current = shipped.find((entry) => entry.version_added !== 'preview')
  const version = current?.version_added ?? shipped[0]?.version_added ?? null

  const out = { version: version ?? null, date: null }

  if (version && version !== 'preview') {
    out.date = releaseDate(engine, version)
    // A version with no release date is announced rather than shipped. Saying
    // so is more useful than a blank, and the timeline must not stop there.
    if (!out.date) out.status = releaseStatus(engine, version) ?? 'unreleased'
  } else if (version === 'preview') {
    out.status = 'preview'
  }

  const first = previews.at(-1)

  if (first) {
    const kind = previewKind(first)
    out.preview = {
      version: first.version_added,
      date: releaseDate(engine, first.version_added),
      kind,
      label: previewLabel(first, kind),
    }
  }

  return out
}

/* ── Baseline ────────────────────────────────────────────────────────────── */

const byCompatKey = new Map()

for (const [id, feature] of Object.entries(features)) {
  for (const key of feature.compat_features ?? []) {
    if (!byCompatKey.has(key)) byCompatKey.set(key, id)
  }
}

function addMonths(date, months) {
  const shifted = new Date(`${date}T00:00:00Z`)
  shifted.setUTCMonth(shifted.getUTCMonth() + months)
  return shifted.toISOString().slice(0, 10)
}

/**
 * Baseline for a row, and the projection where Baseline has nothing to say.
 *
 * web-features groups features the way a developer thinks about them, which is
 * coarser than this table: `:popover-open` and `showPopover()` are one feature
 * there and two rows here. So the group's status is recorded as the group's,
 * and "widely available" is projected per row from the date the last engine
 * shipped *that row* — the same 30 months Baseline itself uses. A projection is
 * marked as one; the page must not present arithmetic as an announcement.
 */
function baseline(row, everywhere) {
  const id = byCompatKey.get(row.bcd)
  const status = id ? features[id].status : null

  return {
    feature: id ?? null,
    status: status?.baseline === false ? 'none' : (status?.baseline ?? null),
    newly: status?.baseline_low_date ?? null,
    widely: status?.baseline_high_date ?? null,
    projectedWidely:
      !status?.baseline_high_date && everywhere ? addMonths(everywhere, WIDELY_MONTHS) : null,
  }
}

/* ── Rewrite ─────────────────────────────────────────────────────────────── */

const missing = []

for (const row of compat.rows) {
  if (!node(`${row.bcd}.__compat`)) {
    missing.push(`${row.id} → ${row.bcd}`)
    continue
  }

  row.support = Object.fromEntries(ENGINES.map((engine) => [engine, support(row.bcd, engine)]))

  const dates = ENGINES.map((engine) => row.support[engine].date)
  const everywhere = dates.every(Boolean) ? dates.toSorted().at(-1) : null

  row.everywhere = everywhere
  row.baseline = baseline(row, everywhere)

  // The matrix table reads these; they are the support block flattened, kept
  // because a table cell wants a version and nothing else.
  for (const engine of ENGINES) row[engine] = row.support[engine].version
}

compat.sourceVersion = installed('@mdn/browser-compat-data')
compat.webFeaturesVersion = installed('web-features')
compat.generated = new Date().toISOString().slice(0, 10)

writeFileSync(FILE, `${JSON.stringify(compat, null, 2)}\n`)

// JSON.stringify expands every array onto its own lines and the formatter
// collapses the short ones back, so a generated file that is not formatted here
// fails `npm run format:check` the moment it is committed. See the note in
// .oxfmtrc.json about r/, which is the same fight one directory over.
spawnSync('npx', ['oxfmt', FILE], { stdio: 'inherit' })

if (missing.length > 0) {
  // Not fatal: `interestfor` sat outside BCD for months while shipping in
  // Chrome. A row MDN does not carry keeps its hand-written versions.
  console.warn(`no BCD entry for ${missing.length} row(s):\n  ${missing.join('\n  ')}`)
}

console.log(
  `compat: ${compat.rows.length - missing.length} rows from browser-compat-data ` +
    `${compat.sourceVersion} and web-features ${compat.webFeaturesVersion}`,
)
