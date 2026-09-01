---
'@apostel/bedrock': patch
---

Fix popover content emptying itself a frame after it opens.

`useOpenState` asked whether an element was open with `:open`, on the
assumption that it covers dialog, popover, details and select alike. It does
not: `:open` does not match an open popover in Chrome. So a frame after opening,
the DOM was read as closed and the content's children were unmounted while the
popover stayed open — visibly a flicker open followed by a collapse to the
smallest possible size, since the content is sized by `max-content` and there
was no longer any content.

Tooltip and HoverCard showed this every time. The read is shared by every
popover-backed primitive, but whether it bit depended on a race between the
queued `toggle` event, which set the flag back, and the `requestAnimationFrame`
that cleared it — and those land in a different order when `showPopover()` comes
from a timer rather than from a click.

Fixing it exposed a second bug it had been masking. Menus focus their first item
from an effect on the open state, which is set on `beforetoggle` — while the
popover is still `display: none`, where `focus()` does nothing. It only worked
because the open state was briefly cleared and re-set, running the effect a
second time, late enough to land. Focus now waits a frame, so it happens once,
deliberately, after the menu is painted.
