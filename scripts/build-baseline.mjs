import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { measure } from './texture.mjs'

/**
 * Rewrites docs/texture-baseline.json from a freshly built site.
 *
 * It builds first, deliberately, and through `npm run docs:build` rather than
 * the page builder alone. Measuring whatever happened to be in site/ is how a
 * number that disagreed with CI got committed: the build had failed, the
 * directory was stale, and the baseline recorded the previous run.
 */
const build = spawnSync('npm', ['run', 'docs:build'], { stdio: 'inherit' })

// A failing build is the ordinary case here — the ratchet is usually why you
// are running this — so a non-zero exit is not a reason to stop. A silent one
// would be.
if (build.status !== 0) {
  console.warn('\nbuild reported a failure; recording what it produced anyway\n')
}

const pages = Object.fromEntries(
  Object.entries(measure('site'))
    .map(([file, run]) => [file, run.length])
    .toSorted(([a], [b]) => a.localeCompare(b)),
)

writeFileSync(
  'docs/texture-baseline.json',
  JSON.stringify(
    {
      $comment:
        'Longest run of same-texture blocks per page. A ratchet: lower it when a page improves; the build fails when one gets worse. Regenerate with `npm run docs:baseline`, which builds first.',
      target: 3,
      pages,
    },
    null,
    2,
  ) + '\n',
)

const over = Object.values(pages).filter((run) => run > 3).length
console.log(`baseline: ${Object.keys(pages).length} pages, ${over} over target`)
