---
'@apostel/bedrock': patch
---

Three fixes to press-and-hold on a touch screen, and one to `popover="hint"`
that reaches every engine but Chrome.

**A tooltip could not be dismissed on Safari, Firefox, or any iOS browser.**
`Tooltip.Content` wrote `popover="hint"` unconditionally. `popover` is an
enumerated attribute whose invalid-value default is `manual`, so on an engine
without `hint` that is not a tooltip that layers badly — it is a tooltip that
light dismiss and Escape never reach. It now asks first and writes `auto` where
`hint` would not be honoured, which is what the docs already claimed.
`Popover.Root`'s `kind` prop resolves the same way.

**A tooltip now goes when you lift your finger.** It is a label held up while
you press, not somewhere to go. A hover card still stays: it has content to
reach into, and tapping elsewhere dismisses it.

**The hold is shorter, and depends on the trigger.** It was a flat 500ms. A
trigger that does nothing when tapped — an info icon — has no tap to protect and
opens after 150ms. One that does something (an `onClick`, a link, a submit
button) waits 250ms, just past the length of a tap. Neither is `delayDuration`.
