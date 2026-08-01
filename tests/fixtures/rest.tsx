import type { ReactNode } from 'react'
import { useState } from 'react'
import { AlertDialog, ScrollArea, Select, Slider, Toast } from '../../src/index'

function SelectCase() {
  const [value, setValue] = useState('two')

  return (
    <>
      <output data-testid="value">{value}</output>
      <Select.Root data-testid="select" value={value} onValueChange={setValue}>
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Item value="one" data-testid="one">
          One
        </Select.Item>
        <Select.Item value="two" data-testid="two">
          Two
        </Select.Item>
        <Select.Item value="three" data-testid="three">
          Three
        </Select.Item>
      </Select.Root>
    </>
  )
}

function SliderCase() {
  const [value, setValue] = useState(25)

  return (
    <>
      <output data-testid="value">{value}</output>
      <Slider.Root
        data-testid="slider"
        defaultValue={25}
        min={0}
        max={100}
        step={5}
        onValueChange={setValue}
      >
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>
    </>
  )
}

function ScrollAreaCase() {
  return (
    <ScrollArea.Root data-testid="scroll" style={{ height: 100, width: 200 }}>
      <ScrollArea.Viewport data-testid="viewport">
        <div style={{ height: 600 }}>Tall content</div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar />
    </ScrollArea.Root>
  )
}

function AlertDialogCase() {
  const [result, setResult] = useState('')

  return (
    <>
      <output data-testid="result">{result}</output>
      <AlertDialog.Root>
        <AlertDialog.Trigger data-testid="trigger">Delete</AlertDialog.Trigger>
        <AlertDialog.Content data-testid="content">
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
          <AlertDialog.Cancel data-testid="cancel" onClick={() => setResult('cancelled')}>
            Cancel
          </AlertDialog.Cancel>
          <AlertDialog.Action data-testid="action" onClick={() => setResult('deleted')}>
            Delete
          </AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}

function ToastCase() {
  const [toasts, setToasts] = useState<number[]>([])

  return (
    <Toast.Provider duration={300}>
      <button type="button" data-testid="add" onClick={() => setToasts((t) => [...t, t.length])}>
        Notify
      </button>
      <Toast.Viewport data-testid="viewport">
        {toasts.map((id) => (
          <Toast.Root key={id} data-testid={`toast-${id}`}>
            <Toast.Title>Saved</Toast.Title>
            <Toast.Close data-testid={`close-${id}`}>Dismiss</Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Provider>
  )
}

export const REST_CASES: Record<string, ReactNode> = {
  select: <SelectCase />,
  slider: <SliderCase />,
  'scroll-area': <ScrollAreaCase />,
  'alert-dialog': <AlertDialogCase />,
  toast: <ToastCase />,
}
