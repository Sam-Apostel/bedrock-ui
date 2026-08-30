# Toast

Transient messages in the top layer, so they sit above whatever is on the page
— including an open modal dialog, which is the case that breaks a z-index-based
implementation.

```tsx
import { Toast } from '@apostel/bedrock'
```

<!-- demo: toast -->

## Anatomy

```tsx
<Toast.Provider>
  <Toast.Viewport>
    <Toast.Root>
      <Toast.Title />
      <Toast.Description />
      <Toast.Action />
      <Toast.Close />
    </Toast.Root>
  </Toast.Viewport>
</Toast.Provider>
```

## `Toast.Provider`

Renders nothing. Takes `duration` in milliseconds, the default for every toast
under it.

## `Toast.Viewport`

Renders `<ol popover="manual" role="region" aria-live="polite">`.

`popover="manual"` rather than `auto`: an auto popover light-dismisses, and a
toast region that vanishes when you click the page is not a toast region.

This is **the one imperative call in the library**. There is no attribute that
opens a popover on parse, and the region has to exist in the top layer before
the first toast arrives, so the ref calls `showPopover()`. It is written down
here rather than hidden, because it is the exception to the rule this library
is built on.

`aria-live="polite"` means new toasts are announced without interrupting. The
`<ol>` is deliberate: toasts are an ordered list, and screen-reader users can
navigate them as one.

## `Toast.Root`

Renders `<li data-bedrock-toast>`.

| prop           | type                      | notes                                |
| -------------- | ------------------------- | ------------------------------------ |
| `duration`     | `number`                  | Overrides the provider's.            |
| `onOpenChange` | `(open: boolean) => void` | Reports; cannot refuse.              |
| `asChild`      | `boolean`                 | The child must render an `<li>`.     |

It removes itself when its duration elapses.

## `Title`, `Description`, `Action`, `Close`

`<div>`, `<div>`, `<button>`, `<button>`. `Close` removes the nearest toast;
`Action` is a plain button you wire yourself.

## Keyboard

| key      | behaviour                                                    |
| -------- | ------------------------------------------------------------ |
| `Tab`    | Reaches the viewport, which is focusable, then the buttons.   |

There is no `F6` hotkey to jump to the toast region. Radix has one; this does
not. See [gaps](./gaps.md).

## What is not here

- **A `toast()` function.** This is a set of primitives, not a queue. Hold the
  array of toasts in your own state — the demo above is the whole pattern.
- **Swipe to dismiss.** No pointer gesture handling.
- **Pause on hover.** The timer does not stop when the pointer is over a toast,
  which it should. See [gaps](./gaps.md).
