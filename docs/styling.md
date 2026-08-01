# Styling

Every part renders exactly one element and forwards `className` and `style`, so
any styling approach works. `bedrock.css` is optional and is a demonstration,
not a dependency.

## State selectors

State is native. This is a deliberate divergence from Radix, which uses
`data-state="open" | "closed"`.

| you want            | bedrock                | Radix                       |
| ------------------- | ---------------------- | --------------------------- |
| dialog is open      | `dialog:open`          | `[data-state="open"]`       |
| popover is open     | `:popover-open`        | `[data-state="open"]`       |
| checkbox is checked | `:checked`             | `[data-state="checked"]`    |
| the overlay         | `::backdrop`           | a separate `Overlay` element|

Why: `data-state` has to be written by JavaScript, which means it is a mirror
that can lag or desync, and it cannot be set at all before hydration. A closed
`<dialog>` matches `:not(:open)` from the moment the parser sees it.

The cost is real and worth naming: **you cannot select an ancestor on a
descendant's open state**, and `:has()` is the only way back, which is why
`data-*` attributes are still emitted for part identification
(`data-bedrock-dialog`, `data-bedrock-dialog-trigger`, …) even though state is
not.

## Enter and exit transitions

No `forceMount`, no presence wrapper, no unmount timing in JavaScript. Three
things do the work:

```css
[data-bedrock-dialog] {
  opacity: 0;
  scale: 0.96;
  transition:
    opacity 180ms,
    scale 180ms,
    display 180ms allow-discrete, /* keeps it displayed while exiting */
    overlay 180ms allow-discrete; /* keeps it in the top layer while exiting */
}

[data-bedrock-dialog]:open {
  opacity: 1;
  scale: 1;
}

/* the state it animates *from* on entry */
@starting-style {
  [data-bedrock-dialog]:open {
    opacity: 0;
    scale: 0.96;
  }
}
```

`overlay` is the one people miss. Without it the element leaves the top layer
the instant it closes, so the exit transition plays underneath whatever was
above it — which then gets blamed on `z-index`.

## The backdrop

```css
[data-bedrock-dialog]::backdrop {
  background: rgb(0 0 0 / 0.4);
}
```

It is a pseudo-element, so it cannot be a React node, cannot take a `className`,
and cannot have children. If you need a clickable or animated overlay with
content in it, that is a real limitation — see
[gaps](./gaps.md#9-the-backdrop-is-not-a-node).

Backdrop transitions need their own `@starting-style` block; a pseudo-element
does not inherit the host's.

## Tailwind

Tailwind 4 handles all of this with variants and arbitrary selectors:

```tsx
<Dialog.Content
  className="
    opacity-0 scale-96 transition-all duration-180
    transition-discrete
    open:opacity-100 open:scale-100
    starting:open:opacity-0 starting:open:scale-96
    backdrop:bg-black/40 backdrop:transition-opacity
  "
/>
```

`open:`, `starting:`, `backdrop:` and `transition-discrete` are all built in.
Tailwind 3 needs arbitrary variants: `[&:open]:`, `[&::backdrop]:`.

## Reduced motion

`bedrock.css` collapses its durations under `prefers-reduced-motion: reduce`
rather than removing the transitions, so `allow-discrete` still sequences the
display change correctly.
