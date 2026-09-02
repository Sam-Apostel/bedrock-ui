import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Measures how often a page changes texture.
 *
 * The site's one structural rule is that adjacent blocks should not be the same
 * kind of thing: prose, then code, then a live demo, then a table, then prose.
 * It is what stops a documentation page reading as a wall, and — unlike the
 * grid or the type scale — no stylesheet can deliver it. It is a property of
 * what the page is made of, so it has to be measured rather than declared.
 *
 * This is a ratchet, not a target. Every page carries the longest run it had
 * when the check was introduced; a page may improve and lower its own number,
 * and the build fails if one gets worse. That makes the debt visible and
 * bounded without pretending it is already paid.
 */
const BASELINE = 'docs/texture-baseline.json'

const TEXTURE = [
  [/^<pre/, 'code'],
  // A demo's source block is a <pre> in a wrapper, and reads as one.
  [/^<div class="demo-code"/, 'code'],
  [/^<div class="demo"/, 'demo'],
  [/^<div class="table-wrap"|^<table/, 'table'],
  [/^<h[1-6]/, 'heading'],
  [/^<(ul|ol)/, 'list'],
  [/^<blockquote/, 'quote'],
]

function classify(block) {
  for (const [pattern, name] of TEXTURE) if (pattern.test(block)) return name
  return 'prose'
}

function blocksOf(html) {
  const start = html.indexOf('<main>')
  const end = html.lastIndexOf('</main>')
  if (start === -1 || end === -1) return []

  const main = html.slice(start + '<main>'.length, end)
  return main.match(/<(p|pre|h[1-6]|ul|ol|div|blockquote|table)[\s>][\s\S]*?<\/\1>/g) ?? []
}

/**
 * The top-level blocks of a rendered page, in order, headings excluded.
 *
 * Headings are punctuation between sections rather than a texture of their own;
 * counting them would mask a wall of prose broken only by subheadings.
 */
export function textures(html) {
  return blocksOf(html)
    .map(classify)
    .filter((name) => name !== 'heading')
}

/**
 * The longest run, and the headings it sits between.
 *
 * Reported by the failing build, because "break the run" without saying where
 * sends you hunting. It reads the same blocks the check does — a second,
 * slightly different implementation is how you end up trusting a number that
 * disagrees with CI.
 */
export function longestRun(html) {
  let run = 0
  let previous = null
  let heading = '(top of page)'
  let from = heading
  let worst = { length: 0, kind: null, from: heading, to: heading }

  for (const block of blocksOf(html)) {
    const kind = classify(block)

    // A heading is not a texture, and it does not interrupt one either: a wall
    // of prose broken only by subheadings is still a wall.
    if (kind === 'heading') {
      heading = block.replace(/<[^>]+>/g, '').trim()
      continue
    }

    if (kind === previous) {
      run += 1
    } else {
      run = 1
      from = heading
      previous = kind
    }

    if (run > worst.length) worst = { length: run, kind, from, to: heading }
  }

  return worst
}

export function measure(directory) {
  const report = {}

  for (const file of readdirSync(directory).filter((name) => name.endsWith('.html'))) {
    const html = readFileSync(join(directory, file), 'utf8')
    if (textures(html).length > 0) report[file] = longestRun(html)
  }

  return report
}

/** Throws listing every page that got worse. Returns pages that improved. */
export function checkAgainstBaseline(report) {
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
  const worse = []
  const better = []

  for (const [file, run] of Object.entries(report)) {
    const allowed = baseline.pages[file]

    const where = `${run.length} × ${run.kind}, between "${run.from}" and "${run.to}"`

    if (allowed === undefined) {
      // A new page starts at the target rather than at whatever it happens to
      // be, so the debt cannot grow by adding pages.
      if (run.length > baseline.target) {
        worse.push(`${file}: ${where} (new pages must be <= ${baseline.target})`)
      }
      continue
    }

    if (run.length > allowed) worse.push(`${file}: ${where} — was ${allowed}`)
    else if (run.length < allowed) better.push(`${file}: ${run.length}, was ${allowed}`)
  }

  if (worse.length > 0) {
    throw new Error(
      `texture: ${worse.length} page(s) now run longer without changing texture:\n  ` +
        worse.join('\n  ') +
        `\n\nBreak the run with an example, a table or a demo — or lower the number in ${BASELINE} if the page genuinely improved.`,
    )
  }

  return better
}
