/**
 * `import.meta.glob` is Vite's, and the demos are the only thing in this
 * repository built by Vite — the library itself is compiled by tsc, and
 * src/env.d.ts deliberately declares the one global it needs rather than
 * pulling in a types package.
 *
 * Scoped to this directory for the same reason: nothing under src/ should be
 * able to reach for a bundler API by accident and still typecheck.
 */
/// <reference types="vite/client" />
