import { useState } from 'react'
import { Checkbox, Label, RadioGroup, Switch, Toggle, ToggleGroup } from '../../src/index'

/**
 * Every control here is the real element: `<input type="checkbox">` for the
 * checkbox and the switch, `<input type="radio">` for the group. Form
 * participation, validation, the space bar and arrow-key roving inside a radio
 * group are all the browser's, so there is nothing to keep in sync.
 */
export default function FormsDemo() {
  const [log, setLog] = useState<string[]>([])
  const push = (entry: string) => setLog((entries) => [entry, ...entries].slice(0, 4))

  return (
    <div style={{ width: '100%' }}>
      <div className="demo-row">
        <Checkbox.Root id="ship" onCheckedChange={(on) => push(`checkbox: ${on}`)} />
        <Label.Root htmlFor="ship">Email me when it ships</Label.Root>
      </div>

      <div className="demo-row">
        <Switch.Root id="beta" onCheckedChange={(on) => push(`switch: ${on}`)} />
        <Label.Root htmlFor="beta">Join the beta</Label.Root>
      </div>

      <RadioGroup.Root defaultValue="standard" onValueChange={(value) => push(`radio: ${value}`)}>
        <div className="demo-row">
          <RadioGroup.Item value="standard" id="standard" />
          <Label.Root htmlFor="standard">Standard</Label.Root>
        </div>
        <div className="demo-row">
          <RadioGroup.Item value="express" id="express" />
          <Label.Root htmlFor="express">Express</Label.Root>
        </div>
      </RadioGroup.Root>

      <div className="demo-row">
        <Toggle.Root onPressedChange={(on) => push(`toggle: ${on}`)}>Pin</Toggle.Root>
        <ToggleGroup.Root type="multiple">
          <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
          <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
          <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      <output>{log.join(' · ') || 'no changes yet'}</output>
    </div>
  )
}
