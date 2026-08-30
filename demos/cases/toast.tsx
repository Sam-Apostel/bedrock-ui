import { useState } from 'react'
import { Toast } from '../../src/index'

/**
 * The viewport is a `popover="manual"` region, so toasts sit in the top layer
 * above whatever is on the page — including an open modal dialog, which is the
 * case that usually breaks a z-index-based implementation.
 */
export default function ToastDemo() {
  const [toasts, setToasts] = useState<number[]>([])
  const [next, setNext] = useState(1)

  return (
    <Toast.Provider duration={4000}>
      <button
        type="button"
        onClick={() => {
          setToasts((current) => [...current, next])
          setNext((value) => value + 1)
        }}
      >
        Show a toast
      </button>

      <Toast.Viewport>
        {toasts.map((id) => (
          <Toast.Root key={id}>
            <Toast.Title>Saved</Toast.Title>
            <Toast.Description>Change {id} was written to the server.</Toast.Description>
            <Toast.Action>Undo</Toast.Action>
            <Toast.Close>Dismiss</Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Provider>
  )
}
