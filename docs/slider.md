# Slider

An `<input type="range">`.

```tsx
import { Slider } from '@apostel/bedrock'
```

<!-- demo: slider -->

## Anatomy

```tsx
<Slider.Root>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb />
</Slider.Root>
```

`Track`, `Range` and `Thumb` all render **nothing**. An `<input>` is a void
element and cannot have children, so they exist only so Radix-shaped markup
compiles and keeps its names. They accept and drop `children`, and warn in
development if given a `className`.

If you are writing new markup, `<Slider.Root />` on its own is the whole
component.

## `Slider.Root`

Renders `<input type="range" data-bedrock-slider>`. Takes every `<input>` prop
except the ones it owns.

| prop            | type                         | notes                            |
| --------------- | ---------------------------- | -------------------------------- |
| `value`         | `number`                     | Controlled.                       |
| `defaultValue`  | `number`                     | Uncontrolled.                     |
| `min` / `max`   | `number`                     | The element's own.                |
| `step`          | `number`                     | The element's own.                |
| `orientation`   | `'horizontal' \| 'vertical'` | Becomes `writing-mode`.            |
| `onValueChange` | `(value: number) => void`    | Alongside `onChange`.             |
| `asChild`       | `boolean`                    | The child must render an `<input>`. |

`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, the
announced value, the drag behaviour and the full keyboard are the element's.
None of it is written here.

## Styling

There are no child elements to style, so use the pseudo-elements:

```css
[data-bedrock-slider] { appearance: none }
[data-bedrock-slider]::-webkit-slider-runnable-track { height: 4px; background: #ddd }
[data-bedrock-slider]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px }
[data-bedrock-slider]::-moz-range-track { height: 4px; background: #ddd }
[data-bedrock-slider]::-moz-range-thumb { width: 16px; height: 16px }
```

A filled "range" up to the thumb has no interoperable pseudo-element. Use a
`linear-gradient` background sized from the value, which is one custom property
and no JavaScript.

## Keyboard

| key                   | behaviour                       |
| --------------------- | ------------------------------- |
| `ArrowLeft`/`Right`   | One step.                        |
| `ArrowUp`/`Down`      | One step.                        |
| `PageUp`/`PageDown`   | A larger step.                   |
| `Home`/`End`          | Minimum and maximum.             |

All of it native, including the right behaviour in right-to-left writing modes.

## What is not here

- **Range sliders with two thumbs.** One `<input type="range">` is one value.
  Two inputs and a shared track is the honest way to do it, and it is not
  wrapped up here. This is the clearest functional gap against Radix; see
  [should you switch?](./should-you-switch.md).
- **`minStepsBetweenThumbs`.** Follows from the above.
- **Vertical sliders in every engine.** `writing-mode` handles it where
  supported; see [browser support](./compat.md).
