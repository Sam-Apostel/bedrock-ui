---
name: migrate-to-bedrock
description: Migrate a React codebase from Radix UI primitives to @apostel/bedrock. Use when the user asks to migrate off Radix, replace @radix-ui/react-* imports, adopt bedrock, or move a shadcn/ui project onto native platform primitives. Also use when asked why a bedrock trigger throws, why a dialog no longer closes on backdrop click, or why data-state selectors stopped matching.
---

# Migrating from Radix to bedrock

bedrock is Radix-**shaped**: same compound components, same part names, same
`asChild`. It is built on the top layer, invoker commands, anchor positioning
and native form controls instead of on JavaScript that reimplements them.

That means most of a migration is mechanical, and the parts that are not are
concentrated in four places. Do the mechanical work first; the four judgement
calls are what the user needs to actually decide.

**Before touching anything, read `docs/gaps.md` in the bedrock repo or at
<https://bedrock.sams.land/gaps.html> and tell the user what applies to them.**
Three of the items there stop migrations dead, and finding that out after a
half-finished refactor is worse than finding out first.

## Step 0 — establish whether this is viable

Check these before writing any code. Report what you find; do not decide alone.

| check | how | if yes |
| --- | --- | --- |
| jsdom component tests that click a trigger | `rg -l 'render\(' --glob '*.test.*'` and look for dialog/menu interaction | **This is the big one.** jsdom has no invoker commands, so those clicks do nothing. Every such test needs rewriting against a real browser. Say so before anything else. |
| triggers that are not `<button>` | `rg -B2 'Trigger asChild' -A3` | Each one is a build error at mount, not a warning. Router `<Link>` inside a `Dialog.Trigger` is the most common. |
| `data-state` in CSS, Tailwind config, or shared utilities | `rg 'data-state' --glob '!node_modules'` | Repo-wide selector change. `:open` cannot select an ancestor. |
| overlays with content in them | `rg -A5 'Dialog.Overlay\|AlertDialog.Overlay'` | `::backdrop` is a pseudo-element. A spinner or close button inside the overlay is a redesign. |

If the project has hundreds of jsdom component tests and no Playwright setup,
that cost dwarfs everything else. Say that plainly rather than starting.

## Step 1 — mechanical changes

Safe to apply across the repo.

```diff
-import * as Dialog from '@radix-ui/react-dialog'
+import { Dialog } from '@apostel/bedrock'
```

Then, inside the tree:

| Radix | bedrock | why |
| --- | --- | --- |
| `<X.Portal>` | delete the wrapper, keep its children | The top layer means there is nothing to portal past. |
| `<X.Overlay className="…" />` | delete it; move the classes to `backdrop:` on Content | The overlay is `::backdrop`. |
| `[data-state="open"]` | `:open` | Native state, no JS mirror. |
| `[data-state="closed"]` | `:not(:open)` | |
| `[data-state="checked"]` | `:checked` | |
| `[data-state="on"]` | `[aria-pressed="true"]` | Toggle and ToggleGroup. |
| `forceMount` | delete it | Content unmounts when closed and there is no opt-out. Check what depended on it. |
| `data-[state=open]:animate-in` | `open:` + `starting:` + `transition-discrete` | Tailwind 4 has all three built in. |

For animation, the shape is always the same:

```tsx
className="
  scale-95 opacity-0 transition-all transition-discrete duration-150
  open:scale-100 open:opacity-100
  starting:open:scale-95 starting:open:opacity-0
"
```

`transition-discrete` is what keeps the element displayed while it fades out;
without it the exit is skipped. On a top-layer element also transition
`overlay`, or the exit plays *underneath* whatever was above it.

## Step 2 — the four judgement calls

Do not resolve these silently. Each one changes behaviour a user will notice.

### Triggers must be buttons

Radix attaches a click handler to whatever you give it. bedrock does not, and
throws at mount in development.

```diff
-<Dialog.Trigger asChild><Link href="/upgrade">Upgrade</Link></Dialog.Trigger>
+<Dialog.Trigger asChild><button type="button" onClick={…}>Upgrade</button></Dialog.Trigger>
```

The second most common failure is subtler: a `<button>` inside a `<form>`
defaults to `type="submit"`, and the browser ignores `commandfor` on a submit
button. Add `type="button"`.

If the element genuinely cannot change — a third-party component that renders a
`div` — `useDialogTrigger()` hands over the props and the accessibility
responsibility. Use it as a last resort and say so in a comment.

