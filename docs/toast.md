# Toast

Transient messages in the top layer, so they sit above whatever is on the page,
including an open modal dialog, which is the case that breaks a z-index-based
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

| choice | why |
| --- | --- |
| `popover="manual"`, not `auto` | An auto popover light-dismisses, and a toast region that vanishes when you click the page is not a toast region. |
| `aria-live="polite"` | New toasts are announced without interrupting. |
| `<ol>` | Toasts are an ordered list, so a screen-reader user can navigate them as one. |

> This is **the one imperative call in the library**. No attribute opens a
> popover on parse, and the region has to exist in the top layer before the
> first toast arrives, so the ref calls `showPopover()`. Written down here
> rather than hidden, because it is the exception to the rule the library is
> built on.

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
not. See [should you switch?](./should-you-switch.md).

## What is not here

- **A `toast()` function.** This is a set of primitives, not a queue. Hold the
  array of toasts in your own state; the demo above is the whole pattern.
- **Swipe to dismiss.** No pointer gesture handling.
- **Pause on hover.** The timer does not stop when the pointer is over a toast,
  which it should. See [should you switch?](./should-you-switch.md).
