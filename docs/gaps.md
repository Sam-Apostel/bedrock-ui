# Gaps, and reasons not to migrate

Written to be used against the library. If you are evaluating rather than
using, this is the page that matters; the rest of `docs/` assumes you already
decided.

## The short version

All 29 primitives exist and Radix's own Dialog suite passes, so the arguments
about coverage and correctness are largely settled. What is left is not:

**Your existing component tests stop working.** That is the single biggest cost
and it is rarely what anyone checks first.

**The saving is uneven.** A dialog-heavy app saves a lot. A menu-heavy app saves
much less, because roving focus and typeahead have no native equivalent and ship
either way.

**Some things become CSS that used to be React.** Overlays, checkbox ticks,
slider thumbs and scrollbars are pseudo-elements here. If your design puts
content inside one, that is a redesign rather than a migration.

Everything below expands on those three, then lists what is missing or thin in
what exists today.

---

## Reasons not to migrate

### 1. Your component tests stop working

jsdom implements neither the top layer, nor invoker commands, nor anchor
positioning. A React Testing Library test that clicks a trigger and asserts the
dialog is visible **will fail** — in jsdom the click does nothing at all,
because there is no handler behind it by design. There is no shim to install;
the behaviour under test belongs to the parser.

Every dialog, menu, popover and tooltip test in your suite gets rewritten
against a real browser. If you have hundreds of them and no Playwright setup,
that cost dwarfs everything else on this page, and it lands before any of the
benefits do.

### 2. Chrome-first is not a formality

The [live compat table](./compat.html) scores 20 of 21 in Chrome 141. Run it in
Safari and Firefox before committing to anything. Invoker commands and anchor
positioning are the two rows that decide whether you get "works" or "works and
looks right".

`interestfor`, which would drive Tooltip and HoverCard, is not standardised and
**not in Chrome stable either**. Those two ship on a JavaScript fallback as
their normal path, not as a contingency.

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

`Dialog.Overlay`, `Progress.Indicator`, `Checkbox.Indicator`, `Switch.Thumb`,
`RadioGroup.Indicator`, `Slider.Track`/`Range`/`Thumb`,
`ScrollArea.Scrollbar`/`Thumb`/`Corner`, `Select.ItemIndicator`,
`NavigationMenu.Viewport`.

They keep their names so existing markup compiles, and they warn in development
when handed a `className`. But an `<input>` cannot have children, so a
`<CheckIcon />` inside a checkbox has nowhere to go — it becomes a masked
`::before`. A spinner in an overlay, a scrollbar with its own hover animation,
an icon component in a slider thumb: all redesigns.

### 7. No light dismiss, unless you ask for it

A modal `<dialog>` does not close on a backdrop click. Users report this as "the
dialog is stuck". `closedby="any"` restores it per dialog; there is no prop for
it yet, because the rule against platform names in the public API rules out
`closedby` and Radix has no name to copy.

### 8. No `forceMount`

Closed content unmounts, as in Radix. What is missing is the opt-out, for the
cases that need the subtree present while closed: an animation library driving
presence, measuring before opening, keeping a video or iframe alive. Those need
the state hoisting above the component.

### 9. Interception hooks do not exist

`onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`,
`onOpenAutoFocus`, `onCloseAutoFocus`, `modal={false}`, `Portal container`.
Most have a platform answer — `autofocus`, `cancel`, `closedby` — but "most" is
not "all", and the rest are unavailable rather than inconvenient.

### 10. It is pre-alpha

Unpublished, one contributor, no deprecation policy. Several questions on this
page have answers that change public API. Adopting now means finding those.

---

## Gaps in what exists

Ordered by how likely they are to bite.

### Only Dialog has an API reference

[`dialog.md`](./dialog.md) documents one primitive of 29. The other 28 have
their props in TypeScript, their behaviour in the tests, and their divergences
in the [migration guide](./migration-from-radix.md#per-primitive-notes) — but no
page you can send someone. This is the largest documentation gap, and it is a
writing job rather than a design one.

### No scroll lock

Measured in Chrome 141: with a modal `<dialog>` open, the page behind it still
scrolls on wheel. `showModal()` makes the background inert to *interaction*, not
to scrolling — `react-remove-scroll` is part of the 13.7 kB you are deleting.

`html:has(dialog:open) { overflow: hidden }` gets it back, along with the
layout-shift bug that comes with it. Nothing here does it for you, and doing it
properly means scrollbar-gutter compensation, which means measurement.

### Slider takes one value

A range input has one thumb. A two-thumb range needs two inputs sharing a track,
which is a different component rather than a prop.

### Toast has no swipe-to-dismiss

A pointer gesture with no native equivalent. Left out rather than
half-implemented.

### Accordion cannot refuse to close

`type="single"` is `<details name>`, and a `<summary>` toggles. Radix's
`collapsible={false}` — where the open item stays open until another is chosen —
has no native equivalent.

### No missing-`Title` warning

`aria-labelledby` is only written when a `Title` is rendered, so the reference
can no longer dangle. What is missing is Radix's development warning telling you
that a dialog with no accessible name is probably an oversight.

### `id` on `Dialog.Content` is not forwarded

The trigger's `commandfor` points at it. It is the one exception to "every part
forwards `id`", and a consumer who passes one gets it silently ignored.

### `validate-trigger.ts` overstates one thing

Its message says a non-button trigger costs you "implicit `aria-expanded`".
Measured: a popover invoker gets that from the platform, a dialog invoker does
not — `Dialog.Trigger` writes it by hand. Right for Popover and Tooltip, wrong
for the primitive most people will hit it on.

### The registry is untested, and five items are missing

24 items cover everything that was Radix-backed except `menubar`,
`navigation-menu`, `toast`, `sheet` and `drawer`. Nothing installs any of them
into a real shadcn app and renders it, so a wrong class name or a missing export
would not be caught here.

### Test depth is uneven

Dialog has Radix's suite ported plus 20 specs of its own. Most primitives have
between one and seven, covering the behaviour that makes them interesting —
enough to catch the design being wrong, not enough to catch every regression.
Menubar, NavigationMenu and ContextMenu are the thinnest.

### No bundle-size or visual regression checks

The per-primitive figures in the README are measured by hand, not asserted in
CI. And Playwright asserts behaviour, never appearance — so the transition
sequencing `bedrock.css` demonstrates, the thing most likely to regress
silently, has no test at all.

### Chrome only, in CI as well as in policy

The suite runs Chrome. A cross-browser matrix today would report failures that
are the documented state of the world rather than regressions — a defensible
reason not to have one, and not a reason to trust the other engines.

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
