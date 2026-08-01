# Changelog

## Unreleased

Pre-alpha. Nothing is published yet, so nothing is stable.

### Added

All 29 primitives:

- **Top layer** — Dialog, AlertDialog, Popover, Tooltip, HoverCard,
  DropdownMenu, ContextMenu, Menubar, NavigationMenu, Toast
- **Native element** — Checkbox, Switch, RadioGroup, Select, Slider, Progress,
  Separator, Label, AspectRatio, ScrollArea, Collapsible, Accordion
- **JavaScript, and honest about it** — Tabs, Toolbar, ToggleGroup, Toggle,
  Avatar, AccessibleIcon, VisuallyHidden

Shared internals: `Slot`, `composeRefs`, `open-state`, `client-render`,
`anchor`, `roving`, `interest`, `capabilities`, `validateTrigger`, and
`useControlledRoot`. Controlled roots for every primitive with state.

- `bedrock.css`, optional, demonstrating enter and exit transitions with no
  presence wrapper.
- 97 Playwright specs against real Chrome, including Radix's own Dialog suite
  ported verbatim, and a test that rendered markup still works with JavaScript
  disabled entirely.
- Documentation under `docs/`, a Radix migration guide, a live browser compat
  page, and a shadcn registry.

### Changed

- Closed content unmounts. That is what makes the uncontrolled roots
  uncontrolled: closing discards what the content was holding, so a form resets
  itself with nothing wired to `onOpenChange`.

### Known gaps

See `docs/gaps.md`. The short version: your existing jsdom component tests stop
working, Chrome is the only tested engine, several parts render nothing because
the platform draws them, and `Dialog.Content` has no `asChild`.
