# Dialog

A modal dialog, rendered as `<dialog>` and opened with `showModal()`. The top
layer handles stacking, the browser handles the focus trap and the inert
background, `::backdrop` handles the overlay.

```tsx
import { Dialog } from '@apostel/bedrock'
// or, for a veto: import { Dialog } from '@apostel/bedrock/controlled'
```

<!-- demo: dialog -->

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

Everything else is forwarded to the button. `aria-expanded`, and `aria-controls`
while open, are written by hand.

> The `commandfor` wiring is applied after your props, so it cannot be
> overridden — an unwired trigger is a broken trigger, not a customisation.
> `type="button"` is set for the same reason.
>
> Writing `aria-expanded` by hand was not the original plan; a hand-written
> attribute goes stale as soon as something else closes the dialog. Two things
> changed it: Chrome gives a *popover* invoker that attribute implicitly and
> gives a *dialog* invoker nothing, and the root already tracks the DOM's open
> state for content mounting. Both attributes come from that same state, so they
> cannot disagree with the element they describe.

## `Dialog.Content`

Renders `<dialog data-bedrock-dialog>`.

Takes every `<dialog>` prop except the ones that would break the wiring:

| prop               | behaviour                                                    |
| ------------------ | ------------------------------------------------------------ |
| `id`               | **Not forwarded.** The trigger's `commandfor` points at it.   |
| `aria-labelledby`  | Defaults to the `Dialog.Title` id. Pass `undefined` to unset. |
| `aria-describedby` | **Merged** with the `Dialog.Description` id, deduped. Pass `undefined` to unset. |
| `asChild`          | Supported. The child must render a `<dialog>`, checked at mount. |

The `<dialog>` element is always rendered — the trigger's `commandfor` must
resolve to something — but **its children are mounted only while it is open**.

> That is what makes the uncontrolled root genuinely uncontrolled: a half-typed
> form inside a dialog is gone when it closes because the form is gone, not
> because anything reset it. No `onOpenChange` handler, no key bumping, no
> `useEffect`.

The timing is deliberate in three places, each tested:

| moment | what happens |
| --- | --- |
| `beforetoggle` | children mount — before the frame that paints the dialog, so it is never briefly empty, and `showModal()` can focus a real control |
| a refused open (controlled) | the flag is put straight back; nothing mounts |
| after `toggle` closed | children stay until the exit animation finishes, then unmount. Reopen inside that window and the subtree is reused rather than rebuilt |

> Server-rendered markup is the exception: content is rendered on the server and
> on the hydrating render that has to match it, so a page whose JavaScript never
> arrives still has a complete, working dialog. Only after hydration does a
> closed dialog drop its children.

There is no `forceMount`. If you need the subtree alive while closed — an
animation library driving presence, a video you do not want to reload — hoist
that state above the dialog.

## `Dialog.Title` / `Dialog.Description` / `Dialog.Close`

| part          | renders                                          | wired to |
| ------------- | ------------------------------------------------ | -------- |
| `Title`       | `<h2>`                                           | `aria-labelledby`, by an id derived from the root's |
| `Description` | `<p>`                                            | `aria-describedby`, the same way |
| `Close`       | `<button commandfor command="request-close">`    | the dialog, under the same button rule as `Trigger` |

All three take `asChild`.

> `Title` and `Description` each register their presence with the root, so the
> `aria-` attributes appear only when there is something to point at — a
> reference to a missing element leaves the dialog with no accessible name at
> all. Both are optional and both are strongly recommended; bedrock does not yet
> warn when `Title` is absent, which Radix does. See
> [known gaps](./known-gaps.md#missing-behaviour).
>
> `Close` uses `request-close` rather than `close` so the `cancel` event fires
> and stays vetoable.

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
  scroll. Two declarations of CSS get it back, and these docs use them — see
  [gaps](./known-gaps.md#missing-behaviour).
