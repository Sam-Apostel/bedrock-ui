import { useState } from 'react'
import { Dialog } from '../../src/index'

/**
 * The trigger is an invoker: it carries `commandfor` and `command`, and the
 * browser opens the dialog. Nothing here listens for a click.
 *
 * Type into the field, close, and reopen — it is empty again, because closed
 * content unmounts. No effect resets it.
 */
export default function DialogDemo() {
  const [saved, setSaved] = useState('')

  return (
    <>
      <Dialog.Root>
        <Dialog.Trigger>Rename project</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Rename project</Dialog.Title>
          <Dialog.Description>This is shown to everyone on the team.</Dialog.Description>
          <form
            method="dialog"
            onSubmit={(event) => setSaved(new FormData(event.currentTarget).get('name') as string)}
          >
            <div className="demo-row">
              <input name="name" placeholder="New name" autoComplete="off" />
            </div>
            <Dialog.Close>Cancel</Dialog.Close> <button type="submit">Save</button>
          </form>
        </Dialog.Content>
      </Dialog.Root>
      {saved ? <output>saved: {saved}</output> : null}
    </>
  )
}
