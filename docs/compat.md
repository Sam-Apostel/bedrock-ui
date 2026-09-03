# Browser support

bedrock's floor is Chrome 135, Firefox 144 and Safari 26.2, the releases where
each engine shipped invoker commands. A bedrock trigger is `commandfor` with no
JavaScript standing behind it, so under that floor a trigger is a button that
does nothing.

The last of the three landed in December 2025. Drag back from there and watch
the library switch off.

<!-- widget: compat-timeline -->

## Reading the grid

<!-- widget: compat-legend -->

> The track runs a little past today. Those last stops are arithmetic, thirty
> months from the day the last engine shipped, and each one says so when you
> land on it.

## One markup, five stylesheets

```tsx
<Tabs.Root className="t-stack" defaultValue="editor">
  <Tabs.List className="t-tabs">
    <Tabs.Trigger className="t-tab" value="editor">Editor</Tabs.Trigger>
    <Tabs.Trigger className="t-tab" value="preview">Preview</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content className="t-tab-body" value="editor">Saved just now.</Tabs.Content>
</Tabs.Root>
```

<!-- widget: compat-looks -->

Nothing in that snippet changes between the five renderings. Nothing in the
grid above changes either, at any stop on the track: fifteen components, one set
of class names, and a stylesheet swapping underneath. That is what unstyled
buys you. Not the absence of CSS, but a redesign in 2029 that never opens a
component.

## What you are not betting on

The floor is a bet on the platform. Two things keep the bet off your code:

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
buttons, which shipped everywhere years ago. They are the last group in the
table below.

## The matrix

> The **Here** column is not a claim. It is measured in the browser you are
> reading this in, as you read it, and it is the one part of this page that
> works with JavaScript switched off, on a browser too old to run the grid
> above.

<!-- support-matrix -->

## Testing

The Playwright suite runs Chrome only, deliberately. A cross-browser matrix
today would report failures that are the documented state of the world rather
than regressions in this library. It widens when the live table says the
features have landed.
