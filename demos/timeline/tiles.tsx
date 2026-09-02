import { useState, type ReactNode } from 'react'
import {
  Accordion,
  AlertDialog,
  AspectRatio,
  Checkbox,
  Collapsible,
  ContextMenu,
  Dialog,
  DropdownMenu,
  HoverCard,
  Label,
  Popover,
  Progress,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Tabs,
  Toast,
  Tooltip,
} from '../../src/index'

/**
 * One live component per tile in the grid.
 *
 * Every class name here is a hook for the era stylesheet and nothing else — no
 * tile styles itself. That is the argument the page is making: the same markup,
 * unchanged, is a Material button in 2016 and a brutalist one in 2023, because
 * a headless primitive has no opinion about either.
 *
 * These stay small deliberately. A tile is read at a glance from across a grid
 * of fifteen, so each shows the one interaction the component is for.
 */

function Panel({ children }: { children: ReactNode }) {
  return <div className="t-body">{children}</div>
}

function DialogTile() {
  return (
    <Panel>
      <Dialog.Root>
        <Dialog.Trigger className="t-btn">Rename project</Dialog.Trigger>
        <Dialog.Content className="t-panel t-dialog">
          <Dialog.Title className="t-title">Rename project</Dialog.Title>
          <Dialog.Description className="t-muted">Everyone on the team sees it.</Dialog.Description>
          <form method="dialog" className="t-row">
            <input className="t-field" name="name" placeholder="New name" autoComplete="off" />
            <Dialog.Close className="t-btn t-quiet">Cancel</Dialog.Close>
            <button type="submit" className="t-btn">
              Save
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </Panel>
  )
}

function AlertDialogTile() {
  return (
    <Panel>
      <AlertDialog.Root>
        <AlertDialog.Trigger className="t-btn t-danger">Delete</AlertDialog.Trigger>
        <AlertDialog.Content className="t-panel t-dialog">
          <AlertDialog.Title className="t-title">Delete this project?</AlertDialog.Title>
          <AlertDialog.Description className="t-muted">
            Every deployment goes with it.
          </AlertDialog.Description>
          <div className="t-row">
            <AlertDialog.Cancel className="t-btn t-quiet">Keep it</AlertDialog.Cancel>
            <AlertDialog.Action className="t-btn t-danger">Delete</AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Panel>
  )
}

function PopoverTile() {
  return (
    <Panel>
      <Popover.Root>
        <Popover.Trigger className="t-btn">Filters</Popover.Trigger>
        <Popover.Content className="t-panel" side="bottom" align="start" sideOffset={8}>
          <label className="t-check">
            <input type="checkbox" defaultChecked /> Open
          </label>
          <label className="t-check">
            <input type="checkbox" /> Archived
          </label>
          <Popover.Close className="t-btn t-quiet">Done</Popover.Close>
        </Popover.Content>
      </Popover.Root>
    </Panel>
  )
}

function TooltipTile() {
  return (
    <Panel>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger className="t-btn">Save</Tooltip.Trigger>
        <Tooltip.Content className="t-tip" side="top" sideOffset={6}>
          Saves without closing
        </Tooltip.Content>
      </Tooltip.Root>
    </Panel>
  )
}

function HoverCardTile() {
  return (
    <Panel>
      <HoverCard.Root openDelay={150} closeDelay={200}>
        <HoverCard.Trigger asChild>
          <a className="t-link" href="./index.html">
            @apostel/bedrock
          </a>
        </HoverCard.Trigger>
        <HoverCard.Content className="t-panel" side="bottom" align="start" sideOffset={8}>
          <strong className="t-title">bedrock</strong>
          <p className="t-muted">Headless primitives on native platform features.</p>
        </HoverCard.Content>
      </HoverCard.Root>
    </Panel>
  )
}

function DropdownMenuTile() {
  const [chosen, setChosen] = useState('')

  return (
    <Panel>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="t-btn">Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content className="t-panel t-menu" side="bottom" align="start" sideOffset={6}>
          <DropdownMenu.Label className="t-muted">Edit</DropdownMenu.Label>
          <DropdownMenu.Item className="t-item" onClick={() => setChosen('cut')}>
            Cut
          </DropdownMenu.Item>
          <DropdownMenu.Item className="t-item" onClick={() => setChosen('copy')}>
            Copy
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="t-sep" />
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="t-item">Share</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent className="t-panel t-menu">
              <DropdownMenu.Item className="t-item" onClick={() => setChosen('email')}>
                Email
              </DropdownMenu.Item>
              <DropdownMenu.Item className="t-item" onClick={() => setChosen('link')}>
                Copy link
              </DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <output className="t-out">{chosen || 'nothing chosen'}</output>
    </Panel>
  )
}

function ContextMenuTile() {
  const [chosen, setChosen] = useState('')

  return (
    <Panel>
      <ContextMenu.Root className="t-drop">
        Right-click here
        <ContextMenu.Content className="t-panel t-menu">
          <ContextMenu.Item className="t-item" onClick={() => setChosen('rename')}>
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item className="t-item" onClick={() => setChosen('duplicate')}>
            Duplicate
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
      <output className="t-out">{chosen || 'no action'}</output>
    </Panel>
  )
}

