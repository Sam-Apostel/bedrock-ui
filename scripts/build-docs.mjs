import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'
import { marked } from 'marked'
import { checkAgainstBaseline, measure } from './texture.mjs'

/**
 * Builds the static site served at bedrock.sams.land.
 *
 * Deliberately not a framework: the docs are markdown, the registry is JSON the
 * shadcn CLI fetches, and the demos are one Vite bundle. A site generator would
 * add a build step, a config file and a dependency to move three kinds of file
 * into one directory.
 */
const OUT = 'site'
const DOMAIN = 'bedrock.sams.land'
const DEMOS = 'demos/cases'

const PAGES = [
  { source: 'README.md', out: 'index.html', title: 'bedrock' },
  ...readdirSync('docs')
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .map((file) => ({
      source: join('docs', file),
      out: file.replace(/\.md$/, '.html'),
      title: null,
    })),
  { source: 'CONTRIBUTING.md', out: 'contributing.html', title: 'Contributing' },
  { source: 'RELEASING.md', out: 'releasing.html', title: 'Releasing' },
  { source: 'CHANGELOG.md', out: 'changelog.html', title: 'Changelog' },
]

/**
 * Grouped by the job a reader arrived to do, not by what kind of file it is.
 *
 * A `null` href is a section heading rather than a link.
 */
const NAV = [
  [null, 'Start'],
  ['index.html', 'Home'],
  ['getting-started.html', 'Getting started'],

  [null, 'Concepts'],
  ['state.html', 'The two roots'],
  ['styling.html', 'Styling'],
  ['compat.html', 'Browser support'],

  [null, 'Primitives'],
  ['dialog.html', 'Dialog'],
  ['alert-dialog.html', 'AlertDialog'],
  ['popover.html', 'Popover'],
  ['tooltip.html', 'Tooltip & HoverCard'],
  ['menus.html', 'Menus'],
  ['collapsible.html', 'Collapsible'],
  ['accordion.html', 'Accordion'],
  ['tabs.html', 'Tabs & Toolbar'],
  ['forms.html', 'Form controls'],
  ['select.html', 'Select'],
  ['slider.html', 'Slider'],
  ['toast.html', 'Toast'],
  ['display.html', 'Display'],

  [null, 'Switching'],
  ['should-you-switch.html', 'Should you switch?'],
  ['migration-from-radix.html', 'What changes'],
  ['radix-parity.html', 'Radix parity'],
  ['known-gaps.html', 'Known gaps'],

  [null, 'shadcn'],
  ['shadcn-registry.html', 'Registry'],

  [null, 'Project'],
  ['contributing.html', 'Contributing'],
  ['releasing.html', 'Releasing'],
  ['changelog.html', 'Changelog'],
]

