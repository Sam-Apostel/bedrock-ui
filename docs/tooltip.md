# Tooltip and HoverCard

Both are hover-and-focus intent over an anchored popover, and both are one
implementation — they differ in their delays, in whether the content is
hoverable, and in whether the thing is a label or a region.

```tsx
import { Tooltip, HoverCard } from '@apostel/bedrock'
```

<!-- demo: tooltip -->

## The honest part

The panel, its stacking, its dismissal and its positioning are the platform's.
**The intent timers are not.** `interestfor` — the attribute that would make
this declarative — is not standardised and is not in Chrome stable, so
`src/interest.ts` handles pointer in, pointer out, focus and blur.

It is written as a fallback rather than as a feature: when the attribute ships,
`useInterest` stops attaching anything and the same props become declarative.
Nothing above it changes, which is exactly why the prop is called
`delayDuration` and not `interest-show-delay`. See
[browser support](./compat.html).

## `Tooltip.Root`

| prop             | type                      | notes                             |
| ---------------- | ------------------------- | --------------------------------- |
| `delayDuration`  | `number`                  | Milliseconds before it opens.     |
| `closeDelay`     | `number`                  | Milliseconds before it closes.    |
| `onOpenChange`   | `(open: boolean) => void` | Reports; cannot refuse.           |

## `HoverCard.Root`

Same, with `openDelay` instead of `delayDuration`, and **hoverable content** —
moving the pointer from the trigger onto the card keeps it open. A tooltip's
content is not hoverable, because a tooltip is a label and there is nothing in
it to reach.

## `Trigger`

Renders `<button>`, or whatever you pass with `asChild` — a HoverCard trigger is
usually an `<a>`, which is the point of link previews.

`aria-describedby` points at the content: a tooltip **describes** its trigger
and must not replace its name. A button labelled only by its tooltip is a button
with no name when the tooltip is closed.

## `Content`

Renders `<div popover data-bedrock-tooltip>` and takes `side`, `align`,
`sideOffset` and `avoidCollisions`, exactly as [Popover](./popover.md) does.

Tooltip content uses `popover="hint"` where the browser supports it, so it
layers above an open menu instead of closing it. Where it does not, it falls
back to `auto` — opening a tooltip then closes an open menu, which is wrong but
not broken.

Children mount only while open.

## Keyboard

| key       | behaviour                                              |
| --------- | ------------------------------------------------------ |
| focus     | Opens after the delay. Keyboard users get tooltips too. |
| blur      | Closes.                                                 |
| `Escape`  | Closes.                                                 |

There is no key that opens a hover card, and that is a real gap for
keyboard-only users where the card holds links that exist nowhere else. Do not
put unique navigation in one.

## What is not here

- **A shared provider with a global "skip delay" window.** Radix opens
  subsequent tooltips instantly once one has opened. Not implemented; each root
  keeps its own timers. See [gaps](./gaps.md).
- **Touch support beyond the platform's.** There is no hover on a touch screen,
  and a tooltip that opens on tap is a popover with extra steps.
