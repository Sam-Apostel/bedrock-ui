# Gaps, and reasons not to migrate

Written to be used against the library. If you are evaluating bedrock, this is
the page that matters; everything else in `docs/` assumes you already decided.

## The short version

All 29 primitives exist, so the coverage argument is gone. What is left is
sharper and does not go away with more components: **your existing component
tests stop working**, your CSS conventions change repo-wide, and any trigger
that is not a `<button>` becomes a build error rather than a warning.

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

### 2. The saving is uneven, and the menus barely save anything

Coverage is complete, but the win is not evenly spread:

| group | what replaces the JavaScript |
| --- | --- |
| Progress, Slider, Select, Checkbox, Switch, RadioGroup, Separator, Label, AspectRatio, VisuallyHidden, ScrollArea | the native element. Effectively all of it. |
| Dialog, AlertDialog, Popover, Collapsible, Accordion | the top layer, invoker commands, `<details name>`. Nearly all of it. |
| Tooltip, HoverCard, Avatar, Toggle, Toast | layering and dismissal are native; intent, image fallback and pressed state are not. |
| DropdownMenu, ContextMenu, Menubar, NavigationMenu, Tabs, Toolbar, ToggleGroup | layering is native; roving tabindex, typeahead and pointer anchoring are not, and `roving.ts` ships from either entry point. |

So a menu-heavy application saves far less than the Dialog headline suggests,
and `/controlled` buys almost nothing for that last group. Budget from the table,
not from the 1.42 kB figure.

### 3. Chrome-first is not a formality

The [live compat table](./compat.html) scores 20 of 21 in Chrome 141. Run it in
Safari and Firefox before you commit to anything. Invoker commands and anchor
positioning are the two rows that decide whether you get "works" or "works and
looks right", and neither is universal yet.

`interestfor`, which drives Tooltip and HoverCard triggers, is not standardised
and **is not in Chrome stable either** — it is behind a flag. Those primitives
will ship on a JavaScript fallback as their normal path.

### 4. Closed content is not in the DOM, and there is no `forceMount`

Closed content unmounts, as in Radix — that is what makes closing reset a form
without you wiring anything to `onOpenChange`. What is missing is the opt-out.

Radix has `forceMount` for the cases that need the subtree present while closed:
driving presence from an animation library, measuring content before it opens,
or keeping an iframe or video element alive across a close. bedrock has no
equivalent, so those cases have no answer beyond hoisting the state out of the
dialog.

The `<dialog>` element itself is always rendered — the trigger's `commandfor`
has to resolve to something — so this is about children only.

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

Version `0.0.0`, unpublished, one contributor, no deprecation policy. Several
things on this page are open questions whose answers change public API. If you
adopt now you are the one finding those.

### 12. Some parts render nothing, and that is a redesign not a rename

Every one of these is an element in Radix and a pseudo-element or nothing here:
`Dialog.Overlay`, `Progress.Indicator`, `Checkbox.Indicator`, `Switch.Thumb`,
`RadioGroup.Indicator`, `Slider.Track`/`Range`/`Thumb`,
`ScrollArea.Scrollbar`/`Thumb`, `Select.ItemIndicator`,
`NavigationMenu.Viewport`.

They keep their names so existing markup compiles, and they warn in development
when you pass them a `className`. But if your design puts *content* inside one —
a spinner in the overlay, an icon component in the checkbox tick, a scrollbar
with its own hover animation — there is nowhere for it to go.

## Gaps in what exists today

Ordered by how likely they are to bite.

### Light dismiss is opt-out, not opt-in

`<dialog closedby="any">` gives Radix's behaviour. Exposing it needs a prop
name, and the rule that no public prop may be named after a platform feature
rules out `closedby`. Radix has no equivalent prop to copy, so this is a naming
decision, not an implementation one. Until then: spread the attribute yourself.

### Still no missing-`Title` *warning*

`aria-labelledby` is now only set when a `Title` is actually rendered, so the
reference can no longer dangle. What is still missing is Radix's development
warning telling you that a dialog with no name is probably a mistake rather
than a choice.

### No scroll-lock story at all

Not even a documented recipe beyond the one-liner above, and no decision about
whether the library should offer it. Doing it properly means scrollbar-gutter
compensation, which means measurement, which §2.7 of `AGENTS.md` is hostile to.

### `id` on `Dialog.Content` is not forwarded

The trigger's `commandfor` points at it. It is the one exception to "every part
forwards `id`", and a consumer who passes one gets it silently ignored — no
warning, no error.

### `validate-trigger.ts` overstates one thing

Its error message tells you a non-button trigger costs you "implicit
`aria-expanded`". Measured: a popover invoker gets that from the platform, a
dialog invoker does not — `Dialog.Trigger` writes it by hand. The message is
right for Popover and Tooltip and slightly wrong for the primitive most people
will hit it on.

### The registry is untested

24 items, covering every shadcn component that was Radix-backed. They are
type-checked only as far as being valid TypeScript — nothing installs them into
a real shadcn app and renders them, so a wrong class name or a missing export
would not be caught here.

`menubar`, `navigation-menu`, `toast`, `sheet` and `drawer` are not written yet;
the primitives they need all exist.

### No bundle-size regression check

The 1.42 kB figure is measured by hand in a scratch directory, not asserted in
CI. Nothing stops a future commit from doubling it.

### No visual or cross-browser testing

Playwright runs Chrome only, and asserts behaviour, not appearance. The
transition sequencing that `bedrock.css` demonstrates — the thing most likely to
regress silently — has no test at all.

### Test depth is uneven across the 29

Dialog has Radix's own suite ported plus 20 of its own. Most primitives have
between one and seven specs covering the behaviour that makes them interesting:
enough to catch the design being wrong, not enough to catch every regression.
Menubar, NavigationMenu and ContextMenu are the thinnest.

## Reasons it is still worth doing

Kept short, because the rest of the docs make this case.

- **1.95 kB against 13.7 kB gzipped for Dialog**, 0.84 against 31.5 for Select,
  3.55 against 31.6 for DropdownMenu — measured, per primitive, in the README.
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
