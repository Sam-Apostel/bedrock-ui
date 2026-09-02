# Collapsible

One disclosure, rendered as `<details>`.

```tsx
import { Collapsible } from '@apostel/bedrock'
// or, for a veto: import { Collapsible } from '@apostel/bedrock/controlled'
```

<!-- demo: collapsible -->

## Anatomy

```tsx
<Collapsible.Root>
  <Collapsible.Trigger />
  <Collapsible.Content />
</Collapsible.Root>
```

**The root is the element.** `<summary>` is only valid as a child of
`<details>`, so the two parts are bound by nesting: nothing is wired by id and
no invoker is involved. That is also why `defaultOpen` is a plain attribute
rather than a call on mount — the disclosure is open in the HTML before any
script runs.

## `Collapsible.Root`

Renders `<details data-bedrock-collapsible>`.

| prop           | type                      | notes                                  |
| -------------- | ------------------------- | -------------------------------------- |
| `defaultOpen`  | `boolean`                 | Read once; the attribute does the rest. |
| `onOpenChange` | `(open: boolean) => void` | Reports; cannot refuse.                 |
| `asChild`      | `boolean`                 | The child must render a `<details>`.    |

For an `open` prop React can refuse with, import from
`@apostel/bedrock/controlled` — see [controlled state](./state.md).

> `open` is read on the first render only. React writes a DOM property when the
> value it renders changes, so reading it once means the user's own toggling is
> never undone by an unrelated re-render.

## `Collapsible.Trigger`

Renders `<summary>`. It carries the expanded state itself, so there is no
`aria-expanded` to write and no button to keep in step.

## `Collapsible.Content`

Renders a `<div>`. **Children mount only while open**, so a form inside a closed
panel resets itself when it closes.

> Server-rendered markup is the exception: content renders on the server and on
> the hydrating render that must match it. A page whose JavaScript never arrives
> still has a complete, working disclosure — there is a test that loads it with
> scripting disabled and toggles it.

## What is not here

- **Height animation.** `<details>` has no interoperable height transition yet.
  See [styling](./styling.md) for what does work.
- **`disabled`.** Not a native concept on `<details>`. `Accordion.Item` offers
  `data-disabled` as the closest thing; this does not.