/** Markdown links point at files in the repo; on the site they point at pages. */
function rewriteLinks(markdown) {
  return (
    markdown
      // In the repository, pointing at the site is useful. On the site it is a
      // link to the page you are standing on, which is the first thing a reader
      // clicks and the first thing that disappoints them.
      .replace(/<https:\/\/bedrock\.sams\.land\/?>/g, '[the docs](./index.html)')
      .replace(/\]\(https:\/\/bedrock\.sams\.land\/?\)/g, '](./index.html)')
      // An absolute link to our own page leaves the site and comes back, which
      // costs a round trip and breaks any preview deploy that is not on this
      // domain. Relative links stay inside whatever host is serving them.
      .replace(/<https:\/\/bedrock\.sams\.land\/([\w-]+\.html)>/g, '[$1](./$1)')
      .replace(/https:\/\/bedrock\.sams\.land\//g, './')
      .replace(/\]\(\.\/(README|CONTRIBUTING|RELEASING|CHANGELOG)\.md/g, (_m, name) =>
        name === 'README' ? '](./index.html' : `](./${name.toLowerCase()}.html`,
      )
      .replace(/\]\(\.\/docs\/([\w-]+)\.md/g, '](./$1.html')
      .replace(/\]\(\.\/docs\/compat\.html/g, '](./compat.html')
      .replace(/\]\(\.\.\/([\w-]+)\.md/g, '](./$1.html')
      .replace(/\]\(\.\/([\w-]+)\.md/g, '](./$1.html')
  )
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ── Demos ───────────────────────────────────────────────────────────────── */

/**
 * `<!-- demo: popover -->` becomes a running popover with its source under it.
 *
 * A comment rather than a fence so the markdown still reads as markdown in the
 * repository, where there is no bundle to run. Substituted as a text token
 * before marked sees the file and expanded afterwards: demo source contains
 * blank lines, and a blank line ends a markdown HTML block, so injecting the
 * markup first would get the snippet parsed as prose.
 */
const DEMO_COMMENT = /<!--\s*demo:\s*([\w-]+)\s*-->/g
const DEMO_TOKEN = /(?:<p>)?@@bedrock-demo:([\w-]+)@@(?:<\/p>)?/g

/**
 * `<!-- widget: compat-timeline -->` mounts the same way with no source view.
 *
 * A demo is a snippet you are meant to read — twenty lines of JSX with its
 * source underneath. A widget is a piece of the page: the timeline is six
 * hundred lines across four files, and a `<details>` promising "Source" that
 * opens onto a re-export of a module you cannot see is worse than none.
 */
const WIDGET_COMMENT = /<!--\s*widget:\s*([\w-]+)\s*-->/g
const WIDGET_TOKEN = /(?:<p>)?@@bedrock-widget:([\w-]+)@@(?:<\/p>)?/g

/**
 * Carries the `demo` class so the texture check counts it as a live thing.
 *
 * scripts/texture.mjs classifies blocks by what they open with, and a widget
 * that read as prose would let a wall of paragraphs run through it unnoticed.
 */
function widgetBlock(name) {
  const file = join(DEMOS, `${name}.tsx`)

  if (!existsSync(file)) {
    throw new Error(`docs reference widget "${name}", but ${file} does not exist`)
  }

  return (
    `<div class="demo demo-widget">` +
    `<div class="demo-stage" data-demo="${name}">` +
    `<span class="demo-pending">Loading…</span>` +
    `</div></div>`
  )
}

function demoBlock(name) {
  const file = join(DEMOS, `${name}.tsx`)

  if (!existsSync(file)) {
    throw new Error(`docs reference demo "${name}", but ${file} does not exist`)
  }

  const source = escapeHtml(readFileSync(file, 'utf8').trim())

  return (
    `<div class="demo">` +
    `<div class="demo-stage" data-demo="${name}">` +
    `<span class="demo-pending">Loading demo…</span>` +
    `</div>` +
    `<details class="demo-source"><summary>Source</summary>` +
    `<pre><code class="language-tsx">${source}</code></pre>` +
    `</details></div>`
  )
}

/* ── Support matrix ──────────────────────────────────────────────────────── */

const MATRIX_COMMENT = /<!--\s*support-matrix\s*-->/g
const MATRIX_TOKEN = /(?:<p>)?@@bedrock-matrix@@(?:<\/p>)?/g

const COMPAT = JSON.parse(readFileSync('docs/compat.json', 'utf8'))

/**
 * Feature detection for the "here" column, keyed by the row ids in
 * docs/compat.json. Runs in the reader's browser; the version columns beside it
 * come from MDN's data at build time.
 */
const PROBES = {
  'show-modal': `'showModal' in HTMLDialogElement.prototype`,
  invokers: `'commandForElement' in HTMLButtonElement.prototype`,
  backdrop: `sel('::backdrop')`,
  closedby: `'closedBy' in HTMLDialogElement.prototype`,
  popover: `HTMLElement.prototype.hasOwnProperty('popover')`,
  'popover-hint': `(() => { const el = document.createElement('div'); el.popover = 'hint'; return el.popover === 'hint' })()`,
  'anchor-name': `prop('anchor-name', '--a')`,
  'position-area': `prop('position-area', 'top')`,
  'position-try': `prop('position-try-fallbacks', 'flip-block')`,
  interestfor: `'interestForElement' in HTMLButtonElement.prototype`,
  'base-select': `prop('appearance', 'base-select')`,
  'starting-style': `'CSSStartingStyleRule' in window`,
  'allow-discrete': `prop('transition-behavior', 'allow-discrete')`,
  'overlay-prop': `prop('transition-property', 'overlay')`,
  'interpolate-size': `prop('interpolate-size', 'allow-keywords')`,
  'calc-size': `prop('width', 'calc-size(auto, size)')`,
  'open-selector': `sel(':open')`,
  'popover-open': `sel(':popover-open')`,
  'details-name': `'name' in HTMLDetailsElement.prototype`,
  'details-content': `sel('::details-content')`,
  // The foundations. Each of these is true in anything that can run the page,
  // which is the point: the column shows a wall of yes above rows that shipped
  // a decade ago, and a scatter below them.
  'details-el': `'HTMLDetailsElement' in window`,
  'select-el': `'HTMLSelectElement' in window`,
  'range-input': `(() => { const el = document.createElement('input'); el.type = 'range'; return el.type === 'range' })()`,
  'progress-el': `'HTMLProgressElement' in window`,
  'aspect-ratio': `prop('aspect-ratio', '16 / 9')`,
  'reduced-motion': `matchMedia('(prefers-reduced-motion)').media !== 'not all'`,
}

function version(value) {
  if (!value) return `<span class="no">—</span>`
  return value === 'yes' ? 'yes' : escapeHtml(value)
}

function matrixTable() {
  const sections = Object.entries(COMPAT.groups).map(([key, { title, blurb }]) => {
    const rows = COMPAT.rows
      .filter((row) => row.group === key)
      .map(
        (row) =>
          `<tr${row.critical ? ' class="floor"' : ''}>` +
          `<td>${row.name}</td>` +
          `<td class="probe" data-probe="${row.id}">·</td>` +
          `<td>${version(row.chrome)}</td>` +
          `<td>${version(row.firefox)}</td>` +
          `<td>${version(row.safari)}</td>` +
          `<td>${row.degrade}</td>` +
          `</tr>`,
      )
      .join('')

    // The blurb is not decoration: four tables in a row is a wall, and each
    // group answers a different question about what breaks.
    return (
      `<h3>${title}</h3>` +
      `<p>${blurb}</p>` +
      `<div class="table-wrap"><table class="support">` +
      `<thead><tr><th>Feature</th><th>Here</th><th>Chrome</th><th>Firefox</th><th>Safari</th><th>If missing</th></tr></thead>` +
      `<tbody>${rows}</tbody></table></div>`
    )
  })

  const probes = Object.entries(PROBES)
    .map(([id, expression]) => `  ${JSON.stringify(id)}: () => ${expression},`)
    .join('\n')

  // Inline, and deliberately not part of the demo bundle: this table has to
  // work on a browser too old to run anything else on the page.
  const script = `<script>
(function () {
  var sel = function (s) { try { return CSS.supports('selector(' + s + ')') } catch (e) { return false } }
  var prop = function (p, v) { try { return CSS.supports(p, v) } catch (e) { return false } }
  var probes = {
${probes}
  }
  var cells = document.querySelectorAll('[data-probe]')
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]
    var probe = probes[cell.getAttribute('data-probe')]
    var ok = false
    try { ok = probe ? !!probe() : false } catch (e) { ok = false }
    cell.textContent = ok ? 'yes' : 'no'
    cell.setAttribute('data-state', ok ? 'yes' : 'no')
  }
})()
</script>`

  return (
    `<p class="matrix-meta">Minimum versions from <code>${COMPAT.source}</code> ` +
    `${escapeHtml(COMPAT.sourceVersion)}, ${COMPAT.generated}. ${escapeHtml(COMPAT.note)} ` +
    `The <strong>Here</strong> column is measured in your browser as you read.</p>` +
    sections.join('') +
    script
  )
}

/* ── Page shell ──────────────────────────────────────────────────────────── */

const STYLE = readFileSync('styles/site.css', 'utf8')

function page({ title, body, current, demos }) {
  const links = NAV.map(([href, label]) => {
    if (href === null) return `<span class="nav-group">${label}</span>`
    // The page you are on is not a link to itself.
    if (href === current) return `<span class="here" aria-current="page">${label}</span>`
    return `<a href="./${href}">${label}</a>`
  }).join('')

  const head = demos ? `\n    <link rel="stylesheet" href="./demo/demos.css" />` : ''
  const script = demos ? `\n    <script type="module" src="./demo/demos.js"></script>` : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${STYLE}</style>${head}
  </head>
  <body>
    <div class="shell">
      <nav>
        <a class="masthead" href="./index.html">bedrock<span class="dot">.</span></a>
        ${links}
      </nav>
      <main>${body}</main>
    </div>${script}
  </body>
</html>
`
}

/** Tables need their own scroll container, which markdown will not give them. */
function wrapTables(html) {
  return html.replace(
    /<table>[\s\S]*?<\/table>/g,
    (table) => `<div class="table-wrap">${table}</div>`,
  )
}

/* ── Build ───────────────────────────────────────────────────────────────── */

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const mounted = new Set()

for (const { source, out, title } of PAGES) {
  const markdown = rewriteLinks(readFileSync(source, 'utf8'))
  const used = new Set()

  const tokenised = markdown
    .replace(DEMO_COMMENT, (_comment, name) => {
      used.add(name)
      return `@@bedrock-demo:${name}@@`
    })
    .replace(WIDGET_COMMENT, (_comment, name) => {
      used.add(name)
      return `@@bedrock-widget:${name}@@`
    })
    .replace(MATRIX_COMMENT, () => '@@bedrock-matrix@@')

  const parsed = marked.parse(tokenised, { async: false })
  const body = wrapTables(parsed)
    .replace(DEMO_TOKEN, (_token, name) => demoBlock(name))
    .replace(WIDGET_TOKEN, (_token, name) => widgetBlock(name))
    .replace(MATRIX_TOKEN, () => matrixTable())

  const heading = /^#\s+(.+)$/m.exec(markdown)?.[1]
  const name = title ?? heading ?? basename(source, '.md')

  const heading_title = name === 'bedrock' ? 'bedrock' : `${name} — bedrock`
  writeFileSync(
    join(OUT, out),
    page({ title: heading_title, body, current: out, demos: used.size > 0 }),
  )

  for (const demo of used) mounted.add(demo)
}

// A demo nothing references is dead weight that still costs bundle size, and
// the glob in demos/main.tsx means nobody would notice.
if (existsSync(DEMOS)) {
  const orphans = readdirSync(DEMOS)
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => basename(file, '.tsx'))
    .filter((name) => !mounted.has(name))

  if (orphans.length > 0) {
    throw new Error(`demos never referenced by any page: ${orphans.join(', ')}`)
  }
}

// The registry is fetched from the same host the docs are on.
cpSync('r', join(OUT, 'r'), { recursive: true })
// So is the agent skill, which people install with curl.
cpSync('skills', join(OUT, 'skills'), { recursive: true })
writeFileSync(join(OUT, 'CNAME'), `${DOMAIN}\n`)
// Pages would otherwise run Jekyll over this and drop anything underscored.
writeFileSync(join(OUT, '.nojekyll'), '')

/**
 * Every relative link must resolve to a page that exists.
 *
 * Restructuring is exactly when this breaks, and nothing else catches it: a
 * dangling link renders fine, and a browser test that navigates to a missing
 * page gets a 404 without failing. Renaming one page left twenty-six broken
 * links behind, all of which "passed".
 */
function checkLinks() {
  const pages = new Set(readdirSync(OUT).filter((name) => name.endsWith('.html')))
  const broken = []

  for (const file of pages) {
    const html = readFileSync(join(OUT, file), 'utf8')

    for (const match of html.matchAll(/href="\.\/([^"#]+\.html)/g)) {
      if (!pages.has(match[1])) broken.push(`${file} → ${match[1]}`)
    }
  }

  if (broken.length > 0) {
    throw new Error(`${broken.length} dangling link(s):\n  ` + [...new Set(broken)].join('\n  '))
  }
}

checkLinks()

// The site's one structural rule, measured rather than asserted. See
// scripts/texture.mjs: adjacent blocks should not be the same kind of thing,
// and no stylesheet can enforce that because it is a property of the content.
const improved = checkAgainstBaseline(measure(OUT))

for (const improvement of improved) {
  console.log(`texture improved — ${improvement}. Lower it in docs/texture-baseline.json.`)
}

console.log(`built ${PAGES.length} pages and the registry into ${OUT}/`)
