import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Bundles the docs demos into site/demo/.
 *
 * Separate from vite.config.ts, which serves the Playwright fixtures and has a
 * different root. This one builds; that one only ever runs a dev server.
 *
 * React is bundled rather than externalised: the site is static files on Pages
 * with no import map and no CDN, so an unresolved bare specifier would be a
 * blank demo box on a page that otherwise looks fine.
 *
 * Filenames are pinned rather than hashed because scripts/build-docs.mjs writes
 * the <script> and <link> tags by hand. Pages sets its own caching, and a docs
 * bundle is not worth a manifest to read.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'site/demo',
    // Only ever contains this bundle, and docs:build has already recreated the
    // parent, so there is nothing of anyone else's to delete.
    emptyOutDir: true,
    // One stylesheet for one entry; splitting it would mean tracking the names.
    cssCodeSplit: false,
    rollupOptions: {
      input: 'demos/main.tsx',
      output: {
        entryFileNames: 'demos.js',
        chunkFileNames: 'demos-[name].js',
        assetFileNames: 'demos[extname]',
      },
    },
  },
})
