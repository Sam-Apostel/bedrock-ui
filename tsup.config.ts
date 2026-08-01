import { defineConfig } from 'tsup'

// Two entry points, two module graphs. The `exports` map promises that an app
// which never imports `/controlled` never pays for reconciliation code, so the
// entries must not be bundled into a shared chunk that both pull in.
export default defineConfig({
  entry: ['src/index.ts', 'src/controlled/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  treeshake: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom'],
})
