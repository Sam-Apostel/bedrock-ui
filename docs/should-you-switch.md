# Should you switch?

Written to be used against the library. If you are evaluating rather than
using, this is the page that matters; the rest of `docs/` assumes you already
decided.

## The short version

All 29 primitives exist and Radix's own Dialog suite passes, so the arguments
about coverage and correctness are largely settled. What is left is not:

| The three that matter | |
| --- | --- |
| **Your component tests stop working** | The single biggest cost, and rarely what anyone checks first. jsdom implements none of the platform features this is built on. |
| **The saving is uneven** | A dialog-heavy app saves a lot. A menu-heavy app saves much less: roving focus and typeahead have no native equivalent and ship either way. |
| **Some things became CSS that used to be React** | Overlays, checkbox ticks, slider thumbs and scrollbars are pseudo-elements here. If your design puts content inside one, that is a redesign rather than a migration. |

Everything below expands on those three, then lists what is missing or thin in
what exists today.

---

## Reasons not to migrate

Ten of them, worst first. Scan the table, then read the ones that apply to you.

| # | Reason | Hits hardest if |
| --- | --- | --- |
| 1 | [Your component tests stop working](#1-your-component-tests-stop-working) | You have a large jsdom suite and no Playwright |
| 2 | [Chrome-first is not a formality](#2-chrome-first-is-not-a-formality) | You support Safari or Firefox today |
| 3 | [The saving is uneven](#3-the-saving-is-uneven-and-menus-barely-save-anything) | Your app is menu-heavy rather than dialog-heavy |
| 4 | [The trigger must be a `<button>`](#4-the-trigger-must-be-a-button-and-it-throws) | Your design system wraps buttons, or you use router links as triggers |
| 5 | [`data-state` is gone](#5-data-state-is-gone-and-open-cannot-select-an-ancestor) | You have shared CSS, mixins or Tailwind plugins keyed on it |
| 6 | [Several parts render nothing](#6-several-parts-render-nothing-and-that-is-a-redesign-not-a-rename) | Your design puts content inside an overlay, tick, thumb or scrollbar |
| 7 | [No light dismiss by default](#710-the-smaller-ones) | Your users expect a backdrop click to close |
| 8 | [No `forceMount`](#710-the-smaller-ones) | You animate presence with a library, or measure before opening |
| 9 | [Interception hooks do not exist](#710-the-smaller-ones) | You rely on `onInteractOutside` and friends |
| 10 | [It is young](#710-the-smaller-ones) | You need a deprecation policy and more than one contributor |

### 1. Your component tests stop working

jsdom implements neither the top layer, nor invoker commands, nor anchor
positioning. A React Testing Library test that clicks a trigger and asserts the
dialog is visible **will fail** — in jsdom the click does nothing at all,
because there is no handler behind it by design. There is no shim to install;
the behaviour under test belongs to the parser.

```tsx
// Passes against Radix. Fails against bedrock, in jsdom, forever.
render(<Dialog.Root>…</Dialog.Root>)
await user.click(screen.getByRole('button', { name: 'Delete' }))
expect(screen.getByRole('dialog')).toBeVisible()   // the click did nothing
```

Every dialog, menu, popover and tooltip test in your suite gets rewritten
against a real browser. If you have hundreds of them and no Playwright setup,
that cost dwarfs everything else on this page, and it lands before any of the
benefits do.

### 2. Chrome-first is not a formality

The [support matrix](./compat.md) gives the minimum version of each engine per
feature, and measures your own browser as you read it. Check it against the
browsers you actually support before committing to anything. Invoker commands and anchor
positioning are the two rows that decide whether you get "works" or "works and
looks right".

`interestfor`, which would drive Tooltip and HoverCard, is not standardised and
is **in Chrome only**. Those two ship on a JavaScript fallback as their normal
path, not as a contingency.

### 3. The saving is uneven, and menus barely save anything

| group | what replaces the JavaScript | gzipped, Radix → bedrock |
| --- | --- | --- |
| Select, Slider, Checkbox, Switch, RadioGroup, Progress, Separator, Label, AspectRatio, VisuallyHidden, ScrollArea | the native element, effectively all of it | Select 31.5 → 0.84 kB |
| Dialog, AlertDialog, Popover, Collapsible, Accordion | top layer, invoker commands, `<details name>` | Dialog 13.7 → 1.95 kB |
| Tooltip, HoverCard, Avatar, Toggle, Toast | layering and dismissal, but not intent or image fallback | Tooltip 19.3 → 2.55 kB |
| DropdownMenu, ContextMenu, Menubar, NavigationMenu, Tabs, Toolbar, ToggleGroup | layering only — `roving.ts` ships from either entry point | DropdownMenu 31.6 → 3.55 kB |

The ratios are real but not uniform, and `/controlled` buys almost nothing for
that last group. Budget from this table rather than from the Dialog headline.

### 4. The trigger must be a `<button>`, and it throws

Not a warning. A throw, at mount, in development.

The pattern that breaks most often is not a `div` — it is a router link:

```tsx
<Dialog.Trigger asChild>
  <Link href="/upgrade">Upgrade</Link>   {/* renders <a> — throws */}
</Dialog.Trigger>
```

and the second most common is a `<button>` inside a `<form>` without
`type="button"`, which Radix silently made work and the platform silently
ignores.

`useDialogTrigger()` is the escape hatch and hands you the accessibility problem
along with the props. If your design system wraps every button in a component
that renders a `div`, budget for that refactor before anything else.

### 5. `data-state` is gone, and `:open` cannot select an ancestor

`[data-state="open"]` → `:open` is a find-and-replace *until* the selector
targeted a parent:

```css
/* Radix */   .card:has([data-state="open"]) { … }
/* bedrock */ .card:has(dialog:open) { … }        /* :has() or nothing */
```

Shared utilities, design-system mixins and Tailwind plugins built around
`data-state` all need rewriting, and the two conventions coexist badly while
both libraries are installed.

### 6. Several parts render nothing, and that is a redesign not a rename

Each of these is an element in Radix and a pseudo-element or nothing here:

- `Dialog.Overlay` — the backdrop is `::backdrop`
- `Progress.Indicator` — `<progress>` has no children
- `Checkbox.Indicator`, `Switch.Thumb`, `RadioGroup.Indicator` — an `<input>` has none either
- `Slider.Track`, `Range`, `Thumb` — nor does `<input type="range">`
- `ScrollArea.Scrollbar`, `Thumb`, `Corner` — the scrollbar is the UA's
- `Select.ItemIndicator` — style `option::checkmark`
- `NavigationMenu.Viewport` — each content is anchored to its own item

They keep their names so existing markup compiles, and they warn in development
when handed a `className`. But an `<input>` cannot have children, so a
`<CheckIcon />` inside a checkbox has nowhere to go — it becomes a masked
`::before`. A spinner in an overlay, a scrollbar with its own hover animation,
an icon component in a slider thumb: all redesigns.

### 7–10. The smaller ones

Real, but none of them is likely to decide the question on its own.

| # | Reason | What it costs | Workaround |
| --- | --- | --- | --- |
| 7 | No light dismiss by default | A modal `<dialog>` does not close on a backdrop click. Users report this as "the dialog is stuck". | `closedby="any"` restores it per dialog. There is no prop yet — the rule against platform names in the public API rules out `closedby`, and Radix has no name to copy. |
| 8 | No `forceMount` | Closed content unmounts, as in Radix, but there is no opt-out for the cases that need the subtree alive while closed: an animation library driving presence, measuring before opening, keeping a video or iframe loaded. | Hoist that state above the component. |
| 9 | Interception hooks do not exist | `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`, `onOpenAutoFocus`, `onCloseAutoFocus`, `modal={false}`, `Portal container`. | Most have a platform answer — `autofocus`, `cancel`, `closedby`. "Most" is not "all", and the rest are unavailable rather than inconvenient. |
| 10 | It is young | `0.1.0`, one contributor, no deprecation policy. Several questions on this page have answers that would change public API. | Adopting now means being the one who finds them. |

---

## Reasons it is still worth doing

Kept short, because the rest of the docs make this case.

- **Measured, per primitive**: Select 0.84 kB against 31.5, Dialog 1.95 against
  13.7, DropdownMenu 3.55 against 31.6.
- The failure modes it deletes are the ones that recur forever: z-index fights,
  clipped overlays, focus escaping a trap, a portal in the wrong container, a
  positioning recalculation on every scroll frame.
- It works before hydration and survives a bundle that never loads, which no
  JavaScript implementation can offer at any size.
- The accessibility is the browser's, not a reimplementation of it that has to
  be maintained against every AT update — and [Radix's own
  suite](./radix-parity.md) says so rather than us.

If you are starting a new app, targeting evergreen Chrome, and already write
Playwright tests, this is an easy call. If you have a mature Radix codebase with
a jsdom suite, the honest answer is that the cost is front-loaded and lands
mostly on your tests.

What is missing or thin in what exists today is a separate list:
[known gaps](./known-gaps.md).
