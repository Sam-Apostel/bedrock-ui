import { Component, useEffect, useState, type ReactNode } from 'react'
import { Dialog, DropdownMenu } from '../../src/index'

/**
 * Fixtures for `tests/radix-parity.spec.ts` — ports of the render trees in
 * Radix's own `dialog.test.tsx`, kept as close to the originals as the API
 * allows so the comparison means something. Their `Overlay` and `Portal` are
 * dropped rather than replaced; there is nothing to map them onto.
 *
 * Refs are asserted through an attribute the ref callback sets, since the
 * assertion has to survive the trip into the browser.
 */

const OPEN_TEXT = 'Open'
const CLOSE_TEXT = 'Close'
const TITLE_TEXT = 'Title'

const markRef = (node: HTMLElement | null) => node?.setAttribute('data-ref-attached', '')

function Default() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>{OPEN_TEXT}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{TITLE_TEXT}</Dialog.Title>
        <Dialog.Close>{CLOSE_TEXT}</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function Labelled() {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function CustomLabel() {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Content aria-label="Custom label">
        <Dialog.Description>Description</Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function TitleOnly() {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function ExistingDescribedBy() {
  return (
    <>
      <span id="existing-description">Existing description</span>
      <span id="shared-description">Shared description</span>
      <Dialog.Root defaultOpen>
        <Dialog.Content
          aria-describedby={' existing-description\texisting-description shared-description '}
        >
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

function ToggleReferences() {
  const [showText, setShowText] = useState(false)

  // The toggle lives inside the dialog: it is modal, so a control outside it is
  // inert and cannot be clicked.
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Content aria-label="Custom label">
        <button type="button" data-testid="toggle" onClick={() => setShowText((v) => !v)}>
          toggle
        </button>
        {showText ? <Dialog.Title>Title</Dialog.Title> : null}
        {showText ? <Dialog.Description>Description</Dialog.Description> : null}
      </Dialog.Content>
    </Dialog.Root>
  )
}

const STYLE = { outlineColor: 'rgb(1, 2, 3)' }

function Spread({ asChild = false, open = true }: { asChild?: boolean; open?: boolean }) {
  const [clicks, setClicks] = useState<string[]>([])
  const count = (part: string) => () => setClicks((c) => [...c, part])

  const trigger = (
    <Dialog.Trigger
      asChild={asChild}
      ref={markRef}
      data-testid="trigger"
      className="custom-class"
      style={STYLE}
      onClick={count('trigger')}
    >
      {asChild ? <button type="button">{OPEN_TEXT}</button> : OPEN_TEXT}
    </Dialog.Trigger>
  )

  return (
    <>
      <output data-testid="clicks">{clicks.join(',')}</output>
      <Dialog.Root defaultOpen={open}>
        {trigger}
        <Dialog.Content
          ref={markRef}
          data-testid="content"
          className="custom-class"
          style={STYLE}
          onClick={count('content')}
        >
          <Dialog.Title
            asChild={asChild}
            ref={markRef}
            data-testid="title"
            className="custom-class"
            style={STYLE}
            onClick={count('title')}
          >
            {asChild ? <h1>{TITLE_TEXT}</h1> : TITLE_TEXT}
          </Dialog.Title>
          <Dialog.Description
            asChild={asChild}
            ref={markRef}
            data-testid="description"
            className="custom-class"
            style={STYLE}
            onClick={count('description')}
          >
            {asChild ? <span>Description</span> : 'Description'}
          </Dialog.Description>
          <Dialog.Close
            asChild={asChild}
            ref={markRef}
            data-testid="close"
            className="custom-class"
            style={STYLE}
            onClick={count('close')}
          >
            {asChild ? <button type="button">{CLOSE_TEXT}</button> : CLOSE_TEXT}
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

/**
 * Radix's e2e removes the element that currently holds focus. showModal() puts
 * focus on `first`, so the removal has to happen without a click — a click would
 * move focus first and defeat the point.
 */
function FocusTrap() {
  const [showFirst, setShowFirst] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowFirst(false), 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <button type="button" data-testid="outside">
        outside
      </button>
      <Dialog.Root defaultOpen>
        <Dialog.Content>
          <Dialog.Title>{TITLE_TEXT}</Dialog.Title>
          {showFirst ? (
            <button type="button" data-testid="first">
              first
            </button>
          ) : null}
          <button type="button" data-testid="second">
            second
          </button>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

/** Content with asChild, which now has to be a <dialog>. */
function ContentAsChild() {
  const [clicks, setClicks] = useState(0)
  const [log, setLog] = useState<string[]>([])

  return (
    <>
      <output data-testid="clicks">{clicks}</output>
      <output data-testid="log">{log.join(',')}</output>
      <Dialog.Root defaultOpen onOpenChange={(open) => setLog((l) => [...l, String(open)])}>
        <Dialog.Content
          asChild
          ref={markRef}
          data-testid="content"
          className="content"
          onClick={() => setClicks((n) => n + 1)}
        >
          <dialog>
            <Dialog.Title>{TITLE_TEXT}</Dialog.Title>
            <Dialog.Close>{CLOSE_TEXT}</Dialog.Close>
          </dialog>
        </Dialog.Content>
      </Dialog.Root>
    </>
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

function ContentNotADialog() {
  return (
    <Boundary>
      <Dialog.Root>
        <Dialog.Content asChild>
          <article>
            <Dialog.Title>{TITLE_TEXT}</Dialog.Title>
          </article>
        </Dialog.Content>
      </Dialog.Root>
    </Boundary>
  )
}

/** A menu inside a modal dialog: two close watchers, nested. */
function DialogWithMenu() {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Content data-testid="dialog">
        <Dialog.Title>{TITLE_TEXT}</Dialog.Title>
        <button type="button" data-testid="inside">
          Something else
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger data-testid="menu-trigger">Actions</DropdownMenu.Trigger>
          <DropdownMenu.Content data-testid="menu">
            <DropdownMenu.Item data-testid="menu-item">Rename</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export const PARITY_CASES: Record<string, ReactNode> = {
  'content-aschild': <ContentAsChild />,
  'content-not-a-dialog': <ContentNotADialog />,
  'dialog-with-menu': <DialogWithMenu />,
  'parity-default': <Default />,
  'parity-labelled': <Labelled />,
  'parity-custom-label': <CustomLabel />,
  'parity-title-only': <TitleOnly />,
  'parity-existing-describedby': <ExistingDescribedBy />,
  'parity-toggle-refs': <ToggleReferences />,
  'parity-spread': <Spread />,
  'parity-spread-closed': <Spread open={false} />,
  'parity-spread-aschild': <Spread asChild />,
  'parity-spread-aschild-closed': <Spread asChild open={false} />,
  'parity-focus-trap': <FocusTrap />,
}
