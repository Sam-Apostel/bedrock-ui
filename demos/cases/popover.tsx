import { Popover } from '../../src/index'

/**
 * `side` and `align` become CSS anchor positioning, so the panel follows the
 * trigger on scroll with no listener and no measuring. Escape and clicking
 * outside are the platform's light dismiss.
 */
export default function PopoverDemo() {
  return (
    <Popover.Root>
      <Popover.Trigger>Filters</Popover.Trigger>
      <Popover.Content side="bottom" align="start" sideOffset={8}>
        <div className="demo-row">
          <label>
            <input type="checkbox" defaultChecked /> Open
          </label>
        </div>
        <div className="demo-row">
          <label>
            <input type="checkbox" /> Archived
          </label>
        </div>
        <Popover.Close>Done</Popover.Close>
      </Popover.Content>
    </Popover.Root>
  )
}
