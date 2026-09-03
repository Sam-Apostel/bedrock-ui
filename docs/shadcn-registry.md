# shadcn registry

A drop-in replacement for the shadcn/ui components that bedrock can actually
back. Same exports, same `data-slot` attributes, same class names. The diff in
your app is the import inside `components/ui/*.tsx`, and nothing above it.

```bash
npx shadcn@latest add https://bedrock.sams.land/r/dialog.json
npx shadcn@latest add https://bedrock.sams.land/r/dropdown-menu.json
```

Each one overwrites the matching file in `components/ui/`. Commit first; the CLI
asks before overwriting, and the diff is the thing worth reading.

## What you get

Below are shadcn's `Dialog`, `Tabs`, `Checkbox`, `Switch` and `Label` from this
registry, imported from `registry/bedrock/ui/` **unmodified**: the same files
the command above installs, running on this page.

The claim is that the swap is invisible. Open the dialog, walk the tabs with the
arrow keys, and check that against a shadcn app you already have.

<!-- demo: registry -->

The dialog has no `Portal` and no `Overlay` doing anything. Both are no-ops now,
because a `<dialog>` is already in the top layer and its backdrop is a
pseudo-element. The exports are still there, so your imports do not change.

## Coverage

**24 registry items**, covering every shadcn/ui component that was backed by a
Radix primitive.

| shadcn component | status | notes |
| --- | --- | --- |
| `dialog` | **replaced** | Uncontrolled. `Portal` and `Overlay` are kept as no-ops so blocks keep compiling. |
| `dialog-controlled` | **added** | Same file, controlled entry point, required `open`. Not a shadcn name, so install it *as* `dialog` when you need the veto. |
| `alert-dialog` | **replaced** | `role="alertdialog"` on the same primitive. `Action`/`Cancel` are close buttons. |
| `popover`, `tooltip`, `hover-card` | **replaced** | Anchor positioning; `side`/`align`/`sideOffset` keep their names. |
| `dropdown-menu`, `context-menu` | **replaced** | Popover plus roving focus. `ContextMenuTrigger` renders its children in place, so the root *is* the trigger area. |
| `select` | **replaced** | A real `<select>`. `SelectValue` is `<selectedcontent>`; there is no `placeholder` render prop, because the closed state mirrors the chosen option's markup. |
| `checkbox`, `switch`, `radio-group`, `slider`, `progress` | **replaced** | Native inputs. Every `Indicator` and `Thumb` element is gone; the marks are pseudo-elements, which is a smaller component and a bigger CSS change. |
| `accordion`, `collapsible`, `tabs` | **replaced** | `<details>` for the first two. `AccordionTrigger` renders inside the `<summary>`. |
| `label`, `separator`, `aspect-ratio`, `avatar`, `scroll-area`, `toggle`, `toggle-group` | **replaced** | |
| `menubar`, `navigation-menu`, `toast`/`sonner`, `sheet`, `drawer` | pending | Primitives exist; the wrapper is not written. `sheet` and `drawer` are `Dialog` plus positioning. |
| `combobox`, `command` | stays on Radix | Built on `cmdk`, not on a Radix primitive. |
| `button`, `card`, `input`, `table`, `badge`, and the other unstyled-div components | unaffected | They never used Radix primitives. |

> Mixing is safe: Radix and bedrock are separate packages with no shared globals
> and no CSS collisions. It does mean both are in your bundle until the
> migration finishes. See
> [should you switch?](./should-you-switch.md#3-the-saving-is-uneven).

## What changed inside the component

### `DialogPortal` renders its children in place

`<dialog>` is promoted to the top layer by `showModal()`, so it paints above
everything regardless of where it sits in the tree. There is nothing to portal
past. The export is kept because shadcn blocks import it.

> Consequence: the `container` prop is accepted and ignored. If you were
> portalling into a specific subtree to inherit a theme context, that now
> happens naturally, because the element never moves.

### `DialogOverlay` renders nothing

The overlay is `::backdrop`, a pseudo-element. It cannot be a React node, so
classes passed to `DialogOverlay` have nowhere to go, and in development you get
one console warning pointing at the `backdrop:` variant on `DialogContent`,
where those styles now live.

If your overlay had children (a spinner, a close affordance), that is a redesign
rather than a migration. See [should you switch?](./should-you-switch.md#6-several-parts-render-nothing-and-that-is-a-redesign-not-a-rename).

### Animation keys off `:open`

```diff
-data-[state=open]:animate-in data-[state=closed]:animate-out
+open:opacity-100 open:scale-100 starting:open:opacity-0 transition-discrete
```

`starting:` is `@starting-style` and `transition-discrete` is
`transition-behavior: allow-discrete`, both built into Tailwind 4. There is
no `forceMount` and no presence wrapper; the element is always in the DOM and
the browser sequences the exit.

> Tailwind 3 needs arbitrary variants (`[&:open]:`, `[&::backdrop]:`) and has no
> `starting:`, so entry transitions need a hand-written `@starting-style` block.

### `Dialog` has no `open` prop in the default item

That is the two-root split reaching user land. `dialog.tsx` imports
`@apostel/bedrock`, which has no reconciliation code in it at all; passing
`open` throws in development with the command to install the controlled build
instead.

> `onOpenChange` still exists on the uncontrolled build and still fires. It
> just cannot refuse. Most shadcn usage (`onOpenChange={() => form.reset()}`) is
> served by it.

### `AlertDialogAction` and `AlertDialogCancel`

Both render `Dialog.Close`, so both dismiss. Put the destructive work in
`onClick`; you do not need to close it yourself.

```tsx
<AlertDialogAction onClick={() => deleteProject(id)}>Delete</AlertDialogAction>
```

Radix's `Action` behaves the same way, so this is a like-for-like swap.

## Building the registry

```bash
npm run registry:build
```

Reads `registry.json`, inlines each component's source, and writes `r/*.json`,
the same output shape `shadcn build` produces, generated so a component and its
registry entry cannot drift.

`r/` is published as part of the docs site, so the registry URL and the
documentation are the same host.
