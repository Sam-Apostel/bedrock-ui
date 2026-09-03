# Browser support

bedrock targets current browsers on purpose. This page says exactly how
current, twice: once as a thing you can scrub through, and once as a table you
can read a version number out of.

<!-- widget: compat-timeline -->

## What you are looking at

Fifteen live components, and a slider that stops on every date one of the
platform features under them changed state — shipped behind a flag, shipped for
real, reached every engine, or passed the thirty months in every engine that
Baseline calls *widely available*.

| | |
| --- | --- |
| **Greyed out** | A feature it cannot work without is in no engine yet. The tile is `inert`, because a component that could not have been built then should not be operable now. |
| **Plain** | It works, with something missing — placement, a transition, single-open exclusivity. The line under each tile says which, and opens onto the rest. |
| **Outlined** | Everything it uses is in every engine, and has been for long enough that you can stop checking. |

The styling changes with the date because that is the other half of the claim.
Every tile is the same markup at every stop on the timeline; only the
stylesheet moves. If a headless primitive can be Material in 2016 and
brutalist in 2023 without one line of the component changing, "unstyled" means
something more useful than "you get no CSS".

> The track runs a little past today. Those last few stops are arithmetic —
> thirty months from the day the last engine shipped — and each one says so when
> you land on it.

## The stance

Current browsers, deliberately. The floor is set by invoker commands — Chrome
135, Firefox 144, Safari 26.2 — because triggers are `commandfor` with no
JavaScript standing behind them. The timeline puts a date on that: December
2025 is when most of this library became possible at all.

Two things make that defensible rather than merely convenient:

| | |
| --- | --- |
| **No platform feature name appears in a public prop** | `Tooltip.Root` takes `delayDuration`. Today that becomes `interest-show-delay`; if `interestfor` never standardises it becomes a timer. Your code does not change either way. |
| **Every non-Baseline CSS block sits behind `@supports`** | Feature detection lives in one module. Nothing throws on a browser that lacks a feature; it renders a documented downgrade. |

## What "degrades" actually means

Three rows are load-bearing. Everything else is polish:

| tier | features | what happens without them |
| --- | --- | --- |
| **Required** | `<dialog>`, invoker commands, Popover API | Triggers do nothing, or overlays get clipped by ancestor overflow. There is no JavaScript fallback, by design. |
| **Visual** | `@starting-style`, `allow-discrete`, `transition: overlay`, `interpolate-size`, `calc-size()` | Transitions are skipped or jump. Nothing becomes unusable or inaccessible. |
| **Behavioural** | anchor positioning, `position-area`, `position-try`, `closedby`, `popover=hint`, `<details name>` | Placement, light dismiss, or single-open exclusivity are lost. The component still opens, closes, traps focus and is announced correctly. |
| **Replaceable** | `interestfor` | A JavaScript timer fallback ships instead. Same behaviour, bigger bundle. |

Accessibility never lands in the degradation column. Focus trapping, dismissal,
naming and keyboard operation come from `<dialog>`, the popover stack and native
buttons — the parts that shipped everywhere years ago, which is the last group
in the table below.

## The matrix

> The **Here** column is not a claim. It is measured in the browser you are
> reading this in, as you read it — and it is the one part of this page that
> works with JavaScript switched off, on a browser too old to run the grid
> above.

<!-- support-matrix -->

## Testing

The Playwright suite runs Chrome only, deliberately. A cross-browser matrix
today would report failures that are the documented state of the world rather
than regressions in this library. It widens when the live table says the
features have landed.
