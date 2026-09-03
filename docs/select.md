# Select

A real `<select>`, opted into the stylable form with `appearance: base-select`.
The listbox, the keyboard, typeahead, form participation and the mobile picker
are the platform's.

```tsx
import { Select } from '@apostel/bedrock'
```

<!-- demo: select -->

This is the largest single saving in the library: **0.84 kB against Radix's
31.5 kB**, because almost all of it is an element that already exists.

## Anatomy

```tsx
<Select.Root>
  <Select.Trigger>
    <Select.Value />
  </Select.Trigger>
  <Select.Item />
  <Select.Group />
  <Select.Separator />
</Select.Root>
```

`Select.Content` exists and is optional; items may sit directly inside the
root, which is what a `<select>` expects.

## `Select.Root`

Renders `<select data-bedrock-select>`. Takes every `<select>` prop.

| prop            | type                      | notes                              |
| --------------- | ------------------------- | ---------------------------------- |
| `value`         | `string`                  | Controlled.                        |
| `defaultValue`  | `string`                  | Uncontrolled.                      |
| `onValueChange` | `(value: string) => void` | Alongside `onChange`.              |
| `asChild`       | `boolean`                 | Supported.                         |

> Because it is a `<select>`, `name`, `required`, `disabled` and `form` do what
> they say, and the control submits with the form without a hidden input.

## The other parts

| part            | renders             | notes |
| --------------- | ------------------- | ----- |
| `Trigger`       | `<button>`          | Part of the stylable-select markup Chrome added, not a bedrock invention. |
| `Value`         | `<selectedcontent>` | The same. |
| `Item`          | `<option>`          | Takes a required `value`. |
| `ItemText`      | `<span>`            | Inside the option. |
| `ItemIndicator` | **nothing**         | Style `option::checkmark` instead. Warns in development if given a `className`. |
| `Group`         | `<optgroup>`        | Valid inside a `<select>` in the stylable form. |
| `Separator`     | `<hr>`              | The same. |

## Degrading

Where `appearance: base-select` is missing, the control falls back to the
platform select: the native dropdown, unstyled by your CSS.

That is a **downgrade in looks, not in function**: every option is still
reachable, still typeahead-searchable, still submits. See
[browser support](./compat.html) for the current state.

This is the one primitive where the visual gap between engines is large, and it
is worth deciding deliberately whether that is acceptable for your product
before adopting it. See [should you switch?](./should-you-switch.md).

## What is not here

- **Arbitrary markup in an option.** A `<select>` restricts what may go inside
  it, and stylable select loosens that but does not remove it.
- **Multi-select as a separate component.** Set `multiple` on the root; it is a
  `<select>`.
- **A JavaScript-positioned listbox.** The browser positions it, including on
  mobile where it is a native picker.
