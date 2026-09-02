# Browser support

bedrock targets current browsers on purpose. This page says exactly how current:
the minimum version of each engine for every platform feature the library uses,
what each feature is for, and what happens to your UI when it is missing.

The **Here** column is not a claim. It is measured in the browser you are
reading this in, as you read it.

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

## The matrix

<!-- support-matrix -->

## Testing

The Playwright suite runs Chrome only, deliberately. A cross-browser matrix
today would report failures that are the documented state of the world rather
than regressions in this library. It widens when the live table says the
features have landed.
