import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Serves the rendered-on-the-server markup for a case, with no script tag, at
 * `/ssr?case=…`.
 *
 * Closed content unmounts on the client, so scraping a hydrated page would no
 * longer show what a browser without JavaScript receives. This route does.
 */
function ssrRoute(): Plugin {
  return {
    name: 'bedrock-ssr-fixture',
    configureServer(server) {
      server.middlewares.use('/ssr', (request, response) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        const name = url.searchParams.get('case') ?? 'plain'

        void server
          .ssrLoadModule('/ssr-entry.tsx')
          .then((module) => {
            const html = (module as { render(name: string): string }).render(name)
            response.setHeader('content-type', 'text/html')
            response.end(
              `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div id="root">${html}</div></body></html>`,
            )
          })
          .catch((error: unknown) => {
            response.statusCode = 500
            response.end(String(error))
          })
      })
    },
  }
}

// Serves the Playwright fixture only. The library itself is built with tsc.
export default defineConfig({
  root: 'tests/fixtures',
  plugins: [react(), ssrRoute()],
  server: { port: 5173, strictPort: true },
})
