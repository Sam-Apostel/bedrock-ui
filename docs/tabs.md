# Tabs and Toolbar

The roving-tabindex family. HTML has no tab widget and no toolbar widget, so
unlike most of this library these are **written**, not borrowed — the same
roving implementation the [menus](./menus.md) use.

```tsx
import { Tabs, Toolbar, ToggleGroup } from '@apostel/bedrock'
```

<!-- demo: tabs -->

Roving tabindex means the whole set is **one tab stop**: `Tab` moves past the
group, and arrow keys move within it. That is the APG pattern, and it is what
keyboard users expect from a toolbar or a tab strip.

## `Tabs.Root`

Renders a `<div>`.

| prop            | type                         | notes                       |
| --------------- | ---------------------------- | --------------------------- |
| `defaultValue`  | `string`                     | Which tab starts selected.  |
| `orientation`   | `'horizontal' \| 'vertical'` | Which arrows move focus.    |
| `onValueChange` | `(value: string) => void`    | Reports; cannot refuse.     |
| `asChild`       | `boolean`                    | Supported.                  |

For a controlled `value`, import from `@apostel/bedrock/controlled`.

## `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`

| part      | renders                              | notes |
| --------- | ------------------------------------ | ----- |
| `List`    | `<div role="tablist">`               | — |
| `Trigger` | `<button role="tab" aria-selected>`  | Required `value`. |
| `Content` | `<div role="tabpanel">`              | Required `value`; matched to the trigger by it. |

Panel children mount only while their tab is selected, which is what makes an
unselected panel's form reset.

## `Toolbar`

| part        | renders                    | notes                                  |
| ----------- | -------------------------- | -------------------------------------- |
| `Root`      | `<div role="toolbar">`     | Takes `orientation`.                    |
| `Button`    | `<button>`                 | —                                      |
| `Link`      | `<a>`                      | A real anchor: middle-click and copy-link work. |
| `Separator` | `<div role="separator">`   | —                                      |
| `ToggleGroup` / `ToggleItem` | see [form controls](./forms.md) | Re-exported so a toolbar reads as one component. |

## Keyboard

| key                 | behaviour                                        |
| ------------------- | ------------------------------------------------ |
| `Tab`               | Into the group, then out of it. One stop.        |
| `ArrowLeft`/`Right` | Move within a horizontal group.                   |
| `ArrowUp`/`Down`    | Move within a vertical group.                     |
| `Home`/`End`        | First and last.                                   |

Nested roving containers do not double-step: a key a nested group handles is
marked handled, and the outer one stands down. That was a real bug — a toolbar
containing a toggle group moved two positions per press — and there is a test
for it.

## What is not here

- **Activation on focus.** Tabs activate on click or `Enter`, not on arrow. The
  APG allows both; automatic activation loads panels the user only passed
  through.
- **Lazy panels that stay mounted once seen.** Content unmounts when its tab is
  deselected. Hoist the state if you need it kept.
