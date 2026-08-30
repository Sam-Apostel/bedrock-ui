import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

/**
 * Serves the built site for the docs tests. Deliberately tiny and dependency
 * free — this exists so Playwright can drive the real generated pages rather
 * than a fixture that resembles them, which is the only way to catch a demo
 * that builds but never mounts.
 */
const ROOT = 'site'
const PORT = Number(process.env.SITE_PORT ?? 5174)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
}

createServer((request, response) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname
  // normalize collapses `..`, and the prefix check rejects what is left.
  const relative = normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, relative)

  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')

  if (!file.startsWith(ROOT) || !existsSync(file)) {
    response.statusCode = 404
    response.end('not found')
    return
  }

  response.setHeader('content-type', TYPES[extname(file)] ?? 'application/octet-stream')
  createReadStream(file).pipe(response)
}).listen(PORT, () => console.log(`serving ${ROOT}/ on http://localhost:${PORT}`))
