/**
 * `process.env.NODE_ENV` is what every bundler replaces at build time, so the
 * dev-only branches in this library are written against it. Declaring the one
 * property we read keeps @types/react's only companion out of the dependency
 * list — pulling in @types/node would put Node globals in scope for a library
 * that never runs outside a browser.
 */
declare const process: { env: { NODE_ENV?: string } }
