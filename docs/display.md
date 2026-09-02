# Display primitives

`Avatar`, `Progress`, `Separator`, `AspectRatio`, `ScrollArea`,
`AccessibleIcon` and `VisuallyHidden`. Each is one element with the right
semantics, and between them they cost almost nothing — there is almost no code
to ship.

```tsx
import { Avatar, Progress, Separator, AspectRatio, ScrollArea } from '@apostel/bedrock'
```

<!-- demo: display -->

## `Avatar`

| part       | renders   | notes                                              |
| ---------- | --------- | -------------------------------------------------- |
| `Root`     | `<span>`  | —                                                  |
| `Image`    | `<img>`   | Hides itself on `error`.                            |
| `Fallback` | `<span>`  | Shown until the image loads, hidden once it does.   |

The swap is CSS driven off the image's own load state, not a `useState` fed by
`onLoad`. An image that is already in the HTTP cache is therefore never a frame
of flashing initials.

## `Progress`

Renders `<progress data-bedrock-progress>`.

| prop    | type     | notes                                    |
| ------- | -------- | ---------------------------------------- |
| `value` | `number` | Omit it entirely for indeterminate.       |
| `max`   | `number` | Default `1`, as the element's own default. |

`Progress.Indicator` renders nothing — a `<progress>` has no children. Style
`::-webkit-progress-value` and `::-moz-progress-bar`.

Indeterminate is the absence of `value`, which is the element's own rule rather
than a prop bedrock invented.

## `Separator`

Renders `<div role="separator">`, or nothing accessible at all when
`decorative`.

| prop          | type                         | notes                                     |
| ------------- | ---------------------------- | ----------------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | Written as `aria-orientation`.            |
| `decorative`  | `boolean`                    | Drops the role, so it is not announced.   |

A decorative rule between two paragraphs is noise in a screen reader. Marking it
so is the difference between a separator and a line.

## `AspectRatio`

Renders one `<div>` with the CSS `aspect-ratio` property.

| prop    | type     | notes                              |
| ------- | -------- | ---------------------------------- |
| `ratio` | `number` | e.g. `16 / 9`. Default `1`.        |

Radix uses a padding-bottom wrapper and a `ResizeObserver`. This is one
property, supported everywhere, in one element.

## `ScrollArea`

| part        | renders  | notes                                             |
| ----------- | -------- | ------------------------------------------------- |
| `Root`      | `<div>`  | —                                                 |
| `Viewport`  | `<div>`  | `overflow: auto`. The browser scrolls it.          |
| `Scrollbar` | `<div>`  | Styling hook; the scrollbar itself is the UA's.    |
| `Thumb`     | —        | Renders nothing.                                   |
| `Corner`    | —        | Renders nothing.                                   |

Scrolling is native, so the keyboard, the wheel, trackpad momentum, and the
reader's own "always show scrollbars" preference all work. Style the bar with
`scrollbar-width` and `scrollbar-color`, or `::-webkit-scrollbar`.

Radix renders custom scrollbars in JavaScript, which is how it can guarantee
identical bars everywhere; the cost is momentum, accessibility settings and
about 12 kB. This is the trade named plainly in [gaps](./should-you-switch.md).

## `AccessibleIcon`

Wraps a decorative glyph in one element and gives it a name for screen readers,
using [`VisuallyHidden`](#visuallyhidden) internally.

```tsx
<AccessibleIcon.Root label="Delete">
  <TrashGlyph />
</AccessibleIcon.Root>
```

## `VisuallyHidden`

Renders one `<span>` with the clip-path pattern: invisible on screen, still in
the accessibility tree, and still focusable if it holds a control — which is how
"skip to content" links work.

`VISUALLY_HIDDEN` is exported as a plain style object if you want the same
treatment on an element bedrock is not rendering.

## What is not here

- **A loading spinner.** Not a primitive; it is a picture.
- **`ScrollArea` `type="auto" | "hover" | "always"`.** Those describe Radix's
  custom scrollbars. The UA's own visibility rules apply instead, and follow the
  reader's OS setting.
