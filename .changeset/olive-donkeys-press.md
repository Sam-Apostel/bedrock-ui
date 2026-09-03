---
'@apostel/bedrock': minor
---

Tooltip and HoverCard now open on a long press, so both work on a touch screen.

Hold the trigger for half a second and the panel opens; lift and it stays,
without following the link or firing the trigger's `onClick`. A tap is still a
tap, and a finger that drifts is scrolling rather than pressing. Dismissal is
the popover's own light dismiss, so tapping anywhere else closes it.

Two smaller behaviour changes come with it:

- The trigger carries `-webkit-touch-callout: none` inline, and turns selection
  off for the length of a press, so iOS offers its own callout for neither. Both
  are only applied where the JavaScript intent path is running.
- Focus opens the panel where the browser calls that focus visible, rather than
  on any focus. Tapping a control focuses it on Android, and that focus should
  not open a tooltip.
