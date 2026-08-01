import { renderToString } from 'react-dom/server'
import { CASES } from './cases'

/**
 * Used by the dev server's /ssr route, which serves markup with no script tag
 * at all. That is the only honest way to test the no-JavaScript claim now that
 * closed content unmounts on the client: the browser must see what the server
 * sent, not what React left behind after hydrating.
 */
export function render(name: string): string {
  const element = CASES[name]
  if (!element) throw new Error(`unknown case: ${name}`)
  return renderToString(element)
}
