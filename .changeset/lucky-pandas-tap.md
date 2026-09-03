---
'@apostel/bedrock': patch
---

Correct the documented behaviour of `/controlled` for `<details>`-backed
primitives. `Collapsible` and `Accordion` were described as putting the
disclosure back if you declined a toggle, "one frame of visible movement, then
back". They do not, and never did: `<details>` fires no `beforetoggle` and no
`cancel`, so `onOpenChange` is told about a move that has already happened and
returning early from it changes nothing.

No runtime behaviour changed. If you wrote a guard in `onOpenChange` on a
Collapsible or Accordion expecting it to hold, it never did — move it to
`preventDefault()` on the Trigger's click, which cancels the toggle before it
happens, for pointer and keyboard alike. The other primitives are unaffected:
Dialog, AlertDialog and everything popover-backed still refuse before anything
moves.
