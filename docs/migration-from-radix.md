# Migrating from Radix

Every Radix primitive has a bedrock equivalent, so a complete migration is
possible. Whether it is a good idea is [gaps](./gaps.md), and that page is worth
reading first: what changes is your test suite and your CSS conventions, not
your component tree.

This guide is written against `Dialog` because every divergence shows up there.
The per-primitive notes at the end cover what is specific to the others.

## The shape is the same

```diff
-import * as Dialog from '@radix-ui/react-dialog'
+import { Dialog } from '@apostel/bedrock'

 <Dialog.Root>
   <Dialog.Trigger asChild><button>Delete project</button></Dialog.Trigger>
-  <Dialog.Portal>
-    <Dialog.Overlay className="overlay" />
     <Dialog.Content className="content">
       <Dialog.Title>Delete project?</Dialog.Title>
       <Dialog.Description>This cannot be undone.</Dialog.Description>
       <Dialog.Close asChild><button>Cancel</button></Dialog.Close>
     </Dialog.Content>
-  </Dialog.Portal>
 </Dialog.Root>
```

Compound components, part names, `asChild`, `className` passthrough: unchanged.

## Mechanical changes

These are safe to codemod.

| Radix | bedrock | why |
| --- | --- | --- |
| `import * as Dialog from '@radix-ui/react-dialog'` | `import { Dialog } from '@apostel/bedrock'` | Namespace object rather than a module namespace. |
| `<Dialog.Portal>` | delete it | `<dialog>` is in the top layer; there is nothing to portal past. |
| `<Dialog.Overlay className="x" />` | `dialog::backdrop` in CSS | The backdrop is a pseudo-element. |
| `open` + `onOpenChange` on `Dialog.Root` | same props, import from `@apostel/bedrock/controlled` | Two roots, one import line. |
| `[data-state="open"]` | `:open` | Native state, no JS mirror. |
| `[data-state="closed"]` | `:not(:open)` | Same. |
| `forceMount` | delete it, and check what depended on it | Closed content unmounts, as in Radix, but there is no way to opt out. See [gaps](./gaps.md#4-closed-content-is-not-in-the-dom-and-there-is-no-forcemount). |
| `<AlertDialog.Action>` | `<Dialog.Close>` plus your `onClick` | No separate part; a close plus a handler. |

A rough sed for the state selectors, which is the bulk of a real diff:

```bash
rg -l 'data-state' src | xargs sed -i \
  -e 's/\[data-state="open"\]/:open/g' \
  -e 's/\[data-state="closed"\]/:not(:open)/g'
```

Check the results by hand where the selector targeted an *ancestor* — see the
`:has()` note in [styling](./styling.md#state-selectors).

## Changes that need a decision

### Triggers must be buttons

Radix attaches a click handler to whatever you give it. bedrock does not, and
throws in development if the trigger is not a `<button>`.

```diff
-<Dialog.Trigger asChild><div role="button" tabIndex={0}>Open</div></Dialog.Trigger>
+<Dialog.Trigger asChild><button type="button">Open</button></Dialog.Trigger>
```

In a real Radix codebase the case that bites is not the `div` — it is a trigger
inside a `<form>`:

```diff
-<Dialog.Trigger asChild><button>Delete</button></Dialog.Trigger>
+<Dialog.Trigger asChild><button type="button">Delete</button></Dialog.Trigger>
```

A `<button>` inside a form defaults to `type="submit"`, and the browser ignores
`commandfor` on a submit button. Radix papered over this; bedrock cannot, so it
tells you at mount instead.

If you genuinely cannot change the element — a third-party component that
renders a `div` — `useDialogTrigger()` hands you the props and the
responsibility.

### No light dismiss

Radix closes on a backdrop click. A native modal `<dialog>` does not; Escape and
your `Close` button are the ways out. Nothing about focus or dismissal is broken
— it is one fewer way to close.

`<dialog closedby="any">` restores it and will be an opt-in prop once the naming
question in [gaps](./gaps.md#light-dismiss-is-opt-out-not-opt-in) is settled. If
you need it today, put it on the element yourself:

```tsx
<Dialog.Content {...{ closedby: 'any' }} />
```

### `onOpenChange` is read-only on the default root

In Radix, `onOpenChange` is how you take control. Here it is a `toggle`
listener: it tells you what happened, it cannot refuse. If your handler only
resets a form or fires analytics, nothing changes and you keep the smaller
bundle. If it can *decline* — an unsaved-changes guard — move that root's import
to `@apostel/bedrock/controlled`.

Grep for handlers that conditionally avoid calling `setOpen`; those are the ones
that need the controlled import.

### The controlled model is a veto, not ownership

Radix: your state is the truth, Radix renders it.
bedrock: the DOM acts, then React can refuse.

For `Dialog` both directions are genuinely cancelable in Chrome, so a refusal is
invisible. What changes is ordering — `onOpenChange` fires *before* your state
updates, and the DOM may already have moved for primitives whose events are not
cancelable. Code that assumed `open` and the DOM were in lockstep at every
instant needs a second look; code that just calls `setOpen` does not.

### Escape and `onEscapeKeyDown` / `onPointerDownOutside`

Radix's `Dialog.Content` takes `onEscapeKeyDown`, `onPointerDownOutside`,
`onInteractOutside` and `onOpenAutoFocus`. None exist here. Escape is `cancel`,
which you refuse through `onOpenChange` under the controlled root; there is no
outside-pointer event because there is no light dismiss; and focus on open is
the UA's `showModal()` behaviour rather than something you can intercept.

`onOpenAutoFocus`'s common use — focus a specific field rather than the first
tabbable — is `autofocus` on that element, which `showModal()` honours.

### Nested dialogs

Radix stacks portals and manages `z-index`. The top layer stacks by open order,
so nesting works with no configuration — but a nested modal `<dialog>` makes the
outer one inert, exactly as the platform defines it. That is usually what you
wanted; if you were relying on interacting with the outer dialog underneath,
that is now impossible rather than merely discouraged.

## Does it behave the same?

Radix's own Dialog suite — all 42 cases — is ported in
`tests/radix-parity.spec.ts` and runs in CI. **30 pass, none fail**, and 13 test
machinery this library exists to delete.
[The scorecard names every one](./radix-parity.md).

## Per-primitive notes

Only the differences worth knowing before you start. Everything not listed is a
straight swap.

| primitive | what changes |
| --- | --- |
| `Accordion` | `type="single"` is `<details name>`, so an open item can always be closed — Radix's `collapsible={false}` has no native equivalent. `Header` renders the `<summary>` and `Trigger` sits inside it, because a button inside a summary would be two tab stops. |
| `Checkbox`, `Switch`, `RadioGroup` | real `<input>`s. `Indicator` and `Thumb` render nothing; draw the mark with `::before` under `:checked`. `onCheckedChange` gives a boolean, never `"indeterminate"`. |
| `Progress` | a real `<progress>`. `Indicator` renders nothing — style `::-webkit-progress-value`. |
| `Slider` | `<input type="range">`, so **one thumb**. A two-thumb range has no native equivalent. `Track`/`Range`/`Thumb` render nothing. |
| `Select` | a real `<select>` under `appearance: base-select`. Options are `<option>`, so on a phone you get the OS picker. `ItemIndicator` is `option::checkmark`. |
| `ScrollArea` | native scrolling. `Scrollbar`/`Thumb`/`Corner` render nothing; use `scrollbar-width` and `scrollbar-color`. |
| `Tabs` | the unselected panel is unmounted rather than hidden, so switching away resets it. |
| `Toast` | one `popover="manual"` region for the stack. No swipe-to-dismiss. |
| `Tooltip`, `HoverCard` | `delayDuration`/`openDelay` unchanged. The trigger may be an `<a>`, which is what makes link previews work without a wrapper. |
| `DropdownMenu`, `ContextMenu`, `Menubar` | same anatomy. Submenus need no configuration — a nested popover keeps its parent open because the invoker is inside it. |
| `NavigationMenu` | `Viewport` renders nothing: each content is anchored to its own item and already in the top layer. |
| `AspectRatio` | one element with `aspect-ratio`, not a padding wrapper. |
| `AccessibleIcon` | `role="img"` and `aria-label` on the glyph, not a visually hidden text node beside it. |

Radix and bedrock coexist without conflict — different packages, no shared
globals, no CSS collisions — so migrating one primitive at a time is safe.
