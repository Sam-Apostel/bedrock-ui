import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Emits the flat `r/*.json` files the shadcn CLI fetches, inlining each file's
 * contents from disk. Same output shape as `shadcn build`, without taking a
 * dependency on the CLI to produce it — and generated rather than hand-written,
 * so a component and its registry entry cannot drift apart.
 */
const OUT = 'r'
const registry = JSON.parse(readFileSync('registry.json', 'utf8'))

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const item of registry.items) {
  const files = item.files.map((file) => ({
    ...file,
    content: readFileSync(file.path, 'utf8'),
  }))

  const output = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    ...item,
    files,
  }

  const destination = join(OUT, `${item.name}.json`)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`wrote ${destination}`)
}

// An index, so the registry URL is browsable rather than a guess.
writeFileSync(
  join(OUT, 'registry.json'),
  `${JSON.stringify(
    {
      name: registry.name,
      homepage: registry.homepage,
      items: registry.items.map(({ name, type, title, description }) => ({
        name,
        type,
        title,
        description,
      })),
    },
    null,
    2,
  )}\n`,
)
console.log(`wrote ${join(OUT, 'registry.json')}`)
