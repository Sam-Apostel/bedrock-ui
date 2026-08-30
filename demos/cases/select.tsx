import { useState } from 'react'
import { Select } from '../../src/index'

/**
 * A real `<select>`. On a browser with `appearance: base-select` the trigger
 * and the list are styleable in place; everywhere else it falls back to the
 * platform control, which is a downgrade in looks and not in function.
 *
 * That is the whole component: 0.84 kB against Radix's 31.5.
 */
export default function SelectDemo() {
  const [value, setValue] = useState('medium')

  return (
    <>
      <Select.Root value={value} onValueChange={setValue} aria-label="Size">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Item value="small">Small</Select.Item>
        <Select.Item value="medium">Medium</Select.Item>
        <Select.Item value="large">Large</Select.Item>
      </Select.Root>
      <output>value: {value}</output>
    </>
  )
}