function SelectTile() {
  const [value, setValue] = useState('medium')

  return (
    <Panel>
      <Select.Root className="t-select" value={value} onValueChange={setValue} aria-label="Size">
        <Select.Trigger className="t-btn">
          <Select.Value />
        </Select.Trigger>
        <Select.Item className="t-item" value="small">
          Small
        </Select.Item>
        <Select.Item className="t-item" value="medium">
          Medium
        </Select.Item>
        <Select.Item className="t-item" value="large">
          Large
        </Select.Item>
      </Select.Root>
    </Panel>
  )
}

function AccordionTile() {
  return (
    <Panel>
      <Accordion.Root className="t-stack" type="single">
        {/*
          The class goes on Header, not Trigger: Header is the <summary> and
          Trigger is a span inside it, because a summary is already the button.
        */}
        <Accordion.Item className="t-fold" value="shipping">
          <Accordion.Header className="t-summary">
            <Accordion.Trigger>When does it ship?</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="t-fold-body">Within two working days.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item className="t-fold" value="returns">
          <Accordion.Header className="t-summary">
            <Accordion.Trigger>Can I return it?</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="t-fold-body">Thirty days, unopened.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Panel>
  )
}

function CollapsibleTile() {
  return (
    <Panel>
      <Collapsible.Root className="t-fold">
        <Collapsible.Trigger className="t-summary">Delivery details</Collapsible.Trigger>
        <Collapsible.Content className="t-fold-body">
          Ships from Rotterdam, tracked.
        </Collapsible.Content>
      </Collapsible.Root>
    </Panel>
  )
}

function TabsTile() {
  return (
    <Panel>
      <Tabs.Root className="t-stack" defaultValue="editor">
        <Tabs.List className="t-tabs">
          <Tabs.Trigger className="t-tab" value="editor">
            Editor
          </Tabs.Trigger>
          <Tabs.Trigger className="t-tab" value="preview">
            Preview
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="t-tab-body" value="editor">
          Arrow keys move between these, because a tab list is one tab stop.
        </Tabs.Content>
        <Tabs.Content className="t-tab-body" value="preview">
          Nothing to preview yet.
        </Tabs.Content>
      </Tabs.Root>
    </Panel>
  )
}

function FormsTile() {
  return (
    <Panel>
      <div className="t-row">
        <Checkbox.Root className="t-box" id="tl-ship" />
        <Label.Root htmlFor="tl-ship">Email me when it ships</Label.Root>
      </div>
      <div className="t-row">
        <Switch.Root className="t-switch" id="tl-beta" />
        <Label.Root htmlFor="tl-beta">Join the beta</Label.Root>
      </div>
      <RadioGroup.Root className="t-row" defaultValue="standard">
        <RadioGroup.Item className="t-box" value="standard" id="tl-standard" />
        <Label.Root htmlFor="tl-standard">Standard</Label.Root>
        <RadioGroup.Item className="t-box" value="express" id="tl-express" />
        <Label.Root htmlFor="tl-express">Express</Label.Root>
      </RadioGroup.Root>
    </Panel>
  )
}

function SliderTile() {
  const [value, setValue] = useState(40)

  return (
    <Panel>
      {/*
        Track, Range and Thumb are omitted rather than styled: they render
        nothing, because an <input> has no children. The era stylesheet reaches
        the bar and the handle through ::-webkit-slider-runnable-track and
        ::-webkit-slider-thumb on the root, which is where they live.
      */}
      <Slider.Root
        className="t-slider"
        aria-label="Volume"
        defaultValue={40}
        min={0}
        max={100}
        step={5}
        onValueChange={setValue}
      />
      <output className="t-out">{value}</output>
    </Panel>
  )
}

function ToastTile() {
  const [toasts, setToasts] = useState<number[]>([])

  return (
    <Panel>
      <Toast.Provider duration={4000}>
        <button
          type="button"
          className="t-btn"
          onClick={() => setToasts((current) => [...current, Date.now()])}
        >
          Save
        </button>
        <Toast.Viewport className="t-toasts">
          {toasts.map((id) => (
            <Toast.Root className="t-panel t-toast" key={id}>
              <Toast.Title className="t-title">Saved</Toast.Title>
              <Toast.Close className="t-btn t-quiet">Dismiss</Toast.Close>
            </Toast.Root>
          ))}
        </Toast.Viewport>
      </Toast.Provider>
    </Panel>
  )
}

function DisplayTile() {
  return (
    <Panel>
      <Progress.Root className="t-progress" value={62} max={100} />
      <AspectRatio.Root className="t-ratio" ratio={16 / 9}>
        <span>16 / 9</span>
      </AspectRatio.Root>
    </Panel>
  )
}

export const TILES: Record<string, () => ReactNode> = {
  dialog: DialogTile,
  'alert-dialog': AlertDialogTile,
  popover: PopoverTile,
  tooltip: TooltipTile,
  'hover-card': HoverCardTile,
  'dropdown-menu': DropdownMenuTile,
  'context-menu': ContextMenuTile,
  select: SelectTile,
  accordion: AccordionTile,
  collapsible: CollapsibleTile,
  tabs: TabsTile,
  forms: FormsTile,
  slider: SliderTile,
  toast: ToastTile,
  display: DisplayTile,
}
