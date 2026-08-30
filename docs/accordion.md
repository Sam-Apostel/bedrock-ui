# Accordion

A set of disclosures, each one a `<details>`. When the root is `type="single"`,
the items share a `name` and the browser closes the open one — exclusivity with
no state, no registry and no effect.

```tsx
import { Accordion } from '@apostel/bedrock'
```

<!-- demo: accordion -->

## Anatomy

```tsx
<Accordion.Root>
  <Accordion.Item>
    <Accordion.Header>
      <Accordion.Trigger />
    </Accordion.Header>
    <Accordion.Content />
  </Accordion.Item>
</Accordion.Root>
```

## `Accordion.Root`

Renders a `<div>`. All the behaviour is in the items.

| prop            | type                          | notes                                        |
| --------------- | ----------------------------- | -------------------------------------------- |
| `type`          | `'single' \| 'multiple'`      | Default `single`. Sets whether items share a `name`. |
| `defaultValue`  | `string \| string[]`          | Which items start open.                       |
| `orientation`   | `'horizontal' \| 'vertical'`  | Default `vertical`.                           |
| `onValueChange` | `(value: string[]) => void`   | Reports which items are open after a change.  |
| `asChild`       | `boolean`                     | Supported.                                    |

`type="single"` always allows closing the open item, because a `<summary>`
toggles. Radix's `collapsible={false}` has no native equivalent and is not
offered — see [migration](./migration-from-radix.md).

There is no `value` prop here. For a controlled accordion, import from
`@apostel/bedrock/controlled`.

## `Accordion.Item`

Renders `<details data-bedrock-accordion-item>`, with `name` shared across
siblings when the root is `single`.

| prop       | type      | notes                                                     |
| ---------- | --------- | --------------------------------------------------------- |
| `value`    | `string`  | Required. Identifies the item, and is written as `data-value`. |
| `disabled` | `boolean` | Removes the summary from the tab order and blocks the toggle. |
| `asChild`  | `boolean` | The child must render a `<details>`.                       |

`open` is read once, on the first render. React only writes a DOM property when
the value it renders changes, so the user's own toggling is never undone by an
unrelated re-render.

A disabled disclosure is not a native concept. `data-disabled` is the closest
thing: style it, and the summary is not focusable.

## `Accordion.Header`

Renders `<summary>`.

Radix renders `<h3><button aria-expanded>`. The platform's disclosure pattern is
a summary, which carries the expanded state itself. If you want the heading
semantics the APG asks for, put a heading *inside* this:

```tsx
<Accordion.Header>
  <h3>Shipping</h3>
</Accordion.Header>
```

That is valid HTML and keeps the summary's behaviour.

## `Accordion.Trigger`

Renders a `<span>`, and is **not** itself interactive. The summary already is,
and nesting a button inside it would produce two tab stops for one control.

It exists so Radix-shaped markup keeps its styling hook. If you are writing new
markup, you can leave it out and style `Accordion.Header` directly.

## `Accordion.Content`

Renders a `<div>`. **Children mount only while the item is open**, so a form
inside a closed panel resets itself.

Server-rendered markup is the exception: content renders on the server and on
the hydrating render that must match it, so a page whose JavaScript never
arrives still has a complete, working accordion.

## Keyboard

| key             | behaviour                                              |
| --------------- | ------------------------------------------------------ |
| `Enter`/`Space` | On the summary, toggles. Native.                        |
| `Tab`           | Moves between summaries and into open content. Native.  |

Arrow keys do **not** move between items. `<details>` has no such behaviour, and
adding it would mean intercepting keys the browser already assigns. See
[gaps](./gaps.md).

## What is not here

- **Animated height.** `<details>` has no height animation in every engine yet.
  See [styling](./styling.md) for what does work today.
- **`collapsible={false}`.** No native equivalent, as above.
