---
'@apostel/bedrock': minor
---

First release: 29 headless React primitives with Radix-shaped anatomy, built on
the top layer, invoker commands, anchor positioning and native form controls.

**Top layer** — Dialog, AlertDialog, Popover, Tooltip, HoverCard, DropdownMenu,
ContextMenu, Menubar, NavigationMenu, Toast.

**The native element** — Checkbox, Switch, RadioGroup, Select, Slider, Progress,
Separator, Label, AspectRatio, ScrollArea, Collapsible, Accordion.

**JavaScript, and honest about it** — Tabs, Toolbar, ToggleGroup, Toggle, Avatar,
AccessibleIcon, VisuallyHidden.

Every primitive with open state has two roots. `@apostel/bedrock` is the DOM
opening and closing itself; `@apostel/bedrock/controlled` gives React a veto.
They are separate module graphs, checked in CI.

Closed content unmounts, which is what makes the uncontrolled roots
uncontrolled: closing discards what the content was holding, so a form resets
itself with nothing wired to `onOpenChange`.

102 Playwright specs against real Chrome, including Radix's own Dialog suite
ported verbatim — 30 pass, none fail, 13 test machinery this library exists to
delete.

`0.1.0` rather than `1.0.0` deliberately: several questions in `docs/gaps.md`
have answers that would change public API, and semver before 1.0 leaves room
for them.
