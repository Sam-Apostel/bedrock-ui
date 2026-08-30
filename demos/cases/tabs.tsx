import { Tabs, Toolbar, ToggleGroup } from '../../src/index'

/**
 * Tabs and Toolbar are the roving-tabindex family: the whole set is one tab
 * stop and arrow keys move within it. HTML has no tab widget, so this is
 * written rather than borrowed — and it is the same roving implementation the
 * menus use.
 */
export default function TabsDemo() {
  return (
    <div style={{ width: '100%' }}>
      <Tabs.Root defaultValue="editor">
        <Tabs.List>
          <Tabs.Trigger value="editor">Editor</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="editor">
          <Toolbar.Root aria-label="Formatting">
            <ToggleGroup.Root type="multiple">
              <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
              <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
            </ToggleGroup.Root>
            <Toolbar.Separator />
            <Toolbar.Button>Insert link</Toolbar.Button>
          </Toolbar.Root>
        </Tabs.Content>
        <Tabs.Content value="preview">Nothing to preview yet.</Tabs.Content>
        <Tabs.Content value="settings">Settings for this document.</Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
