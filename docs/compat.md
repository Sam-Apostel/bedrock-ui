# Browser support

**Open [`compat.html`](./compat.html) in the browser you care about.** It runs a
real feature detection for every platform feature bedrock depends on and tells
you what each missing one does to your UI. This page is the summary; that page
is the answer.

## The stance

Latest Chrome, deliberately, for now. Not because other engines are unimportant
but because the features are landing in a sequence, and pretending otherwise in
a support table would be worse than saying so.

Two things follow from that, and they are what make the position defensible:

1. **No platform feature name appears in a public prop.** `Tooltip.Root` takes
   `delayDuration`. Today that becomes `interest-show-delay`; if `interestfor`
   never standardises it becomes a timer. Your code does not change either way.
2. **Every non-Baseline CSS block sits behind `@supports`**, and feature
   detection lives in one module. Nothing throws on a browser that lacks a
   feature; it renders a documented downgrade.

## What "degrades" actually means

Two rows in the live table are load-bearing, and everything else is polish:

| tier | features | what happens without them |
| --- | --- | --- |
| **Required** | `<dialog>`, invoker commands, Popover API | Triggers do nothing, or overlays get clipped by ancestor overflow. There is no JavaScript fallback, by design. |
| **Visual** | `@starting-style`, `allow-discrete`, `transition: overlay`, `interpolate-size`, `calc-size()`, `::scroll-marker`, `::scroll-button()` | Transitions are skipped or jump. Nothing becomes unusable or inaccessible. |
| **Behavioural** | anchor positioning, `position-area`, `position-try`, `closedby`, `popover=hint`, `<details name>` | Placement, light dismiss, or single-open exclusivity are lost. The component still opens, closes, traps focus and is announced correctly. |
| **Replaceable** | `interestfor` | A JavaScript timer fallback ships instead. Same behaviour, bigger bundle. |

Accessibility never lands in the degradation column. Focus trapping, dismissal,
naming and keyboard operation come from `<dialog>`, the popover stack and native
buttons — the parts that shipped everywhere years ago.

## Measured, Chrome 141

The live table scores 20 of 21 here. The single miss is `interestfor`, which is
**not standardised and not in Chrome stable** — it is behind a flag. That is
worth stating plainly because the README describes it as driving Tooltip and
HoverCard triggers: those primitives will ship with the JavaScript fallback as
the default path, not as a contingency.

## Other engines

Rather than publish version numbers that go stale, run the live table. What the
shape of the answer will be:

- `<dialog>`, `::backdrop`, `:open` and the Popover API are broadly available,
  so the required tier is in reasonable shape outside Chrome.
- Invoker commands and anchor positioning are the ones to actually check —
  they are the difference between "works" and "works and looks right".
- `@starting-style` and `allow-discrete` travel together in practice; if one is
  missing you lose transitions, not function.
- `appearance: base-select` is the newest and least likely to be present, which
  is why Select is late in the build order.

## Testing

The Playwright suite runs Chrome only, deliberately. A cross-browser matrix
today would report failures that are the documented state of the world rather
than regressions in this library. It widens when the live table says the
features have landed.
