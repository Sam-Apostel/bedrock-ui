# Form controls

`Checkbox`, `Switch`, `RadioGroup`, `Label`, `Toggle` and `ToggleGroup`. Every
one of these is the real element, which is the reason this page is short: the
role, the state, form participation, validation and the keyboard are the
browser's, and there is nothing to keep in sync.

```tsx
import { Checkbox, Switch, RadioGroup, Label, Toggle, ToggleGroup } from '@apostel/bedrock'
```

<!-- demo: forms -->

## `Checkbox`

Renders `<input type="checkbox" data-bedrock-checkbox>`.

| prop              | type                         | notes                                   |
| ----------------- | ---------------------------- | --------------------------------------- |
| `defaultChecked`  | `boolean`                    | Plain attribute.                        |
| `indeterminate`   | `boolean`                    | Property-only in the DOM, so this is the one effect here. |
| `onCheckedChange` | `(checked: boolean) => void` | Fires alongside `onChange`.             |
| `asChild`         | `boolean`                    | Supported.                              |

Radix renders a `<button role="checkbox">` beside a hidden input and keeps the
two in step. There is nothing here to keep in step.

`Checkbox.Indicator` **renders nothing**, and warns in development if you give
it a `className`. An `<input>` cannot have children. Draw the tick with
`::before` on the root:

```css
[data-bedrock-checkbox] { appearance: none }
[data-bedrock-checkbox]:checked::before { content: '✓' }
[data-bedrock-checkbox]:indeterminate::before { content: '–' }
```

## `Switch`

An `<input type="checkbox" role="switch">`. Same props as `Checkbox`.

`Switch.Thumb` renders nothing, for the same reason as `Checkbox.Indicator`.
Draw it with a pseudo-element.

## `RadioGroup`

`RadioGroup.Root` renders a `<div role="radiogroup">`; `RadioGroup.Item` renders
`<input type="radio">` with a shared `name`.

| prop            | type                       | on              |
| --------------- | -------------------------- | --------------- |
| `defaultValue`  | `string`                   | `Root`          |
| `onValueChange` | `(value: string) => void`  | `Root`          |
| `value`         | `string`                   | `Item` (required) |

> Arrow-key roving between radios in a group is **the browser's**, not ours. A
> shared `name` is all it takes. `RadioGroup.Indicator` renders nothing.

## `Label`

Renders `<label data-bedrock-label>`. Takes `htmlFor`.

> Double-clicking a label selects text in some engines, which is never what a
> label is for; that is suppressed. Everything else is the element's:
> click-to-focus, click-to-toggle, the accessible name.

## `Toggle` and `ToggleGroup`

`Toggle.Root` renders `<button aria-pressed>`.

| prop              | type                         | notes                       |
| ----------------- | ---------------------------- | --------------------------- |
| `defaultPressed`  | `boolean`                    |                             |
| `onPressedChange` | `(pressed: boolean) => void` |                             |

`ToggleGroup.Root` takes `type="single" | "multiple"` and gives its items
roving focus: one tab stop for the group, arrow keys within it. That part is
written, because HTML has no toggle-group widget.

`ToggleGroup.Item` takes a required `value`.

## What is not here

- **`Checkbox.Indicator` / `Switch.Thumb` / `RadioGroup.Indicator` as elements.**
  They render `null` on purpose. See above.
- **A `checked` prop on the plain root.** Import from
  `@apostel/bedrock/controlled` for a checkbox React can refuse.
- **Custom validation messages.** Use the Constraint Validation API; it is
  already attached to these elements.
