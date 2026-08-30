import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  ContextMenu,
  DropdownMenu,
  Menubar,
  NavigationMenu,
  Tabs,
  ToggleGroup,
  Toolbar,
} from '../../src/index'

function MenuCase() {
  const [chosen, setChosen] = useState('')

  return (
    <div style={{ padding: 80 }}>
      <output data-testid="chosen">{chosen}</output>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger data-testid="trigger">Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content data-testid="content">
          <DropdownMenu.Item data-testid="cut" onClick={() => setChosen('cut')}>
            Cut
          </DropdownMenu.Item>
          <DropdownMenu.Item data-testid="copy" onClick={() => setChosen('copy')}>
            Copy
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger data-testid="share">Share</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent data-testid="sub-content">
              <DropdownMenu.Item data-testid="email" onClick={() => setChosen('email')}>
                Email
              </DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  )
}

function ContextMenuCase() {
  return (
    <div style={{ padding: 40 }}>
      <ContextMenu.Root data-testid="area">
        <div style={{ width: 200, height: 120, background: '#eee' }}>Right-click me</div>
        <ContextMenu.Content data-testid="content">
          <ContextMenu.Item data-testid="item">Inspect</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </div>
  )
}

function TabsCase() {
  return (
    <Tabs.Root defaultValue="one">
      <Tabs.List data-testid="list">
        <Tabs.Trigger value="one" data-testid="tab-one">
          One
        </Tabs.Trigger>
        <Tabs.Trigger value="two" data-testid="tab-two">
          Two
        </Tabs.Trigger>
        <Tabs.Trigger value="three" data-testid="tab-three">
          Three
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one" data-testid="panel-one">
        <input data-testid="field-one" defaultValue="" />
      </Tabs.Content>
      <Tabs.Content value="two" data-testid="panel-two">
        Panel two
      </Tabs.Content>
      <Tabs.Content value="three" data-testid="panel-three">
        Panel three
      </Tabs.Content>
    </Tabs.Root>
  )
}

function ToolbarCase() {
  return (
    <Toolbar.Root data-testid="toolbar">
      <ToggleGroup.Root type="multiple" data-testid="group">
        <ToggleGroup.Item value="bold" data-testid="bold">
          Bold
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic" data-testid="italic">
          Italic
        </ToggleGroup.Item>
      </ToggleGroup.Root>
      <Toolbar.Separator />
      <Toolbar.Button data-testid="button">Insert</Toolbar.Button>
      <Toolbar.Link href="/help" data-testid="link">
        Help
      </Toolbar.Link>
    </Toolbar.Root>
  )
}

function MenubarCase() {
  return (
    <Menubar.Root data-testid="menubar">
      <Menubar.Menu>
        <Menubar.Trigger data-testid="file">File</Menubar.Trigger>
        <Menubar.Content data-testid="file-menu">
          <Menubar.Item data-testid="new">New</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger data-testid="edit">Edit</Menubar.Trigger>
        <Menubar.Content data-testid="edit-menu">
          <Menubar.Item data-testid="undo">Undo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar.Root>
  )
}

function NavigationMenuCase() {
  return (
    <NavigationMenu.Root data-testid="nav" aria-label="Main">
      <NavigationMenu.List data-testid="list">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger data-testid="products">Products</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="products-content">
            <NavigationMenu.Link href="/hosting" data-testid="hosting">
              Hosting
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/domains" data-testid="domains">
              Domains
            </NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/pricing" active data-testid="pricing">
            Pricing
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/docs" data-testid="docs">
            Docs
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Viewport />
    </NavigationMenu.Root>
  )
}

export const MENU_CASES: Record<string, ReactNode> = {
  menu: <MenuCase />,
  'context-menu': <ContextMenuCase />,
  tabs: <TabsCase />,
  toolbar: <ToolbarCase />,
  menubar: <MenubarCase />,
  'navigation-menu': <NavigationMenuCase />,
}
