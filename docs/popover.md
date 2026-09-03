# Popover

A non-modal panel anchored to its trigger, rendered as a `<div popover>` in the
top layer. The browser handles stacking, light dismiss and Escape; CSS anchor
positioning handles the placement.

```tsx
import { Popover } from '@apostel/bedrock'
// or, for a veto: import { Popover } from '@apostel/bedrock/controlled'
```

<!-- demo: popover -->

## Anatomy

```tsx
<Popover.Root>
  <Popover.Trigger />
  <Popover.Anchor />
  <Popover.Content>
    <Popover.Close />
  </Popover.Content>
</Popover.Root>
```

No `Portal`. A popover is in the top layer, so it paints above everything
regardless of where it sits in the tree or what its ancestors set `overflow` to.

## `Popover.Root`

Renders no element.

| prop           | type                             | notes                    |
| -------------- | -------------------------------- | ------------------------ |
| `kind`         | `'auto' \| 'manual' \| 'hint'`   | Defaults to `auto`.      |
| `onOpenChange` | `(open: boolean) => void`        | Reports; cannot refuse.  |

For an `open` prop React can refuse with, import from
`@apostel/bedrock/controlled`. See [controlled state](./state.md).

`kind` is named for behaviour, not for the `popover` attribute it currently maps
onto one-for-one:

| value    | behaviour                                                          |
| -------- | ------------------------------------------------------------------ |
| `auto`   | Light-dismisses, and closes other `auto` popovers when it opens.    |
| `manual` | Neither. You close it yourself.                                     |
| `hint`   | Layers above an open menu instead of closing it. See [browser support](./compat.html). |

There is no `defaultOpen`. A popover cannot be shown before its element is
connected, and calling `showPopover()` from a mount effect is exactly the class
of thing this library exists to delete. Use `open` from `/controlled` instead.

## `Popover.Trigger`

Renders `<button type="button" commandfor command="toggle-popover">`.

| prop      | type      | notes                                                  |
| --------- | --------- | ------------------------------------------------------ |
| `asChild` | `boolean` | The child must render a `<button>`. Enforced at mount.  |

`aria-expanded` is **not** written by hand. Chrome gives a popover invoker that
attribute implicitly, and writing it too would mean two sources for one piece of
state.

## `Popover.Anchor`

Renders a `<div>`. Optional, and only needed when the thing the panel should
point at is not the thing that opens it.

Position it against a row while the button lives in that row's corner:

```tsx
<Popover.Root>
  <Popover.Anchor>
    <span>Row label</span>
    <Popover.Trigger>Edit</Popover.Trigger>
  </Popover.Anchor>
  <Popover.Content>…</Popover.Content>
</Popover.Root>
```

## `Popover.Content`

Renders `<div popover data-bedrock-popover>`.

| prop              | type      | notes                                                    |
| ----------------- | --------- | -------------------------------------------------------- |
| `side`            | `Side`    | `'top' \| 'right' \| 'bottom' \| 'left'`. Default `bottom`. |
| `align`           | `Align`   | `'start' \| 'center' \| 'end'`. Default `center`.          |
| `sideOffset`      | `number`  | Pixels between anchor and panel.                          |
| `avoidCollisions` | `boolean` | Default `true`. Becomes `position-try-fallbacks`.         |
| `id`              |           | **Not forwarded.** The trigger's `commandfor` points at it. |
| `asChild`         | `boolean` | Supported.                                                |

`side` and `align` compile to `position-area` plus self-alignment, so the panel
follows its anchor on scroll and resize with no listener, no measuring and no
re-render. `avoidCollisions` becomes `position-try-fallbacks`, which flips it
when it would overflow the viewport.

> Where a browser has no anchor positioning the panel still opens and still
> dismisses. It lands where the UA puts a popover, centred, rather than beside
> the trigger. See [browser support](./compat.md) for what degrades and how.

**Children mount only while it is open**, on `beforetoggle`. Closing discards
whatever the panel was holding, which is what makes the uncontrolled root
uncontrolled: a half-filled filter form resets because it is gone, not because
something reset it.

## `Popover.Close`

Renders `<button type="button" commandfor command="hide-popover">`, and takes
`asChild` under the same button rule as `Trigger`.

## `usePopoverTrigger()`

The escape hatch. Returns `{ commandfor, command }` to spread onto an element
bedrock will not render for you. Must be called inside a `Popover.Root`. No
validation and no accessibility guarantees. That is the deal, and it is why it
has a name you have to type.

## Keyboard

| key             | behaviour                                          |
| --------------- | -------------------------------------------------- |
| `Enter`/`Space` | On the trigger, toggles. Native button activation.  |
| `Escape`        | Closes an `auto` or `hint` popover. Platform light dismiss. |
| `Tab`           | Moves through the panel and then out of it. Not trapped. |

Focus is **not** moved into the panel on open, and not restored on close. A
popover is not modal; moving focus would be wrong for the common case of a
panel that sits beside the control that opened it.

## What is not here

- **A focus trap, and `modal`.** A popover is non-modal by definition: focus
  stays where it was and the rest of the page stays live. When you need the
  page held back instead, that is [Dialog](./dialog.md).
- **`collisionBoundary`, `sticky`, `hideWhenDetached`.** These are Radix's
  JavaScript positioner leaking into its API. CSS anchor positioning has its own
  vocabulary; see [migration](./migration-from-radix.md).
