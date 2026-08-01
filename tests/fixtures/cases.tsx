import { Component, useCallback, useEffect, useState, type ReactNode } from 'react'
import { Dialog } from '../../src/index'
import { Dialog as ControlledDialog } from '../../src/controlled'
import { PARITY_CASES } from './parity'
import { MENU_CASES } from './menus'
import { REST_CASES } from './rest'
import { OVERLAY_CASES } from './overlays'
import { PRIMITIVE_CASES } from './primitives'

/**
 * One page, one case per `?case=` value. Specs drive real clicks and real keys
 * against real Chrome — jsdom has no top layer, no invoker commands and no
 * anchor positioning, so a green suite there would prove nothing.
 */

function Log({ entries }: { entries: string[] }) {
  return <output data-testid="log">{entries.join(',')}</output>
}

function Plain({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [entries, setEntries] = useState<string[]>([])

  return (
    <Dialog.Root
      defaultOpen={defaultOpen}
      onOpenChange={(open) => setEntries((e) => [...e, String(open)])}
    >
      <Dialog.Trigger>Delete project</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Delete project?</Dialog.Title>
        <Dialog.Description>This cannot be undone.</Dialog.Description>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Content>
      <Log entries={entries} />
    </Dialog.Root>
  )
}

/** React accepts every change, which is the ordinary controlled case. */
function ControlledAccept() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<string[]>([])

  return (
    <ControlledDialog.Root
      open={open}
      onOpenChange={(next) => {
        setEntries((e) => [...e, String(next)])
        setOpen(next)
      }}
    >
      <ControlledDialog.Trigger>Delete project</ControlledDialog.Trigger>
      <ControlledDialog.Content>
        <ControlledDialog.Title>Delete project?</ControlledDialog.Title>
        <ControlledDialog.Close>Cancel</ControlledDialog.Close>
      </ControlledDialog.Content>
      <Log entries={entries} />
      <button type="button" data-testid="open-from-react" onClick={() => setOpen(true)}>
        Open from React
      </button>
    </ControlledDialog.Root>
  )
}

/** React refuses every open. The dialog must never appear. */
function ControlledRefuseOpen() {
  const [entries, setEntries] = useState<string[]>([])

  return (
    <ControlledDialog.Root
      open={false}
      onOpenChange={(next) => setEntries((e) => [...e, String(next)])}
    >
      <ControlledDialog.Trigger>Delete project</ControlledDialog.Trigger>
      <ControlledDialog.Content>
        <ControlledDialog.Title>Delete project?</ControlledDialog.Title>
        <ControlledDialog.Close>Cancel</ControlledDialog.Close>
      </ControlledDialog.Content>
      <Log entries={entries} />
    </ControlledDialog.Root>
  )
}

/** React refuses every close — an unsaved-changes guard, essentially. */
function ControlledRefuseClose() {
  const [entries, setEntries] = useState<string[]>([])

  return (
    <ControlledDialog.Root open onOpenChange={(next) => setEntries((e) => [...e, String(next)])}>
      <ControlledDialog.Trigger>Delete project</ControlledDialog.Trigger>
      <ControlledDialog.Content>
        <ControlledDialog.Title>Delete project?</ControlledDialog.Title>
        <ControlledDialog.Close>Cancel</ControlledDialog.Close>
      </ControlledDialog.Content>
      <Log entries={entries} />
    </ControlledDialog.Root>
  )
}

const Fancy = ({ children, ...props }: { children: ReactNode }) => (
  <button {...props} type="button" data-fancy="">
    {children}
  </button>
)

function AsChild() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Fancy>Delete project</Fancy>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title asChild>
          <h1>Delete project?</h1>
        </Dialog.Title>
        <Dialog.Close asChild>
          <Fancy>Cancel</Fancy>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}

class Boundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { message: error.message }
  }

  render() {
    if (this.state.message) return <pre data-testid="error">{this.state.message}</pre>
    return this.props.children
  }
}

function NonButtonTrigger() {
  return (
    <Boundary>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <div>Delete project</div>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Delete project?</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>
    </Boundary>
  )
}

function SubmitTrigger() {
  return (
    <Boundary>
      <form onSubmit={(event) => event.preventDefault()}>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button type="submit">Delete project</button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Delete project?</Dialog.Title>
          </Dialog.Content>
        </Dialog.Root>
      </form>
    </Boundary>
  )
}

/**
 * The reason content unmounts: a form inside a closed dialog should not have to
 * be reset by hand on every close.
 */
function Mounting() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Delete project</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Delete project?</Dialog.Title>
        <input data-testid="field" defaultValue="" placeholder="type here" />
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}

/** Reports from inside the content, so the spec can see mounts happen at all. */
function MountReporter({ onMount }: { onMount(): void }) {
  useEffect(() => {
    onMount()
  }, [onMount])
  return null
}

function MountCounting() {
  const [mounts, setMounts] = useState(0)
  const onMount = useCallback(() => setMounts((n) => n + 1), [])

  return (
    <>
      <output data-testid="mounts">{mounts}</output>
      <Dialog.Root>
        <Dialog.Trigger>Delete project</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Delete project?</Dialog.Title>
          <span data-testid="body">body</span>
          <MountReporter onMount={onMount} />
          <Dialog.Close>Cancel</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

export const CASES: Record<string, ReactNode> = {
  plain: <Plain />,
  'default-open': <Plain defaultOpen />,
  'controlled-accept': <ControlledAccept />,
  'controlled-refuse-open': <ControlledRefuseOpen />,
  'controlled-refuse-close': <ControlledRefuseClose />,
  aschild: <AsChild />,
  'non-button-trigger': <NonButtonTrigger />,
  'submit-trigger': <SubmitTrigger />,
  mounting: <Mounting />,
  'mount-counting': <MountCounting />,
  ...PARITY_CASES,
  ...PRIMITIVE_CASES,
  ...OVERLAY_CASES,
  ...MENU_CASES,
  ...REST_CASES,
}
