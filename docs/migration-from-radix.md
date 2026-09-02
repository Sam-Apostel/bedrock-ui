# Migrating from Radix

Every Radix primitive has a bedrock equivalent, so a complete migration is
possible. Whether it is a good idea is [gaps](./should-you-switch.md), and that page is worth
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
| `forceMount` | delete it, and check what depended on it | Closed content unmounts, as in Radix, but there is no way to opt out. See [gaps](./should-you-switch.md#710-the-smaller-ones). |
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

> A `<button>` inside a form defaults to `type="submit"`, and the browser
> ignores `commandfor` on a submit button. Radix papered over this; bedrock
> cannot, so it tells you at mount instead.

If you genuinely cannot change the element — a third-party component that
renders a `div` — `useDialogTrigger()` hands you the props and the
responsibility.

### No light dismiss

Radix closes on a backdrop click. A native modal `<dialog>` does not; Escape and
your `Close` button are the ways out. Nothing about focus or dismissal is broken
— it is one fewer way to close.

`<dialog closedby="any">` restores it and will be an opt-in prop once the naming
question in [gaps](./should-you-switch.md#710-the-smaller-ones) is settled. If
you need it today, put it on the element yourself:

```tsx
<Dialog.Content {...{ closedby: 'any' }} />
```

### The four smaller decisions

Each is a real difference, and none of them needs a page of its own.

| Change | Radix | bedrock | What to do |
| --- | --- | --- | --- |
| **`onOpenChange` is read-only on the default root** | How you take control. | A `toggle` listener: it reports, it cannot refuse. | Nothing, if your handler resets a form or fires analytics. Grep for handlers that conditionally avoid calling `setOpen` — those roots move to `@apostel/bedrock/controlled`. |
| **The controlled model is a veto, not ownership** | Your state is the truth; Radix renders it. | The DOM acts, then React can refuse. | Usually nothing: for `Dialog` both directions are cancelable in Chrome, so a refusal is invisible. What changes is ordering — `onOpenChange` fires *before* your state updates. Code that assumed `open` and the DOM were in lockstep needs a second look. |
| **`onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`, `onOpenAutoFocus`** | Props on `Dialog.Content`. | None exist. Escape is `cancel`, refusable through `onOpenChange` under the controlled root. There is no outside-pointer event because there is no light dismiss. | For the common `onOpenAutoFocus` case — focus a specific field rather than the first tabbable — put `autofocus` on that element; `showModal()` honours it. |
| **Nested dialogs** | Stacked portals and managed `z-index`. | The top layer stacks by open order, so nesting needs no configuration — but a nested modal `<dialog>` makes the outer one inert, as the platform defines it. | Usually nothing. If you relied on interacting with the outer dialog underneath, that is now impossible rather than discouraged. |

## Does it behave the same?

Radix's own Dialog suite — all 42 cases — is ported in
`tests/radix-parity.spec.ts` and runs in CI. **30 pass, none fail**, and 13 test
machinery this library exists to delete.
[The scorecard names every one](./radix-parity.md).

## Doing it with an agent

The mechanical half of this page is exactly the work an agent should do, so it
ships as one: `skills/migrate-to-bedrock/SKILL.md` is a [Claude Code
skill](https://code.claude.com/docs) that walks an agent through migrating a
Radix codebase. It is written for the agent, not for you — but it is worth
reading, because it is the shortest honest description of what a migration
actually involves.

### Installing it

Into a project you are migrating:

```bash
mkdir -p .claude/skills/migrate-to-bedrock
curl -o .claude/skills/migrate-to-bedrock/SKILL.md \
  https://bedrock.sams.land/skills/migrate-to-bedrock/SKILL.md
```

Then: *"migrate this app off Radix"*. The description is written so the skill
triggers on that, and on the questions people ask afterwards — why a trigger
throws, why the dialog no longer closes on a backdrop click, why `data-state`
selectors stopped matching.

It also ships inside the package, at
`node_modules/@apostel/bedrock/skills/migrate-to-bedrock/SKILL.md`, so an agent
already working in the project can be pointed at it with no download.

### What it makes the agent do

The order is the point: it refuses to start a refactor that ends badly.

| Step | What happens |
| --- | --- |
| **1. Establish viability** | Before any code, it checks four things and reports them: jsdom tests that click triggers, triggers that are not buttons, `data-state` in shared CSS, and overlays with content in them. A project with hundreds of jsdom component tests and no Playwright setup gets told so, and the skill stops. |
| **2. The mechanical work** | Imports, deleting `Portal` and `Overlay`, `data-state` → `:open`, the animation classes. |
| **3. Four judgement calls, surfaced not resolved** | The button rule, light dismiss, which roots need `/controlled`, and what depended on content staying mounted. Each changes behaviour a user notices, so the skill is explicit that the agent must not decide them quietly. |
| **4. Verification that fits the failure mode** | A bad trigger only throws when its component mounts, so type-checking is not enough. The app has to be opened in a browser. |

### Why a skill rather than a codemod

Most of the diff is mechanical and a codemod could do it. The parts that matter
are not: whether a trigger can become a button depends on what that element is
*for*, and whether light dismiss should be restored depends on whether the
dialog is a confirmation or a form. A codemod would either refuse those or guess
— and guessing quietly is the worst of the three.

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
