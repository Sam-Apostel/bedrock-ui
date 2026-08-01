# Gaps, and reasons not to migrate

Written to be used against the library. If you are evaluating bedrock, this is
the page that matters; everything else in `docs/` assumes you already decided.

## The short version

One primitive of roughly thirty exists. The bundle win is real and large for
that one primitive. The costs land on your tests, your CSS conventions, and any
trigger that is not a `<button>` — and those costs are paid up front, on day
one, for a benefit that only completes when the last Radix import is gone.

## Reasons not to migrate

### 1. Your component tests stop working

This is the biggest one, and it is rarely the one people check first.

jsdom implements neither the top layer, nor invoker commands, nor anchor
positioning. A React Testing Library test that clicks a trigger and asserts the
dialog is visible **will fail**, because in jsdom the click does nothing at all
— there is no handler behind it, by design. There is no shim to install; the
behaviour under test is the parser's.

Every dialog test in your suite gets rewritten against a real browser. If you
have hundreds of component tests and no Playwright setup, that cost dwarfs
every saving on this page.

### 2. Coverage is one primitive

`Dialog`. That is the list. Radix stays in your `package.json` for
`DropdownMenu`, `Select`, `Tabs`, `Tooltip`, `Popover`, `Accordion`, `Checkbox`
and the rest, which means:

- you ship both libraries, so the bundle *grows* until the migration completes
- your team learns two idioms for the same concept — `:open` here,
  `data-state` there
- the primitives most likely to dominate your bundle (menus, select) are the
  ones where bedrock's own build order admits the saving is small, because
  roving tabindex, typeahead and pointer-anchored positioning have no native
  equivalent

A Dialog-only migration is safe to do and hard to justify on bundle size alone.

### 3. Chrome-first is not a formality

The [live compat table](./compat.html) scores 20 of 21 in Chrome 141. Run it in
Safari and Firefox before you commit to anything. Invoker commands and anchor
positioning are the two rows that decide whether you get "works" or "works and
looks right", and neither is universal yet.

`interestfor`, which drives Tooltip and HoverCard triggers, is not standardised
and **is not in Chrome stable either** — it is behind a flag. Those primitives
will ship on a JavaScript fallback as their normal path.

### 4. Content is always mounted

Radix unmounts closed content by default. A `<dialog>` is in the DOM, hidden by
the UA stylesheet, from the first paint.

So the children of every closed dialog on the page run their effects, subscribe
to their stores, and fire their mount-time fetches — at page load, for every
dialog, whether or not anyone opens one. A route with eight dialogs each
containing a form that loads its options on mount goes from zero requests to
eight.

The fix is to mount the body yourself off `onOpenChange`, which is exactly the
state-driven code the library is trying to delete. There is no `forceMount`
because there is nothing to force; there is also no lazy mode.

### 5. No scroll lock

Measured, Chrome 141: with a modal `<dialog>` open, the page behind it still
scrolls on wheel. `showModal()` makes the background inert to *interaction*, not
to scrolling — Radix ships `react-remove-scroll` for precisely this, and that is
part of the 13.7 kB you are removing.

You get it back with one CSS rule (`html:has(dialog:open) { overflow: hidden }`)
and the layout-shift bug that comes with it. Nothing in bedrock does it for you.

### 6. No light dismiss

Radix closes on a backdrop click. A modal `<dialog>` does not. Users notice this
one, and support tickets will describe it as "the dialog is stuck".

`closedby="any"` restores it and is not yet a prop — see below.

### 7. The trigger must be a `<button>`, and it throws

Not a warning. A throw, at mount, in development.

The pattern that breaks most often in a real codebase is not a `div` — it is a
router link:

```tsx
<Dialog.Trigger asChild>
  <Link href="/upgrade">Upgrade</Link>   {/* renders <a> — throws */}
</Dialog.Trigger>
```

and the second most common is a submit-typed button inside a form, which Radix
silently made work and the platform silently ignores.

`useDialogTrigger()` is the escape hatch, and it hands you the accessibility
problem along with the props. If your design system wraps every button in a
component that renders a `div` for styling reasons, budget for that refactor
before anything else.

### 8. `data-state` is gone, and `:open` cannot select an ancestor

`[data-state="open"]` → `:open` is a mechanical find-and-replace *until* the
selector targeted a parent:

