import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
// Through the module graph rather than a <link>, so the bundle carries it.
import '../src/bedrock.css'
import './demos.css'

/**
 * Mounts every demo referenced by a docs page.
 *
 * One React root per `[data-demo]` element rather than one root for the page:
 * the demos are independent, and a crash in one should not blank the others.
 *
 * The registry is built from the filesystem, so adding `demos/cases/foo.tsx`
 * and writing `<!-- demo: foo -->` in a markdown file is the whole workflow.
 * scripts/build-docs.mjs fails the build if a page names a demo with no file,
 * which is the case that would otherwise ship as a silent empty box.
 */
const modules = import.meta.glob<{ default: ComponentType }>('./cases/*.tsx', { eager: true })

const REGISTRY = new Map(
  Object.entries(modules).map(([path, module]) => [
    path.replace(/^\.\/cases\//, '').replace(/\.tsx$/, ''),
    module.default,
  ]),
)

for (const host of document.querySelectorAll<HTMLElement>('[data-demo]')) {
  const name = host.dataset.demo
  const Demo = name ? REGISTRY.get(name) : undefined

  if (!Demo) {
    host.textContent = `unknown demo: ${name ?? '(unnamed)'}`
    continue
  }

  createRoot(host).render(
    <StrictMode>
      <Demo />
    </StrictMode>,
  )
}
