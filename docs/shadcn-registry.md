# shadcn registry

A drop-in replacement for the shadcn/ui components that bedrock can actually
back. Same exports, same `data-slot` attributes, same class names — the diff in
your app is the import inside `components/ui/*.tsx`, and nothing above it.

```bash
npx shadcn@latest add https://raw.githubusercontent.com/Sam-Apostel/bedrock-ui/main/r/dialog.json
npx shadcn@latest add https://raw.githubusercontent.com/Sam-Apostel/bedrock-ui/main/r/alert-dialog.json
```

These overwrite `components/ui/dialog.tsx` and `components/ui/alert-dialog.tsx`.
Commit first; the CLI will ask before overwriting, and you want to be able to
read the diff.

## Coverage

Be clear about what this is: **2 of shadcn/ui's ~46 components**, because
bedrock has one primitive.

| shadcn component | status | notes |
| --- | --- | --- |
| `dialog` | **replaced** | Uncontrolled. `Portal` and `Overlay` are kept as no-ops so blocks keep compiling. |
| `dialog-controlled` | **added** | Same file, controlled entry point, required `open`. Not a shadcn name — install it *as* `dialog` when you need the veto. |
| `alert-dialog` | **replaced** | `role="alertdialog"` on the same primitive. `Action`/`Cancel` are close buttons. |
| `sheet`, `drawer` | stays on Radix | Both are dialogs, and both are mostly *positioning* — natural next step once `Popover` lands, and a real candidate for `<dialog>` plus a transform. |
| `popover`, `tooltip`, `hover-card`, `dropdown-menu`, `context-menu`, `menubar`, `navigation-menu`, `select`, `combobox`, `command` | stays on Radix | No bedrock primitive yet. `Popover` is next in the build order. |
| `accordion`, `collapsible`, `tabs`, `checkbox`, `radio-group`, `switch`, `toggle`, `toggle-group`, `slider`, `progress`, `separator`, `label`, `aspect-ratio`, `scroll-area`, `avatar`, `toast`/`sonner` | stays on Radix | Same. |
| `button`, `card`, `input`, `table`, `badge`, and the other unstyled-div components | unaffected | They never used Radix primitives. |

Mixing is safe: Radix and bedrock are separate packages with no shared globals
and no CSS collisions. It does mean both are in your bundle until the migration
finishes — see [gaps](./gaps.md#2-coverage-is-one-primitive).

## What changed inside the component

### `DialogPortal` renders its children in place

`<dialog>` is promoted to the top layer by `showModal()`, so it paints above
everything regardless of where it sits in the tree. There is nothing to portal
past. The export is kept because shadcn blocks import it.

Consequence: the `container` prop is accepted and ignored. If you were
portalling into a specific subtree to inherit a theme context, that now happens
naturally, because the element never moves.

### `DialogOverlay` renders nothing

The overlay is `::backdrop`, a pseudo-element. It cannot be a React node, so
classes passed to `DialogOverlay` have nowhere to go — in development you get
one console warning pointing at the `backdrop:` variant on `DialogContent`,
where those styles now live.

If your overlay had children (a spinner, a close affordance), that is a redesign
rather than a migration. See [gaps](./gaps.md#9-the-backdrop-is-not-a-node).

### Animation keys off `:open`

```diff
-data-[state=open]:animate-in data-[state=closed]:animate-out
+open:opacity-100 open:scale-100 starting:open:opacity-0 transition-discrete
```

`starting:` is `@starting-style` and `transition-discrete` is
`transition-behavior: allow-discrete` — both are built into Tailwind 4. There is
no `forceMount` and no presence wrapper; the element is always in the DOM and
the browser sequences the exit.

Tailwind 3 needs arbitrary variants (`[&:open]:`, `[&::backdrop]:`) and has no
`starting:`, so entry transitions need a hand-written `@starting-style` block.

### `Dialog` has no `open` prop in the default item

That is the two-root split reaching user land. `dialog.tsx` imports
`@apostel/bedrock`, which has no reconciliation code in it at all; passing
`open` throws in development with the command to install the controlled build
instead.

`onOpenChange` still exists on the uncontrolled build and still fires — it just
cannot refuse. Most shadcn usage (`onOpenChange={() => form.reset()}`) is served
by it.

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

Reads `registry.json`, inlines each component's source, and writes `r/*.json` —
the same output shape `shadcn build` produces, generated so a component and its
registry entry cannot drift.

Serve `r/` from anywhere static. The URLs above point at GitHub raw, which is
enough until there is a docs site.
