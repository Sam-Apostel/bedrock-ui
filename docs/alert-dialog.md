# AlertDialog

A modal dialog that asks a question, rendered as `<dialog role="alertdialog">`
and opened with `showModal()`. The top layer handles stacking, the browser
handles the focus trap and the inert background, `::backdrop` handles the
overlay. The two ways out are the answer.

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

| part          | renders                                                | notes |
| ------------- | ------------------------------------------------------ | ----- |
| `Root`        | nothing                                                 | `defaultOpen`, `onOpenChange`. Reports; cannot refuse. |
| `Trigger`     | `<button type="button" commandfor command="show-modal">`| The child of `asChild` must be a `<button>`. |
| `Title`       | `<h2>`                                                  | Wired to `aria-labelledby`. |
| `Description` | `<p>`                                                   | Wired to `aria-describedby`. |
| `Content`, `Cancel`, `Action` | below                                   | Documented in full below. |

For an `open` prop React can refuse with, import from
`@apostel/bedrock/controlled`. See [controlled state](./state.md).

> The first four are the same implementation `Dialog` exports, under a second
> name. That is a fact about the bundle, not something you need to hold: their
> props and behaviour are as listed here.

## `AlertDialog.Content`

Renders `<dialog role="alertdialog" data-bedrock-dialog>`.

| prop               | behaviour                                                    |
| ------------------ | ------------------------------------------------------------ |
| `id`               | **Not forwarded.** The trigger's `commandfor` points at it.   |
| `aria-labelledby`  | Defaults to the `Title` id. Pass `undefined` to unset.        |
| `aria-describedby` | **Merged** with the `Description` id, deduped.                |
| `asChild`          | Supported. The child must render a `<dialog>`.                |

The element is always rendered, because the trigger's `commandfor` has to
resolve to something, but its children mount only while it is open, so a form inside is
gone when it closes rather than reset.

> `role="alertdialog"` tells a screen reader to announce the whole dialog
> immediately rather than just moving focus into it, which is what a destructive
> confirmation wants.

## `AlertDialog.Cancel` / `AlertDialog.Action`

Both render `<button commandfor command="request-close">`, so both dismiss.
`request-close` rather than `close` is what fires the `cancel` event, which
keeps the close refusable under the controlled root. The difference between them
is intent: `Action` carries your handler and a
`data-bedrock-alert-dialog-action` hook, `Cancel` the matching cancel hook.

There is **no `AlertDialog.Close`**. An alert dialog asks a question, so both
ways out are answers, and a third meaningless dismissal would leave the caller not
knowing what the user decided.

Escape still closes, and deliberately so. Removing it would trap a keyboard user
in a decision, and every platform's own alert dialogs allow it. Escape is a
cancel: treat it as one.

## What is not here

- **A default focus on the destructive button.** Focus lands where the browser
  puts it for `showModal()`, on the first focusable control. Put `Cancel` first
  in the DOM if you want it focused, which is also the safer default.
- **Light dismiss.** Clicking the backdrop does nothing, and here that is
  unambiguously right: a question needs an answer.