```css
/* Radix */
.card:has([data-state="open"]) { … }   /* or a wrapper with its own data-state */
/* bedrock */
.card:has(dialog:open) { … }           /* :has() or nothing */
```

Shared utilities, design-system mixins and Tailwind plugins built around
`data-state` all need rewriting, and the two conventions coexist badly while
both libraries are installed.

### 9. The backdrop is not a node

`::backdrop` cannot take a `className`, cannot contain a spinner or a close
button, cannot be a click target you attach a handler to, and cannot be animated
by a JavaScript animation library. If your overlay has content in it, this is a
redesign, not a migration.

### 10. Interception hooks do not exist

`onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`,
`onOpenAutoFocus`, `onCloseAutoFocus`, `modal={false}`, `forceMount`,
`Portal container` — none of these have equivalents. Most have a platform answer
(`autofocus`, `cancel`, `closedby`), but "most" is not "all", and the ones
without an answer are unavailable rather than inconvenient.

### 11. It is pre-alpha, and the surface will move

Version `0.0.0`, unpublished, one contributor, no deprecation policy. Three
things on this page are open questions whose answers change public API. If you
adopt now you are the one finding those.

## Gaps in what exists today

Ordered by how likely they are to bite.

### `Dialog.Content` has no `asChild`

Every other part has it. Content does not, because a Slot child that is not a
`<dialog>` breaks `showModal()` silently and there is no validator for content
the way there is for triggers. **Decision needed:** add it with a tag check, or
document the divergence permanently.

### Light dismiss is opt-out, not opt-in

`<dialog closedby="any">` gives Radix's behaviour. Exposing it needs a prop
name, and the rule that no public prop may be named after a platform feature
rules out `closedby`. Radix has no equivalent prop to copy, so this is a naming
decision, not an implementation one. Until then: spread the attribute yourself.

### No missing-`Title` warning

Caught three separate times by
[Radix's own test suite](./radix-parity.md), which is what promoted it to the
top of this list.

`aria-labelledby` is wired unconditionally from a derived id. Omit
`Dialog.Title` and it points at nothing, so the dialog has no accessible name
and nothing says so. Radix warns. Detecting presence needs the title to register
itself, which means adding a field to the context both roots publish.

### No scroll-lock story at all

Not even a documented recipe beyond the one-liner above, and no decision about
whether the library should offer it. Doing it properly means scrollbar-gutter
compensation, which means measurement, which §2.7 of `AGENTS.md` is hostile to.

### `id` on `Dialog.Content` is not forwarded

The trigger's `commandfor` points at it. It is the one exception to "every part
forwards `id`", and a consumer who passes one gets it silently ignored — no
warning, no error.

### The registry covers two components

`dialog` and `alert-dialog`. Everything else in shadcn/ui stays on Radix, and
the registry says so per component rather than pretending otherwise.

### No bundle-size regression check

The 1.42 kB figure is measured by hand in a scratch directory, not asserted in
CI. Nothing stops a future commit from doubling it.

### `Dialog.Trigger` has no `aria-expanded`

Measured in Chrome 141: a `commandfor` button targeting a **popover** gets
implicit `aria-expanded` from the platform; one targeting a **dialog** with
`show-modal` gets nothing. So the trigger exposes no expanded state at all,
Radix's does, and `validate-trigger.ts`'s error message promises an implicit
attribute that the dialog case does not actually provide.

### No visual or cross-browser testing

Playwright runs Chrome only, and asserts behaviour, not appearance. The
transition sequencing that `bedrock.css` demonstrates — the thing most likely to
regress silently — has no test at all.

## Reasons it is still worth doing

Kept short, because the rest of the docs make this case.

- **1.42 kB against 13.7 kB, gzipped**, for the same Dialog surface.
- The failure modes it deletes are the ones that recur forever: z-index fights,
  clipped overlays, focus escaping a trap, a portal in the wrong container, a
  positioning recalculation on every scroll frame.
- It works before hydration and survives a bundle that fails to load, which no
  JavaScript-based implementation can offer at any size.
- The accessibility you get is the browser's, not a reimplementation of it that
  has to be maintained against every AT update.

If you are starting a new app, targeting evergreen Chrome, and you write your
tests in Playwright already, the calculation is easy. If you have a mature Radix
codebase with a jsdom suite, it is not close yet — and "yet" is doing real work
in that sentence, because most of what is missing is coverage, not design.
