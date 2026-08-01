# bedrock

Headless React primitives built on the browser instead of on top of it.

Radix-shaped anatomy — compound components, `asChild`, the same part names you
already type. Different foundation: the top layer, invoker commands, anchor
positioning, and `@starting-style` do the work that `Portal`, `Presence`,
`DismissableLayer`, and Floating UI used to do.

```bash
npm i @apostel/bedrock
```

> Package scope is a placeholder — change it before publishing.

## The shape

```tsx
import { Dialog } from '@apostel/bedrock'

<Dialog.Root>
  <Dialog.Trigger>Delete project</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Delete project?</Dialog.Title>
    <Dialog.Description>This cannot be undone.</Dialog.Description>
    <Dialog.Close>Cancel</Dialog.Close>
    <button onClick={destroy}>Delete</button>
  </Dialog.Content>
</Dialog.Root>
```

That renders roughly:

```html
<button commandfor="d1" command="show-modal">Delete project</button>
<dialog id="d1">…</dialog>
```

No effect opens it. No state hook holds it. No portal moves it. The button is
wired to the dialog by the parser, so it works before hydration and keeps
working if your JS bundle fails to load.

## Two roots

The DOM owns open state. Most of the time that's all you need, so that's the
default — and it costs nothing.

**`Dialog.Root`** — the DOM opens and closes itself. Accepts `defaultOpen` and a
read-only `onOpenChange`, which is a `toggle` listener and nothing more. This
covers the common case that gets miscategorised as "controlled": *I need to know
when it closed so I can reset the form.*

**`Dialog.Root` from `@apostel/bedrock/controlled`** — React gets a veto. Your
`open` prop decides whether an open is allowed to proceed.

```tsx
import { Dialog } from '@apostel/bedrock/controlled'

<Dialog.Root open={open} onOpenChange={setOpen}>
  {/* identical children */}
</Dialog.Root>
```

Same component names, same parts, same props on every part. Swapping is a
one-line import change, and a codemod if you're doing it across a repo.

The two entry points are separate module graphs, so if nothing in your app
imports `/controlled`, none of the reconciliation code reaches your bundle. This
is a real guarantee from the `exports` map, not a tree-shaking hope.

### How the veto works

Controlled mode is **DOM leads, React vetoes**, not React-owns-state:

1. User clicks. The browser fires `beforetoggle`, which is cancelable for
   popovers. If your `open` prop disagrees, we `preventDefault()` and nothing
   moved.
2. `onOpenChange` fires either way, so you can decide.
3. If your prop changes without user interaction, a reconciliation effect moves
   the DOM to match.

Where the platform gives no cancelable hook, step 1 is skipped and step 3 puts
things back — one frame of visible movement in the refuse case only. Modal
dialogs get an extra veto on close via `request-close` and the `cancel` event.

## `asChild` and the button rule

Invoker commands work on `<button>` only. Interest invokers also work on `<a>`.
So this is fine:

```tsx
<Tooltip.Trigger asChild><a href="/pricing">Pricing</a></Tooltip.Trigger>
```

and this is not:

```tsx
<Dialog.Trigger asChild><div onClick={…}>Open</div></Dialog.Trigger>
```

A trigger that isn't a button gets no `commandfor` wiring, which means no
keyboard activation and no implicit `aria-expanded`. That's an accessibility
regression, and it's silent, so we make noise about it: **development throws**
at mount, with the tag it found and the tags that part accepts. Production logs
an error at the same check point.

There is no fallback click handler. Attaching one would ship the exact
imperative trigger machinery this library exists to delete, to every consumer,
forever — and nobody removes a fallback that works.

If you're wrapping a third-party component that renders a div and can't change
it, take the props and own the consequences:

```tsx
const props = useDialogTrigger(id)
<ThirdPartyThing {...props} />
```

The same check catches `<button>` inside a `<form>` without `type="button"`.
Submit buttons can't invoke popovers — submitting and opening are conflicting
behaviours — and that one bites people more often than the div case.

## What's native and what still ships JS

Be clear-eyed about this. The platform deleted positioning and layering. It did
not delete focus management.

**Almost entirely native** — AspectRatio, Separator, Label, VisuallyHidden,
Progress, Collapsible, Dialog, AlertDialog, Popover.

**Native positioning, small JS state layer** — Tooltip, HoverCard, Accordion,
Switch, Checkbox, RadioGroup, Toggle, Select.

**Still substantially JS** — DropdownMenu, ContextMenu, Menubar,
NavigationMenu, Tabs, Slider, ScrollArea, Toast, Toolbar, ToggleGroup.

The reason is short: there is no native roving tabindex, no native typeahead, no
focus trap for non-modal layers, and no way to anchor to a pointer coordinate.
Every menu-shaped primitive needs all four.

Expect a bundle in the region of a fifth of the Radix equivalent for the first
group and much less of a saving for the third. The bigger win is behavioural —
no z-index fights, no portal-and-clipping bugs, no positioning recalculation on
every scroll frame.

## Browser support

Latest Chrome, deliberately, for now.

`appearance: base-select`, `interpolate-size`, `::scroll-marker`, and
`popover=hint` are shipped or shipping across engines, so that bet is about
timing. `interestfor` is the one that isn't standardised yet, and it's what
drives Tooltip and HoverCard triggers.

Because of that, **no platform feature appears in a public prop name.**
`Tooltip.Root` takes `delayDuration`; today it becomes `interest-show-delay`,
tomorrow it might become a timer. Feature detection lives in one module, every
non-Baseline CSS block sits behind `@supports`, and the implementation can be
swapped without a major version.

## Styling

Ship `bedrock.css` or don't — every part takes `className` and renders one
element. Open and closed states are selectable with `:open` and
`:popover-open`; enter and exit animation is `@starting-style` plus
`transition-behavior: allow-discrete`, no `forceMount`, no presence wrapper.

## Status

Pre-alpha. Dialog and the shared internals exist. Everything else is a list.
