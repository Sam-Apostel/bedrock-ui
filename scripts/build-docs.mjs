import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { marked } from 'marked'

/**
 * Builds the static site served at bedrock.sams.land.
 *
 * Deliberately not a framework: the docs are markdown, the compat page is one
 * self-contained HTML file that must stay exactly as it is, and the registry is
 * JSON the shadcn CLI fetches. A site generator would add a build step, a
 * config file and a dependency to move three kinds of file into one directory.
 */
const OUT = 'site'
const DOMAIN = 'bedrock.sams.land'

const PAGES = [
  { source: 'README.md', out: 'index.html', title: 'bedrock' },
  { source: 'docs/README.md', out: 'docs.html', title: 'Docs' },
  ...readdirSync('docs')
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .map((file) => ({
      source: join('docs', file),
      out: file.replace(/\.md$/, '.html'),
      title: null,
    })),
  { source: 'CONTRIBUTING.md', out: 'contributing.html', title: 'Contributing' },
  { source: 'CHANGELOG.md', out: 'changelog.html', title: 'Changelog' },
]

const NAV = [
  ['index.html', 'Home'],
  ['getting-started.html', 'Getting started'],
  ['state.html', 'Two roots'],
  ['dialog.html', 'Dialog'],
  ['styling.html', 'Styling'],
  ['compat.html', 'Browser support'],
  ['migration-from-radix.html', 'Migrating'],
  ['radix-parity.html', 'Radix parity'],
  ['shadcn-registry.html', 'shadcn registry'],
  ['agent-skill.html', 'Agent skill'],
  ['gaps.html', 'Gaps'],
]

/** Markdown links point at files in the repo; on the site they point at pages. */
function rewriteLinks(markdown) {
  return markdown
    .replace(/\]\(\.\/docs\/README\.md/g, '](./docs.html')
    .replace(/\]\(\.\/docs\/([\w-]+)\.md/g, '](./$1.html')
    .replace(/\]\(\.\/docs\/compat\.html/g, '](./compat.html')
    .replace(/\]\(\.\.\/([\w-]+)\.md/g, '](./$1.html')
    .replace(/\]\(\.\/([\w-]+)\.md/g, '](./$1.html')
}

const STYLE = `
:root { color-scheme: light dark; --bg:#fff; --fg:#16161a; --muted:#5c5f6b; --line:#e3e4e8; --card:#f7f7f9; --accent:#0a58c2 }
@media (prefers-color-scheme: dark) { :root { --bg:#111114; --fg:#eceef2; --muted:#9ba0ad; --line:#2a2b31; --card:#1a1b1f; --accent:#7fb0ff } }
* { box-sizing: border-box }
body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.65 ui-sans-serif,system-ui,-apple-system,sans-serif }
.shell { max-width:78rem; margin:0 auto; display:grid; grid-template-columns:15rem minmax(0,1fr); gap:3rem; padding:2rem 1.25rem 6rem }
@media (max-width:60rem) { .shell { grid-template-columns:1fr; gap:1rem } nav { position:static !important } }
nav { position:sticky; top:2rem; align-self:start }
nav strong { display:block; font-size:1.15rem; letter-spacing:-.02em; margin-bottom:1rem }
nav a { display:block; padding:.3rem 0; color:var(--muted); text-decoration:none; font-size:.92rem }
nav a:hover, nav a[aria-current=page] { color:var(--fg) }
nav a[aria-current=page] { font-weight:600 }
main { min-width:0 }
h1 { font-size:clamp(1.7rem,4vw,2.3rem); letter-spacing:-.02em; margin:0 0 1rem }
h2 { margin-top:2.5rem; letter-spacing:-.01em; border-top:1px solid var(--line); padding-top:1.5rem }
h3 { margin-top:2rem }
a { color:var(--accent) }
code { font:13.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; background:var(--card); padding:.12em .35em; border-radius:5px }
pre { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:1rem; overflow-x:auto }
pre code { background:none; padding:0 }
table { border-collapse:collapse; width:100%; display:block; overflow-x:auto }
th,td { text-align:left; padding:.55rem .8rem; border-bottom:1px solid var(--line); vertical-align:top; font-size:.93rem }
th { color:var(--muted); font-size:.78rem; text-transform:uppercase; letter-spacing:.06em }
blockquote { margin:0; padding:.6rem 1rem; border-left:3px solid var(--line); color:var(--muted) }
hr { border:0; border-top:1px solid var(--line); margin:2rem 0 }
`

function page({ title, body, current }) {
  const links = NAV.map(
    ([href, label]) =>
      `<a href="./${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`,
  ).join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${STYLE}</style>
  </head>
  <body>
    <div class="shell">
      <nav><strong>bedrock</strong>${links}</nav>
      <main>${body}</main>
    </div>
  </body>
</html>
`
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const { source, out, title } of PAGES) {
  const markdown = rewriteLinks(readFileSync(source, 'utf8'))
  const body = marked.parse(markdown, { async: false })
  const heading = /^#\s+(.+)$/m.exec(markdown)?.[1]
  const name = title ?? heading ?? basename(source, '.md')

  const heading_title = name === 'bedrock' ? 'bedrock' : `${name} — bedrock`
  writeFileSync(join(OUT, out), page({ title: heading_title, body, current: out }))
}

// The compat page tests the reader's browser, so it ships exactly as written.
cpSync('docs/compat.html', join(OUT, 'compat.html'))
// The registry is fetched from the same host the docs are on.
cpSync('r', join(OUT, 'r'), { recursive: true })
// So is the agent skill, which people install with curl.
cpSync('skills', join(OUT, 'skills'), { recursive: true })
writeFileSync(join(OUT, 'CNAME'), `${DOMAIN}\n`)
// Pages would otherwise run Jekyll over this and drop anything underscored.
writeFileSync(join(OUT, '.nojekyll'), '')

console.log(`built ${PAGES.length + 1} pages and the registry into ${OUT}/`)
