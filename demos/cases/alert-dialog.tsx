import { useState } from 'react'
import { AlertDialog } from '../../src/index'

/**
 * The same `<dialog>` as Dialog, with `role="alertdialog"` and no close button
 * — an alert dialog asks a question, so both ways out are answers. Escape still
 * works, because taking it away would trap a keyboard user in a decision.
 */
export default function AlertDialogDemo() {
  const [result, setResult] = useState('')

  return (
    <>
      <AlertDialog.Root>
        <AlertDialog.Trigger>Delete project</AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete this project?</AlertDialog.Title>
          <AlertDialog.Description>
            Every deployment and log goes with it. This cannot be undone.
          </AlertDialog.Description>
          <AlertDialog.Cancel onClick={() => setResult('cancelled')}>Keep it</AlertDialog.Cancel>{' '}
          <AlertDialog.Action onClick={() => setResult('deleted')}>Delete</AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Root>
      {result ? <output>{result}</output> : null}
    </>
  )
}
