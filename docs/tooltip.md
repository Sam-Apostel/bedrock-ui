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
this declarative — shipped in Chrome 142 and nowhere else, and is still not on
a standards track, so `src/interest.ts` handles pointer in, pointer out, focus,
blur and the long press for everyone.

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

> `aria-describedby` points at the content: a tooltip **describes** its trigger
> and must not replace its name. A button labelled only by its tooltip is a
> button with no name when the tooltip is closed.

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

Focus opens it where the browser calls that focus visible — `:focus-visible`,
asked of the trigger itself. Tapping a control focuses it on Android, and a
tooltip that appears because you tapped the button is a tooltip nobody asked
for.

There is no key that opens a hover card, and that is a real gap for
keyboard-only users where the card holds links that exist nowhere else. Do not
put unique navigation in one.

## Touch

There is no hover on a touch screen, so the gesture is a **long press**: hold
the trigger for half a second and the tooltip or card opens. That is the hold
iOS and Android already use for their own previews, and the one `interestfor`
is specified to answer where the platform runs intent itself.

| gesture           | what happens                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| tap               | Nothing opens. The trigger's `onClick` runs, a link follows.                                                             |
| press, then lift  | Opens, and stays open. The click the lift produces is swallowed, so pressing a link previews it instead of following it. |
| press, then drag  | Nothing opens — past about 10px the finger is scrolling.                                                                 |
| tap anywhere else | Closes. Light dismiss is the popover's, not ours.                                                                        |

On iPhone, "force touch" is a long press: 3D Touch was replaced by Haptic Touch
and Safari exposes no pressure to read, so the hold *is* the whole gesture.

Two platform gestures compete for that hold, and the trigger takes both off —
but only where the JavaScript path is running, because a browser doing intent
itself owns the conflict too:

- **`-webkit-touch-callout: none`**, inline on the trigger, so iOS offers no
  share sheet for the link you are pressing.
- **`user-select: none`**, for the length of the press and no longer. Setting it
  permanently would drop the trigger's own text out of any selection made around
  it, and a hover card trigger is usually a link in the middle of a paragraph.

There is no prop to turn the press off. If a trigger must not answer a hold,
it is a control with a description, not a tooltip.

## What is not here

- **A shared provider with a global "skip delay" window.** Radix opens
  subsequent tooltips instantly once one has opened. Not implemented; each root
  keeps its own timers. See [gaps](./should-you-switch.md).
- **A tap that opens anything.** See [touch](#touch): the gesture is a press,
  and a tap stays a tap.
