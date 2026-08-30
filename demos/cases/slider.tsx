import { useState } from 'react'
import { Slider } from '../../src/index'

/**
 * `<input type="range">`. Arrow keys, Home/End, Page Up/Down and the drag
 * behaviour are the element's, along with the correct `role="slider"` and the
 * announced value — none of which is written here.
 */
export default function SliderDemo() {
  const [value, setValue] = useState(40)

  return (
    <>
      <Slider.Root
        aria-label="Volume"
        defaultValue={40}
        min={0}
        max={100}
        step={5}
        onValueChange={setValue}
      >
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>
      <output>{value}</output>
    </>
  )
}
