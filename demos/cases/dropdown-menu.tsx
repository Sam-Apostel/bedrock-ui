import { useState } from 'react'
import { DropdownMenu } from '../../src/index'

/**
 * Arrow keys, Home/End and typeahead are roving tabindex, which is the one
 * place bedrock does write keyboard handling — the platform has no menu widget.
 * The panel itself is a popover, so dismissal is still the browser's.
 */
export default function DropdownMenuDemo() {
  const [chosen, setChosen] = useState('')

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content side="bottom" align="start" sideOffset={6}>
          <DropdownMenu.Label>Edit</DropdownMenu.Label>
          <DropdownMenu.Item onClick={() => setChosen('cut')}>Cut</DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => setChosen('copy')}>Copy</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>Share</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              <DropdownMenu.Item onClick={() => setChosen('email')}>Email</DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => setChosen('link')}>Copy link</DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {chosen ? <output>chose: {chosen}</output> : null}
    </>
  )
}
