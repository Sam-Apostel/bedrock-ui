# Radix's test suite, run against bedrock

Radix ships its Dialog tests in the open: 33 unit cases in
`packages/react/dialog/src/dialog.test.tsx` and 9 Playwright cases in
`e2e/dialog.spec.ts`. All 42 are ported in `tests/radix-parity.spec.ts`, with
their titles kept verbatim so the two files can be diffed by eye.

They cannot be *run* as written — they are vitest against jsdom, and jsdom has
no invoker commands, so every `fireEvent.click(trigger)` in the original does
nothing at all against bedrock. The port re-expresses each assertion in
Playwright against real Chrome, and changes nothing about what is being claimed.

## Score

| outcome | count | meaning |
| --- | --- | --- |
| **Pass** | **22** | bedrock satisfies the assertion Radix wrote |
| **Fail** | **3** | a real behavioural divergence |
| **Not applicable** | **17** | tests API bedrock does not have |
| total | 42 | |

A skip is not a pass. Of the 42, 25 are answerable at all, and bedrock answers
22 of those the same way Radix does.

Three of those 22 were failures until the suite pointed at them: `Title` and
`Description` now register their presence, so `aria-labelledby` is written only
when there is something to point at. Radix's tests found that, not ours.

Run them: `npm test tests/radix-parity.spec.ts`.

## The 3 failures

| Radix test | why it fails |
| --- | --- |
| `should normalize existing aria-describedby ids and append the Description id` | A passed `aria-describedby` replaces ours instead of merging. Radix collects and dedupes; bedrock treats the prop as final. |
| `aria-controls should reference the rendered content while open` | The relationship is `commandfor`, resolved by the browser. No `aria-controls` is written. |
| `Dialog.Trigger forwards props when asChild is set` | Passes on class, style, ref and tag; fails on one assertion — `aria-expanded="false"`. |

### The last two are worth arguing about

Measured in Chrome 141 through the accessibility tree, not inferred:

| invoker | implicit `aria-expanded`? |
| --- | --- |
| `commandfor` + `command="toggle-popover"` | **yes** — `expanded: false` → `true` |
| `commandfor` + `command="show-modal"` | **no** — no `expanded` property at all |

So the platform gives a popover trigger the state for free and gives a dialog
trigger nothing. That makes `Dialog.Trigger`'s missing `aria-expanded` a genuine
gap rather than a difference of mechanism, and it means
`validate-trigger.ts`'s error message — which promises implicit `aria-expanded`
— is right for the primitives that are coming and overstated for the one that
exists.

`aria-controls` is the weaker complaint of the two: it is advisory, support
across screen readers is patchy, and the invoker relationship is in the DOM
either way.

## The 17 that do not apply

Not evidence of anything except a different design. Grouped:

| group | count | what they test |
| --- | --- | --- |
| `Dialog.Overlay` | 2 | An element bedrock does not render — the overlay is `::backdrop`. |
| `asChild` on `Content` | 5 | Unsupported, and the focus-scope-branch test needs Radix-internal API. |
| `pointer-events` bookkeeping | 2 | How Radix inerts the background. `showModal()` does it in the UA, with no style to restore or leak. |
| `forceMount` | 1 | No opt-out from unmounting, so there is no forced-mount state to leak. |
| `modal={false}` | 3 | No non-modal dialog; that will be `Popover`. |
| nested `DropdownMenu` / dismissable layers | 4 | Needs a second primitive, and nothing dismisses on outside interaction. |

Three of those groups are testing the machinery bedrock exists to delete: a
focus scope, a dismissable layer, and a `pointer-events` toggle on the body.
There is no bedrock equivalent to point them at, and that is the intended
outcome rather than a coverage hole.

## What passing 22 actually proves

The ones worth naming, because they are the load-bearing behaviours:

- opens on click, closes on Escape, closes on the close button
- **focus lands on the close button** on open — Radix implements this; the UA
  does it here, and the assertion is identical
- **focus stays trapped when the focused element is removed** — their e2e
  regression test, passing against no focus-management code at all
- no axe violations open or closed, scoped exactly as Radix scopes it
- every part spreads `className`, `style`, `ref` and unknown props, with and
  without `asChild`, and composes `onClick` rather than replacing it
- `aria-labelledby`/`aria-describedby` resolve to the rendered `Title` and
  `Description`
- ctrl+wheel is not swallowed while open — their regression test for a
  scroll-lock bug, which passes here because there is no scroll lock at all
  (and [that is its own problem](./gaps.md#5-no-scroll-lock))

## What this does not cover

`alert-dialog.test.tsx` (18 more cases) is not ported — bedrock has no
AlertDialog primitive, only the registry component built on Dialog. Radix's
other 40-odd test files test primitives that do not exist here.
