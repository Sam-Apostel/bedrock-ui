# Open state: two roots

The DOM owns open state. React does not mirror it, and in the common case does
not participate in it at all.

That is the inversion the library rests on, and it is why there are two roots
instead of one root with an optional `open` prop.

## `Dialog.Root` — the default

From `@apostel/bedrock`. The browser opens and closes it. React holds nothing.

```tsx
<Dialog.Root defaultOpen={false} onOpenChange={(open) => …}>
```

| prop           | type                     | notes                                     |
| -------------- | ------------------------ | ----------------------------------------- |
| `defaultOpen`  | `boolean`                | Read once, on mount.                      |
| `onOpenChange` | `(open: boolean) => void`| **Read-only.** A `toggle` listener.       |

`onOpenChange` here reports; it cannot refuse. That covers the case that gets
miscategorised as "controlled" more often than any other:

```tsx
<Dialog.Root onOpenChange={(open) => { if (!open) form.reset() }}>
```

If that is what you need — *tell me when it closed* — you do not need the
controlled entry point, and you should not pay for it.

## `Dialog.Root` from `/controlled` — React gets a veto

```tsx
import { Dialog } from '@apostel/bedrock/controlled'

<Dialog.Root open={open} onOpenChange={setOpen}>
  {/* identical children, identical props on every part */}
</Dialog.Root>
```

| prop           | type                      | notes                        |
| -------------- | ------------------------- | ---------------------------- |
| `open`         | `boolean`                 | Required. Decides.           |
| `onOpenChange` | `(open: boolean) => void` | Fires whether or not you accept. |

Swapping is one import line. Every child part is byte-identical under both
roots and cannot tell which one it is under — that is what makes the split save
bytes rather than move them.

## What "controlled" means here

Not *React owns the state*. **DOM leads, React vetoes:**

1. The user clicks. `beforetoggle` fires. If your `open` prop disagrees and the
   event is cancelable, it is prevented and nothing moved.
2. `onOpenChange` fires either way. You decide.
3. If `open` changes without user interaction, an effect moves the DOM to match.

For `<dialog>` in Chrome 141, measured rather than assumed:

| transition           | hook                    | cancelable | so a refusal is…             |
| -------------------- | ----------------------- | ---------- | ---------------------------- |
| closed → open        | `beforetoggle`          | yes        | invisible; it never opens    |
| open → closed        | `beforetoggle`          | no         | —                            |
| Escape, `Dialog.Close`| `cancel`               | yes        | invisible; it stays open     |

Both directions are genuinely vetoable, so there is no visible flicker for
`Dialog`. Primitives whose platform hooks are not cancelable fall back to step 3
alone, which means one frame of visible movement **in the refusal case only**.
That is documented per primitive, and it is not fixed with `flushSync`.

## Refusing a close

```tsx
const [open, setOpen] = useState(false)

<Dialog.Root
  open={open}
  onOpenChange={(next) => {
    if (!next && form.isDirty) return confirmDiscard()  // refuse; it stays open
    setOpen(next)
  }}
>
```

`Dialog.Close` uses `command="request-close"`, never `command="close"`. `close`
skips the `cancel` event, which is the only cancelable close hook a `<dialog>`
has — using it would make the veto above impossible.

## Bundle cost

Measured with esbuild, minified, gzipped, React external:

| import                                      | gzip    |
| ------------------------------------------- | ------- |
| `Dialog` from `@apostel/bedrock`            | 1.95 kB |
| `Dialog` from `@apostel/bedrock/controlled` | 2.09 kB |
| `@radix-ui/react-dialog`                    | 13.7 kB |

The gap between the two entry points is the whole cost of controlled mode for a
Dialog. It is much smaller for the menu family, where both roots pull in the
same roving module — see [gaps](./gaps.md).

The two entry points are separate module graphs. If nothing in your app imports
`/controlled`, none of the reconciliation code is in your bundle — that is a
guarantee from the `exports` map, checked in CI by `npm run lint:graph`, not a
tree-shaking hope.