### Light dismiss is gone

A modal `<dialog>` does not close on a backdrop click. Users report this as "the
dialog is stuck". Restore it per dialog if the product wants it:

```tsx
<Dialog.Content {...{ closedby: 'any' }} />
```

Ask before applying it globally — for a destructive confirmation, *not*
dismissing on an outside click is usually the better behaviour.

### `onOpenChange` on the default root cannot refuse

It is a `toggle` listener: it reports, it cannot decline.

Grep for handlers that conditionally avoid calling `setOpen` — an
unsaved-changes guard, a "are you sure" interstitial. Those roots, and only
those, move to the controlled import:

```diff
-import { Dialog } from '@apostel/bedrock'
+import { Dialog } from '@apostel/bedrock/controlled'
```

Everything else keeps the smaller bundle. A handler that just resets a form or
fires analytics is served by the default root.

The controlled import buys a veto only where the element gives the platform a
cancelable hook. Collapsible and Accordion are `<details>`, which gives none, so
a guard there has to be `preventDefault()` on the Trigger's click instead — the
toggle is that click's default action. Flag it rather than swapping the import
and assuming it holds.

### Closed content is unmounted

This is usually a *win* — a form inside a dialog resets itself, and any
`onOpenChange` handler that existed only to reset state can be deleted. Look for
those and remove them; that is the cleanup the migration pays for.

It bites in two places: content that was measured while closed, and an
animation library driving presence. Both need the state hoisting above the
dialog.

## Step 3 — per-primitive notes

Only what actually differs. Everything not listed is a straight swap.

- **Accordion, Collapsible** — `<details>`. For Accordion, `type="single"` is
  `<details name>`, so an open item can always be closed; Radix's
  `collapsible={false}` has no equivalent, and `Header` renders the `<summary>`
  with `Trigger` inside it. Neither can refuse a toggle, under either import:
  see above.
- **Checkbox, Switch, RadioGroup, Slider, Progress** — real elements, so
  `Indicator`, `Thumb`, `Track` and `Range` render nothing. Their styles move to
  `::before`, `::-webkit-slider-thumb`, `::-webkit-progress-value`. Watch for
  icon *components* inside those parts: an `<input>` has no children, so a
  `<CheckIcon />` inside a checkbox has nowhere to go and becomes CSS.
- **Slider** — one thumb. A two-thumb range has no native equivalent; flag it.
- **Select** — a real `<select>`. `Select.Value` is `<selectedcontent>`, so
  there is no `placeholder` render prop. On phones this gets the OS picker,
  which is usually desirable and occasionally a design regression.
- **Tabs** — the unselected panel is unmounted rather than hidden.
- **Tooltip / HoverCard** — no `Provider`; the delay is a prop on the root. The
  trigger may be an `<a>`.
- **Menus** — submenus need no configuration, and Escape closes only the topmost
  layer. If the code has layer-ordering workarounds, delete them.
- **NavigationMenu** — `Viewport` renders nothing.

## Step 4 — verify

1. `npx tsc --noEmit` — the prop-level differences surface here.
2. Run the app and open every migrated overlay **in a browser**. The dev throw
   for a bad trigger only fires when the component actually mounts, so a trigger
   behind a rare branch will not appear until it renders.
3. Check the console for bedrock warnings: they name the pseudo-element to
   style instead of the part that now renders nothing.
4. If the project has jsdom tests for these components, they are now testing
   nothing. Either port them to Playwright or delete them — leaving them green
   and meaningless is the worst outcome.

## shadcn/ui projects

There is a registry, so most components are one command rather than a rewrite:

```bash
npx shadcn@latest add https://bedrock.sams.land/r/dialog.json
```

24 items cover everything that was Radix-backed except `menubar`,
`navigation-menu`, `toast`, `sheet` and `drawer`. Commit before running it — the
CLI overwrites `components/ui/*.tsx`, and the diff is the thing worth reading.

Note that `dialog` from the registry is the **uncontrolled** build and has no
`open` prop; it throws in development telling you to install
`dialog-controlled` instead. Install whichever the app actually uses.

## What to tell the user at the end

- which files changed, and which of the four judgement calls you applied
- any trigger you could not fix without changing an element they own
- whether their tests still test anything
- the measured bundle difference, if they care: it is in the bedrock README per
  primitive, and it is not uniform — menus save far less than dialogs do
