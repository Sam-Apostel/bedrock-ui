# AlertDialog

A modal dialog that asks a question. Same `<dialog>` and same top layer as
[Dialog](./dialog.md), with `role="alertdialog"` and a different set of buttons.

```tsx
import { AlertDialog } from '@apostel/bedrock'
// or, for a veto: import { AlertDialog } from '@apostel/bedrock/controlled'
```

<!-- demo: alert-dialog -->

## Anatomy

```tsx
<AlertDialog.Root>
  <AlertDialog.Trigger />
  <AlertDialog.Content>
    <AlertDialog.Title />
    <AlertDialog.Description />
    <AlertDialog.Cancel />
    <AlertDialog.Action />
  </AlertDialog.Content>
</AlertDialog.Root>
```

| part | source |
| --- | --- |
| `Root`, `Trigger`, `Title`, `Description` | Dialog's, re-exported — they behave identically |
| `Content`, `Cancel`, `Action` | the three that differ, below |

## `AlertDialog.Content`

Renders `<dialog role="alertdialog">`. Otherwise identical to
[`Dialog.Content`](./dialog.md#dialogcontent): children mount only while open,
`aria-labelledby` and `aria-describedby` are wired to the title and description,
and `id` is not forwarded.

> `role="alertdialog"` tells a screen reader to announce the whole dialog
> immediately rather than just moving focus into it, which is what a destructive
> confirmation wants.

## `AlertDialog.Cancel` / `AlertDialog.Action`

Both render `<button>`. `Cancel` closes with `request-close`, the same as
`Dialog.Close`; `Action` runs your handler and closes.

There is **no `AlertDialog.Close`**. An alert dialog asks a question, so both
ways out are answers — a third, meaningless dismissal would leave the caller not
knowing what the user decided.

Escape still closes, and deliberately so. Removing it would trap a keyboard user
in a decision, and every platform's own alert dialogs allow it. Escape is a
cancel: treat it as one.

## What is not here

- **A default focus on the destructive button.** Focus lands where the browser
  puts it for `showModal()`, on the first focusable control. Put `Cancel` first
  in the DOM if you want it focused, which is also the safer default.
- **Light dismiss.** Same as Dialog: clicking outside does nothing, and here
  that is unambiguously right.
