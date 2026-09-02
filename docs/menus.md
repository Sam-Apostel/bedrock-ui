# Menus

`DropdownMenu`, `ContextMenu`, `Menubar` and `NavigationMenu` are one page
because they are one implementation. They differ in what opens them; every part
below the trigger is shared, so the prop tables would otherwise be copied four
times and drift three ways.

```tsx
import { DropdownMenu, ContextMenu, Menubar, NavigationMenu } from '@apostel/bedrock'
```

<!-- demo: dropdown-menu -->

## What is native here, and what is not

The panel is a `<div popover>`: top layer, light dismiss, Escape, and stacking
are all the browser's.

The keyboard is not. There is no menu widget in HTML, so arrow keys, `Home`,
`End` and typeahead are a roving tabindex implemented in `src/roving.ts`. This
is the one place bedrock writes keyboard handling, and it is written down here
rather than hidden, because it is the part that would be a lie to call native.

## Anatomy

```tsx
<DropdownMenu.Root>
  <DropdownMenu.Trigger />
  <DropdownMenu.Content>
    <DropdownMenu.Label />
    <DropdownMenu.Item />
    <DropdownMenu.CheckboxItem />
    <DropdownMenu.RadioGroup>
      <DropdownMenu.RadioItem />
    </DropdownMenu.RadioGroup>
    <DropdownMenu.Separator />
    <DropdownMenu.Group />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger />
      <DropdownMenu.SubContent />
    </DropdownMenu.Sub>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

`ContextMenu` and `Menubar` use the same parts. `NavigationMenu` uses
`List`, `Item`, `Link` and `Viewport` instead of the item family.

## The four roots

| root                    | opened by                          | notes                                    |
| ----------------------- | ---------------------------------- | ---------------------------------------- |
| `DropdownMenu.Root`     | its `Trigger`, an invoker          | The ordinary case.                       |
| `ContextMenu.Root`      | right-click anywhere in its subtree | Wraps the target; the trigger is the region, not a button. |
| `Menubar.Root`          | its `Menubar.Trigger`s             | Roving focus across the bar itself.      |
| `NavigationMenu.Root`   | its `Trigger`s                     | Site navigation, not commands.           |

Each takes `onOpenChange`, which reports and cannot refuse. Import from
`@apostel/bedrock/controlled` for a veto.

> `ContextMenu` opens on `contextmenu`, so it must `preventDefault()` the
> browser's own menu — the one deliberate interception in the library. Opening
> is deferred by a task, because showing a popover inside the same gesture that
> opened it means the gesture immediately light-dismisses it.

## `Trigger`

Renders `<button type="button" commandfor command="toggle-popover">`, plus an
`anchor-name` so the panel can be positioned against it.

> `asChild` is supported and the child must render a `<button>`, enforced at
> mount. `ContextMenu` is the exception: its trigger is the region you
> right-click, and is not required to be a button.

## `Content`

Renders `<div popover data-bedrock-menu>`.

| prop              | type      | notes                                            |
| ----------------- | --------- | ------------------------------------------------ |
| `side`            | `Side`    | `'top' \| 'right' \| 'bottom' \| 'left'`.         |
| `align`           | `Align`   | `'start' \| 'center' \| 'end'`.                   |
| `sideOffset`      | `number`  | Pixels between trigger and panel.                 |
| `avoidCollisions` | `boolean` | Default `true`. Becomes `position-try-fallbacks`. |
| `loop`            | `boolean` | Whether arrow keys wrap at the ends.               |
| `id`              | —         | **Not forwarded**; `commandfor` points at it.      |

**Children mount only while it is open.** A menu that holds a checkbox item
therefore starts from your state every time, not from whatever it was left in.

## Items

| part           | renders                                | props beyond the element's own          |
| -------------- | -------------------------------------- | ---------------------------------------- |
| `Item`         | `<button role="menuitem">`             | `closeOnSelect` (default `true`)         |
| `CheckboxItem` | `<button role="menuitemcheckbox">`     | `checked`, `onCheckedChange`             |
| `RadioGroup`   | `<div role="group">`                   | `value`, `onValueChange`                 |
| `RadioItem`    | `<button role="menuitemradio">`        | `value` (required)                       |
| `Label`        | `<div>`                                | —                                        |
| `Group`        | `<div role="group">`                   | —                                        |
| `Separator`    | `<div role="separator">`               | —                                        |

`closeOnSelect` is off for checkbox and radio items, because ticking three
boxes in a row is the point of having them.

> Every item takes `asChild`. Items are `<button>` rather than `<div role>` so
> that activation, disabled handling and focus are the element's own.

## Submenus

`Sub`, `SubTrigger` and `SubContent`. The submenu is its own popover, opened by
its trigger and nested inside the parent's panel.

> Nested roving containers do not double-step: a key handled by the submenu
> marks the event handled, and the parent stands down. That was a real bug, and
> there is a test for it.

## `NavigationMenu`

| part       | renders                        | notes                                    |
| ---------- | ------------------------------ | ---------------------------------------- |
| `Root`     | `<nav>`                        | Landmark, so it is one per region.        |
| `List`     | `<ul>`                         | Roving focus across the top level.        |
| `Item`     | `<li>`                         | —                                        |
| `Link`     | `<a>`                          | Takes `active` for the current page.      |
| `Viewport` | `<div>`                        | Optional shared panel container.           |

A navigation menu holds links, not commands, so its items are anchors and
middle-click, copy-link and open-in-new-tab all work. Radix renders a button
that calls `router.push`, which breaks all three.

## Keyboard

| key                | behaviour                                             |
| ------------------ | ----------------------------------------------------- |
| `ArrowDown`/`Up`   | Move between items. Wraps when `loop`.                 |
| `ArrowRight`/`Left`| Open/close a submenu. On `Menubar`, move between menus. |
| `Home`/`End`       | First and last item.                                   |
| `a`–`z`            | Typeahead. Jumps to the next item starting with that letter. |
| `Escape`           | Closes. Platform light dismiss.                        |
| `Tab`              | Closes the menu and moves on. Not trapped.             |

## What is not here

- **`modal`.** Radix's dropdown traps focus and blocks the page by default. This
  one does not; a menu is not a dialog.
- **Typeahead configuration.** The reset delay is fixed at one second.
- **Animated submenus following the pointer.** No "safe triangle". Moving
  diagonally onto a submenu can close it, which is the honest cost of not
  running a pointer-tracking loop. See [gaps](./should-you-switch.md).
