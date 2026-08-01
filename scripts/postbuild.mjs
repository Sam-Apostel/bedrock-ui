import { readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Source is written with extensionless relative imports, which `tsc` emits
 * verbatim. Bundlers resolve those; Node's ESM loader does not, so the
 * published package would fail to import outside a build step. Rewriting here
 * keeps the extension noise out of every source file.
 */
const SPECIFIER = /(\bfrom\s*['"])(\.{1,2}\/[^'"]*)(['"])/g
const HAS_EXTENSION = /\.[cm]?jsx?$|\.json$|\.css$/

function rewrite(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      rewrite(path)
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.d.ts')) {
      const source = readFileSync(path, 'utf8')
      const rewritten = source.replace(SPECIFIER, (match, open, specifier, close) =>
        HAS_EXTENSION.test(specifier) ? match : `${open}${specifier}.js${close}`,
      )
      if (rewritten !== source) writeFileSync(path, rewritten)
    }
  }
}

rewrite('dist')
copyFileSync('src/bedrock.css', 'dist/bedrock.css')
