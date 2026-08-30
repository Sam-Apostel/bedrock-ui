---
'@apostel/bedrock': patch
---

Fix dropped DOM events caused by ref callbacks changing identity every render.

`composeRefs` returns a new function on each call, and React treats a new ref
callback as a different ref — so every composed ref was detached and reattached
on every render. For a ref that stores a node that is merely wasteful; for one
that attaches listeners it is a bug. An event arriving between the detach and
the attach is dropped and nothing re-delivers it, so a popover that opened in
that window stayed open with its content never mounted: the `toggle` that would
have told React went nowhere.

`useComposedRefs` is the same thing with a stable identity, and every part now
uses it. `composeRefs` is unchanged and still exported for use outside a
component.

`useInterest` had the same shape of bug in its own effect — no dependency array,
so it rebuilt its listeners on every render, and opening a hover card is itself
a render. Listeners are now attached when a node registers.
