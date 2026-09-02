# Getting started

```bash
npm i @apostel/bedrock
```

React 19 or later, as a peer. No runtime dependencies of its own.

```tsx
import { Dialog } from '@apostel/bedrock'

export function DeleteProject({ onConfirm }: { onConfirm(): void }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Delete project</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Delete project?</Dialog.Title>
        <Dialog.Description>This cannot be undone.</Dialog.Description>
        <Dialog.Close>Cancel</Dialog.Close>
        <button type="button" onClick={onConfirm}>
          Delete
        </button>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

That renders:

```html
<button type="button" commandfor="«r0»" command="show-modal">Delete project</button>
<dialog id="«r0»" aria-labelledby="«r0»-title" aria-describedby="«r0»-description">…</dialog>
```

No effect opens it, no state hook holds it, no portal moves it. The button is
bound to the dialog by the parser, which is why the markup above works before
React hydrates and keeps working if the bundle never arrives. There is a test
for exactly that — `tests/no-javascript.spec.ts` renders the markup, disables
JavaScript, and clicks it.

## The one rule

Triggers must be buttons. Invoker commands are defined on `<button>` and
nowhere else, so a trigger that renders anything else has no keyboard
activation and no implicit `aria-expanded`.

```tsx
// fine
<Dialog.Trigger asChild>
  <MyButton>Delete</MyButton>
</Dialog.Trigger>

// throws at mount in development, console.error in production
<Dialog.Trigger asChild>
  <div onClick={…}>Delete</div>
</Dialog.Trigger>
```

There is no fallback click handler, deliberately — see
[gaps](./should-you-switch.md#4-the-trigger-must-be-a-button-and-it-throws). If you are wrapping a
third-party component that renders a `div` and you cannot change it, take the
props and own the accessibility:

```tsx
const props = useDialogTrigger()
<ThirdPartyThing {...props} />
```

The same check catches a `<button>` inside a `<form>` without `type="button"`,
which is the version of this mistake people actually make. Submitting a form
and invoking a dialog are conflicting behaviours, so the browser ignores the
invocation and nothing happens at all.

## Styling

Nothing is styled. Every part takes `className` and renders exactly one
element. `bedrock.css` is a demonstration you can import or ignore:

```tsx
import '@apostel/bedrock/bedrock.css'
```

See [styling](./styling.md) for how open and closed states are selected —
short version, `:open` and `::backdrop`, not `data-state`.

## Next

- [Browser support](./compat.md) — read this before shipping to the public web
- [Styling](./styling.md) — the state selectors, in full
- [Controlled state](./state.md) — only if React has to refuse an open or a close

Every primitive has its own page, listed under **Primitives**; each one is
self-contained.
