# bedrock

Headless React primitives that let the browser do the layering, positioning and
dismissal.

Radix-shaped anatomy: compound components, `asChild`, the part names you
already type. Underneath, the top layer, invoker commands and anchor positioning
do the work that `Portal`, `Presence`, `DismissableLayer` and Floating UI used to
do.

```bash
npm i @apostel/bedrock
```

<!-- demo: dialog -->

## The shape

```tsx
import { Dialog } from '@apostel/bedrock'

<Dialog.Root>
  <Dialog.Trigger>Delete project</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Delete project?</Dialog.Title>
    <Dialog.Description>This cannot be undone.</Dialog.Description>
    <Dialog.Close>Cancel</Dialog.Close>
    <button onClick={destroy}>Delete</button>
  </Dialog.Content>
</Dialog.Root>
```

renders roughly this:

```html
<button commandfor="d1" command="show-modal">Delete project</button>
<dialog id="d1">…</dialog>
```

No effect opens it. No state hook holds it. No portal moves it. The parser wires
the button to the dialog, so it works before hydration and keeps working if your
bundle never arrives.

## What it saves

Measured with esbuild, minified and gzipped, React external:

<!-- sizes-figure -->

| primitive | bedrock | Radix | |
| --- | --- | --- | --- |
| Checkbox | **0.70 kB** | 5.9 kB | 8.4× |
| Slider | **0.74 kB** | 9.8 kB | 13.2× |
| Select | **0.84 kB** | 31.5 kB | 37.5× |
| Accordion | **1.61 kB** | 8.8 kB | 5.5× |
| Dialog | **1.95 kB** | 13.7 kB | 7.0× |
| Popover | **2.11 kB** | 24.2 kB | 11.5× |
| Tooltip | **2.55 kB** | 19.3 kB | 7.6× |
| DropdownMenu | **3.55 kB** | 31.6 kB | 8.9× |

The ratio is largest where the platform hands over a whole element and smallest
where it hands over nothing but the layering. Menus are the case to budget from:
they save more kilobytes than anything but Select, and they still leave the
largest bedrock bundle in the library, because roving focus and typeahead have
no native equivalent and ship either way.
[Should you switch?](./docs/should-you-switch.md#3-the-saving-is-uneven)
breaks that down by group. The larger win is behavioural anyway: no z-index
fights, no portal clipping, no repositioning on every scroll frame.

## What it costs

bedrock targets current browsers on purpose, and the price is a hard floor.
Triggers are invoker commands with no JavaScript standing behind them, so:

| | Chrome | Firefox | Safari |
| --- | --- | --- | --- |
| Minimum | **135** | **144** | **26.2** |

Above that line, missing features degrade: placement falls back to the centre of
the viewport, transitions are skipped, a `<select>` renders as the OS dropdown.
The component still opens, closes, traps focus and is announced correctly. Below
it, nothing opens at all.

[Browser support](./docs/compat.md) has every feature, its minimum version in
each engine, and what its absence does to your UI, measured in the browser you
open it in.

## Where to start

- **[Getting started](./docs/getting-started.md)**: install, a first component,
  and the one rule that applies to every trigger.
- **[Should you switch?](./docs/should-you-switch.md)**: the case against
  adopting this. Read it first if you are evaluating.
- **[Migrating from Radix](./docs/migration-from-radix.md)**: what changes,
  what breaks, and what to do about it.
- **[shadcn registry](./docs/shadcn-registry.md)**: shadcn's own components with
  Radix swapped for bedrock, installable with `npx shadcn add`.
- **[Agent skill](./skills/migrate-to-bedrock/SKILL.md)**: does the mechanical
  migration and brings you the four decisions it cannot make for you.

## Status

`0.1.1` on npm. All 29 primitives, 190 Playwright tests against real Chrome.
What is missing is soak time and other engines, not components.

[Contributing](./CONTRIBUTING.md) · [Releasing](./RELEASING.md) ·
[Changelog](./CHANGELOG.md)
