# Dialog

A modal dialog, rendered as `<dialog>` and opened with `showModal()`. The top
layer handles stacking, the browser handles the focus trap and the inert
background, `::backdrop` handles the overlay.

```tsx
import { Dialog } from '@apostel/bedrock'
// or, for a veto: import { Dialog } from '@apostel/bedrock/controlled'
```

## Anatomy

```tsx
<Dialog.Root>
  <Dialog.Trigger />
  <Dialog.Content>
    <Dialog.Title />
    <Dialog.Description />
    <Dialog.Close />
  </Dialog.Content>
</Dialog.Root>
```

There is no `Portal` and no `Overlay`. Both are gone rather than renamed —
`<dialog>` is in the top layer, so it is above everything regardless of where it
sits in the tree, and its backdrop is a pseudo-element rather than a node.

## `Dialog.Root`

See [two roots](./state.md). Renders no element.

## `Dialog.Trigger`

Renders `<button type="button" commandfor command="show-modal">`.

| prop      | type      | notes                                                |
| --------- | --------- | ---------------------------------------------------- |
| `asChild` | `boolean` | The child must render a `<button>`. Enforced at mount.|

Everything else is forwarded to the button.

The `commandfor` wiring is applied after your props, so it cannot be overridden
— an unwired trigger is a broken trigger, not a customisation. `type="button"`
is set for the same reason.

No `aria-expanded` is set. The browser derives expanded state from the invoker
relationship; a hand-written attribute would go stale the moment the dialog is
closed by anything other than the trigger.

## `Dialog.Content`

Renders `<dialog data-bedrock-dialog>`.

Takes every `<dialog>` prop except the ones that would break the wiring:

| prop               | behaviour                                                    |
| ------------------ | ------------------------------------------------------------ |
| `id`               | **Not forwarded.** The trigger's `commandfor` points at it.   |
| `aria-labelledby`  | Defaults to the `Dialog.Title` id. Pass `undefined` to unset. |
| `aria-describedby` | Defaults to the `Dialog.Description` id. Same.                |
| `asChild`          | **Not supported** — see [gaps](./gaps.md#dialogcontent-has-no-aschild). |

The `<dialog>` element is always rendered — the trigger's `commandfor` must
resolve to something — but **its children are mounted only while it is open**.

That is what makes the uncontrolled root genuinely uncontrolled: a half-typed
form inside a dialog is gone when it closes, because the form is gone, not
because anything reset it. No `onOpenChange` handler, no key bumping, no
`useEffect`.

The timing is deliberate in three places, each tested:

| moment | what happens |
| --- | --- |
| `beforetoggle` | children mount — before the frame that paints the dialog, so it is never briefly empty, and `showModal()` can focus a real control |
| a refused open (controlled) | the flag is put straight back; nothing mounts |
| after `toggle` closed | children stay until the exit animation finishes, then unmount. Reopen inside that window and the subtree is reused rather than rebuilt |

Server-rendered markup is the exception: content is rendered on the server and
on the hydrating render that has to match it, so a page whose JavaScript never
arrives still has a complete, working dialog. It is only after hydration that a
closed dialog drops its children.

There is no `forceMount`. If you need the subtree alive while closed — an
animation library driving presence, a video you do not want to reload — hoist
that state above the dialog.

## `Dialog.Title` / `Dialog.Description`

Render `<h2>` and `<p>`, with ids derived from the root's id and wired to the
dialog. Both take `asChild`.

Each registers its presence with the root, so `aria-labelledby` and
`aria-describedby` appear only when there is something for them to point at —
a reference to a missing element would leave the dialog with no accessible
name at all.

Both are optional and both are strongly recommended. bedrock does not yet warn
when `Title` is missing, which Radix does; see
[gaps](./gaps.md#still-no-missing-title-warning).

## `Dialog.Close`

Renders `<button type="button" commandfor command="request-close">`, and takes
`asChild` under the same button rule as `Trigger`.

`request-close` rather than `close` so the `cancel` event fires and stays
vetoable.

## `useDialogTrigger()`

The escape hatch. Returns `{ commandfor, command }` for you to spread onto
something bedrock refuses to render:

```tsx
const props = useDialogTrigger()
<ThirdPartyThing {...props} />
```

Must be called inside a `Dialog.Root`. No validation, no accessibility
guarantees — that is the deal, and it is why it has a name you have to type.

## Keyboard

| key             | behaviour                                                     |
| --------------- | ------------------------------------------------------------- |
| `Enter`/`Space` | On the trigger, opens. Native button activation.               |
| `Escape`        | Closes, via `cancel`, and is refusable under the controlled root. |
| `Tab`           | Trapped inside the dialog by the browser, not by us.           |

Focus moves into the dialog on open and returns to the invoker on close — both
are UA behaviour for `showModal()`, and both are why Dialog needs no focus code.

## What is not here

- **Light dismiss.** Clicking the backdrop does nothing. Radix closes.
  See [migration](./migration-from-radix.md#no-light-dismiss).
- **`modal={false}`.** A non-modal dialog is a different element and a different
  set of guarantees; it will be `Popover`, not a prop on this.
- **Scroll locking.** `showModal()` makes the background inert but does not lock
  scroll. See [gaps](./gaps.md#no-scroll-lock).
