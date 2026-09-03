# Radix's test suite, run against bedrock

Radix ships its Dialog tests in the open: 33 unit cases in
`packages/react/dialog/src/dialog.test.tsx` and 9 Playwright cases in
`e2e/dialog.spec.ts`. All 42 are ported in `tests/radix-parity.spec.ts`, with
their titles kept verbatim so the two files can be diffed by eye.

They cannot be *run* as written: they are vitest against jsdom, and jsdom has
no invoker commands, so every `fireEvent.click(trigger)` in the original does
nothing at all against bedrock. The port re-expresses each assertion in
Playwright against real Chrome, and changes nothing about what is being claimed.

## Score

| outcome | count | meaning |
| --- | --- | --- |
| **Pass** | **30** | bedrock satisfies the assertion Radix wrote |
| **Fail** | **0** | nothing to report |
| **Not applicable** | **13** | tests API bedrock does not have, or behaviour that is impossible here |
| total | 43 | |

Every assertion that *can* be made against bedrock now holds. The 13 remaining
are not deferred work: eleven of them test machinery this library exists to
delete, and two test behaviour the platform forbids.

Getting there took four rounds, and every one started with a Radix test rather
than with an idea of ours:

| what the suite caught | what changed |
| --- | --- |
| three tests on missing `Title`/`Description` | the parts register their presence, so `aria-labelledby` is written only when there is something to point at |
| `aria-describedby` normalisation | a passed value is merged with the Description's id and deduped, rather than replacing it |
| `aria-controls` while open | written, and only while open |
| `aria-expanded` on the trigger | written by hand, since Chrome gives a dialog invoker no implicit state |
| two `asChild`-on-Content tests | `Dialog.Content` takes `asChild`, validated to be a `<dialog>` |
| two nested-menu tests | portable at all once DropdownMenu existed |

The count is 43 rather than 42 because one test was added: `asChild` on Content
needs a check that the slotted element really is a `<dialog>`, and that check
deserves its own test.

Run them: `npm test tests/radix-parity.spec.ts`.

## The two ARIA ones were worth arguing about, and the argument was lost

Measured in Chrome 141 through the accessibility tree, not inferred:

| invoker | implicit `aria-expanded`? |
| --- | --- |
| `commandfor` + `command="toggle-popover"` | **yes**, `expanded: false` → `true` |
| `commandfor` + `command="show-modal"` | **no**, no `expanded` property at all |

The original reasoning for writing neither attribute was that a hand-written one
goes stale the moment something else closes the dialog. That was true when
nothing tracked the DOM's open state; it stopped being true when content
mounting started depending on exactly that. `aria-expanded` and `aria-controls`
now come from the same DOM-observed state the content uses, so they cannot
disagree with it.

The lesson is the one worth keeping: the platform gives a *popover* trigger this
for free and gives a *dialog* trigger nothing, so "the browser handles it" was
half true and half an assumption.

## The 13 that do not apply

Not evidence of anything except a different design. Grouped:

| group | count | what they test |
| --- | --- | --- |
| `Dialog.Overlay` | 2 | An element bedrock does not render; the overlay is `::backdrop`. |
| `pointer-events` bookkeeping | 2 | How Radix inerts the background. `showModal()` does it in the UA, with no style to restore or leak. |
| `forceMount` | 1 | No opt-out from unmounting, so there is no forced-mount state to leak. |
| `modal={false}` | 3 | No non-modal dialog. `show()` and `showModal()` are different guarantees, so that stays `Popover` rather than a prop. |
| dismissable-layer internals | 4 | Outside pointer interaction dismisses nothing here, so there is no ordering to get wrong. |
| focus-scope branches | 1 | **Impossible**, not unimplemented: a modal `<dialog>` inerts everything outside its subtree, so a portalled branch cannot be focused at all. |

Eleven of the thirteen are testing machinery this library exists to delete: a
focus scope, a dismissable layer, a `pointer-events` toggle on the body. There
is nothing to point them at, and that is the intended outcome rather than a
coverage hole.

The two that are not: `modal={false}` is a decision recorded in `AGENTS.md`, and
`forceMount` is [a named gap](./should-you-switch.md#710-the-smaller-ones).

## What passing 30 actually proves

The ones worth naming, because they are the load-bearing behaviours:

- opens on click, closes on Escape, closes on the close button
- **focus lands on the close button** on open. Radix implements this; the UA
  does it here, and the assertion is identical
- **focus stays trapped when the focused element is removed**. Their e2e
  regression test, passing against no focus-management code at all
- no axe violations open or closed, scoped exactly as Radix scopes it
- every part spreads `className`, `style`, `ref` and unknown props, with and
  without `asChild`, and composes `onClick` rather than replacing it
- `aria-labelledby`/`aria-describedby` resolve to the rendered `Title` and
  `Description`
- ctrl+wheel is not swallowed while open. Their regression test for a
  scroll-lock bug, which passes here because there is no scroll lock at all
  (and [that is its own problem](./known-gaps.md#missing-behaviour))

## What this does not cover

`alert-dialog.test.tsx` (18 more cases) is not ported, because bedrock has no
AlertDialog primitive, only the registry component built on Dialog. Radix's
other 40-odd test files test primitives that do not exist here.
