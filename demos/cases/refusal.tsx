import { useState, type ReactNode } from 'react'
import { Dialog as ControlledDialog } from '../../src/controlled'
import { Dialog } from '../../src/index'

/**
 * The two entry points, refusing the same close.
 *
 * Both lanes run the identical `onOpenChange`: if the box is ticked, decline.
 * The only difference is the import line at the top of the file, which is the
 * claim the page opens with and the one worth feeling rather than reading.
 *
 * On the left, `onOpenChange` is a `toggle` listener. It is told the dialog
 * closed, because it did; there was never a decision to take part in. On the
 * right the same callback is consulted before `<dialog>`'s `cancel` completes,
 * so declining means nothing moves at all.
 *
 * The counter is not decoration. A refusal on the right is invisible by design,
 * which makes it indistinguishable from a click that never registered until
 * something says out loud that it happened.
 *
 * It sits outside the dialog and the switch sits inside, which is not a layout
 * preference either way. The left dialog is gone by the time its verdict is
 * worth reading, so a counter inside it would unmount with the sentence the
 * lane exists to deliver. The switch has the opposite problem: a modal dialog
 * makes the rest of the page inert, so a reader who opened the right-hand one
 * with the switch outside could decline forever and never reach the switch that
 * would let them out. Inside is also where the real version lives, since the
 * unsaved form is in the dialog.
 */
function Lock({ locked, setLocked }: { locked: boolean; setLocked(next: boolean): void }) {
  return (
    <label className="rf-lock">
      <input
        type="checkbox"
        checked={locked}
        onChange={(event) => setLocked(event.target.checked)}
      />
      the form has unsaved changes
    </label>
  )
}

function Lane({
  title,
  importLine,
  verdict,
  children,
}: {
  title: string
  importLine: string
  verdict: string
  children(props: { locked: boolean; decline(): void; controls: ReactNode }): ReactNode
}) {
  const [locked, setLocked] = useState(true)
  const [refusals, setRefusals] = useState(0)

  return (
    <div className="rf-lane">
      <p className="rf-head">
        <strong>{title}</strong>
        <code>{importLine}</code>
      </p>

      <div className="rf-stage">
        {children({
          locked,
          decline: () => setRefusals((count) => count + 1),
          controls: <Lock locked={locked} setLocked={setLocked} />,
        })}
      </div>

      <p className="rf-count" aria-live="polite">
        {refusals === 0 ? 'Nothing declined yet.' : `Declined ${refusals}×. ${verdict}`}
      </p>
    </div>
  )
}

export default function RefusalDemo() {
  const [controlled, setControlled] = useState(false)

  return (
    <div className="rf">
      <Lane title="Reports" importLine="from '@apostel/bedrock'" verdict="It closed anyway.">
        {({ locked, decline, controls }) => (
          // No `open` prop to pass: the default root does not take one, which is
          // the whole difference. There is no state here for a refusal to hold.
          <Dialog.Root
            onOpenChange={(next) => {
              if (!next && locked) decline()
            }}
          >
            <Dialog.Trigger>Open, then press Escape</Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>Unsaved changes</Dialog.Title>
              <Dialog.Description>
                Declining here is a callback returning early. The browser had already closed the
                dialog before it ran.
              </Dialog.Description>
              {controls}
              <Dialog.Close>Cancel</Dialog.Close>
            </Dialog.Content>
          </Dialog.Root>
        )}
      </Lane>

      <Lane
        title="Refuses"
        importLine="from '@apostel/bedrock/controlled'"
        verdict="It is still open."
      >
        {({ locked, decline, controls }) => (
          <ControlledDialog.Root
            open={controlled}
            onOpenChange={(next) => {
              if (!next && locked) return decline()
              setControlled(next)
            }}
          >
            <ControlledDialog.Trigger>Open, then press Escape</ControlledDialog.Trigger>
            <ControlledDialog.Content>
              <ControlledDialog.Title>Unsaved changes</ControlledDialog.Title>
              <ControlledDialog.Description>
                Escape and Cancel are both declined while the box is ticked, and nothing flickers:
                the browser asks before it closes.
              </ControlledDialog.Description>
              {controls}
              <ControlledDialog.Close>Cancel</ControlledDialog.Close>
            </ControlledDialog.Content>
          </ControlledDialog.Root>
        )}
      </Lane>
    </div>
  )
}
