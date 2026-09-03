# Controlled state

Every primitive here opens and closes on its own. The trigger is bound to the
panel by the parser, the browser moves it, and React is told afterwards. You do
not wire anything up to make that work, and most components never need this
page.

Reach for it when React has to **refuse** a move: a dialog that will not close
over an unsaved form, a popover whose open state lives in a URL.

## Two entry points

`onOpenChange` on the default import reports. It cannot refuse:

```tsx
import { Popover } from '@apostel/bedrock'

<Popover.Root onOpenChange={(open) => { if (!open) clearFilters() }}>
```

That covers *tell me when it closed*, which is the case most often mistaken for
needing control. Both dialogs below run the same `onOpenChange`, declining every
close while the box is ticked. The import line is the only difference between
them:

<!-- demo: refusal -->

If you need a veto, change the import line:

```tsx
import { Popover } from '@apostel/bedrock/controlled'

<Popover.Root open={open} onOpenChange={setOpen}>
```

Every child part is byte-identical under both, and takes the same props, so
nothing inside the root changes when you switch.

| root         | `open`                    | `defaultOpen`        | `onOpenChange`             |
| ------------ | ------------------------- | -------------------- | -------------------------- |
| default      | not accepted              | read once, on mount, where the primitive has one | reports; cannot refuse     |
| `/controlled`| required; decides         | not accepted         | fires whether or not you accept |

Not every primitive has both roots: `Popover` has no `defaultOpen` at all
(a popover cannot be shown before its element is connected), and the value-based
ones (`Tabs`, `Accordion`, `Checkbox`, `RadioGroup`, `Toggle`) control a
`value` or `checked` rather than an `open`. Each primitive's own page says which
it takes.

> The two entry points are separate module graphs. If nothing in your app
> imports `/controlled`, none of the reconciliation code is in your bundle. That
> is the `exports` map, checked in CI by `npm run lint:graph`, not a
> tree-shaking hope.

## What `open` means

Not *React owns the state*. **The DOM leads and React vetoes:**

1. The user acts. The platform's `beforetoggle` fires. If your `open` prop
   disagrees and the event is cancelable, it is prevented and nothing moved.
2. `onOpenChange` fires either way. You decide.
3. If `open` changes without user interaction, an effect moves the DOM to match.

Step 1 is what makes a refusal invisible, and not every element offers it. Where
it is missing there is no refusal at all: the DOM moves, `onOpenChange` tells you
it moved, and it stays moved. Step 3 does not stand in for it — it is keyed on
the prop, and declining is exactly the case where the prop does not change.
Which of the two you get is per element rather than per component:

| built on              | cancelable hook                              | a refusal is…                       |
| --------------------- | -------------------------------------------- | ----------------------------------- |
| `popover`: Popover, DropdownMenu, Tooltip, HoverCard | `beforetoggle`, both directions | invisible; nothing moves |
| `<dialog>`: Dialog, AlertDialog | `beforetoggle` opening, `cancel` closing | invisible; nothing moves            |
| `<details>`: Collapsible, Accordion | none                           | [not possible](./known-gaps.md#missing-behaviour): it stays where the browser put it, and `open` disagrees until you change it |

So on a `<details>`-backed primitive, treat `/controlled` as one-way: change
`open` and the disclosure follows, but do not write a guard in `onOpenChange`
and expect it to hold. The veto you want is on the trigger's click, where the
toggle is still the default action and is still cancelable:

```tsx
<Collapsible.Trigger
  onClick={(event) => {
    if (form.isDirty) event.preventDefault()  // the disclosure never moves
  }}
>
```

That works for pointer and keyboard alike, because Enter and Space on a
`<summary>` dispatch the same click.

On the elements that do have a hook, refusing a close reads the same:

```tsx
<Dialog.Root
  open={open}
  onOpenChange={(next) => {
    if (!next && form.isDirty) return confirmDiscard()  // refuse; it stays open
    setOpen(next)
  }}
>
```

> `<dialog>`'s close veto is why `Close` parts use `command="request-close"` and
> never `command="close"`. `close` skips the `cancel` event, which is the only
> cancelable close hook a `<dialog>` has.

## Bundle cost

The gap between an entry-point pair is the whole cost of controlled mode for
that primitive. Measured with esbuild, minified, gzipped, React external:

| import                                        | gzip    |
| --------------------------------------------- | ------- |
| `Dialog` from `@apostel/bedrock`              | 1.95 kB |
| `Dialog` from `@apostel/bedrock/controlled`   | 2.09 kB |

It is smaller again for the menu family, where both roots pull in the same
roving module. For per-primitive figures across the library, see
[should you switch?](./should-you-switch.md).
