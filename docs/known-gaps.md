# Known gaps

What is missing, thin or unfinished in what exists today. The argument about
whether to adopt at all is on [should you switch?](./should-you-switch.md).

Ordered by how likely each one is to bite.

## Missing behaviour

Each of these is a thing Radix does that bedrock does not. None is a bug; each
is a decision, and the reason is in the last column.

| Gap | What you lose | Why |
| --- | --- | --- |
| **No scroll lock** | With a modal dialog open, the page behind it still scrolls on wheel. `showModal()` makes the background inert to *interaction*, not to scrolling. | `react-remove-scroll` is part of the 13.7 kB you deleted. `html:has(dialog:modal) { overflow: hidden }` gets it back, and `scrollbar-gutter: stable` on the root pays for the layout shift with nothing measured; these docs do exactly that, in `styles/site.css`. The root is the only scroller that needs it: the backdrop hit-tests to the `<dialog>`, and a modal dialog is `position: fixed`, so the scroll chain is the viewport, never a scroller the dialog happens to sit inside and never one the pointer is over. It stays yours rather than ours because whether the page behind freezes is a decision about your layout, not about the dialog. |
| **Slider takes one value** | No two-thumb range. | A range input has one thumb. Two thumbs is two inputs sharing a track: a different component, not a prop. |
| **Toast has no swipe-to-dismiss** | Pointer-gesture dismissal. | No native equivalent. Left out rather than half-implemented. |
| **Accordion cannot refuse to close** | Radix's `collapsible={false}`, where the open item stays open until another is chosen. | `type="single"` is `<details name>`, and a `<summary>` toggles. No native equivalent. |
| **No missing-`Title` warning** | Radix's development warning that a dialog has no accessible name. | `aria-labelledby` is only written when a `Title` is rendered, so the reference can no longer dangle, but nothing tells you the name is absent. |
| **`id` on `Dialog.Content` is not forwarded** | Passing one is silently ignored. | The trigger's `commandfor` points at it. The one exception to "every part forwards `id`". |

## Wrong or overstated

| Where | The problem |
| --- | --- |
| `validate-trigger.ts` | Its message says a non-button trigger costs you "implicit `aria-expanded`". Measured: a popover invoker gets that from the platform, a dialog invoker does not, because `Dialog.Trigger` writes it by hand. Right for Popover and Tooltip, wrong for the primitive most people hit it on. |
| `create-controlled-root.ts`, and [controlled state](./state.md) with it | Three places promise that refusing a close on `<details>` costs "one frame of visible movement, then back". Measured: it does not come back. The reconciling effect is keyed on `[node, open, adapter]`, and a refusal is precisely the case where none of the three changes, so the effect never re-runs and a refused Collapsible or Accordion is left closed with `open` still `true`. Nothing in `tests/controlled.spec.ts` covers the `<details>` refusal path, which is how it got this far. The cancelable elements are unaffected: Dialog, AlertDialog and every popover-backed primitive refuse before anything moves, and there is a demo of that on [controlled state](./state.md). |

## Thin coverage

The tests are real and they run against a real browser. What they do not do is
cover evenly.

| Area | State |
| --- | --- |
| Dialog | Radix's own suite ported, plus 20 specs. The deepest by a distance. |
| Most primitives | Between one and seven specs: enough to catch the design being wrong, not every regression. |
| Menubar, NavigationMenu, ContextMenu | The thinnest. |
| Appearance | Nothing. Playwright asserts behaviour, never how it looks, so the transition sequencing `bedrock.css` demonstrates, the thing most likely to regress silently, has no test at all. |
| Bundle size | The per-primitive figures are measured by hand, not asserted in CI. |
| Other engines | The suite runs Chrome. A cross-browser matrix today would report failures that are the documented state of the world rather than regressions. That is a defensible reason not to have one, and not a reason to trust the other engines. |

## The registry is incomplete and unproven

24 items cover everything that was Radix-backed except `menubar`,
`navigation-menu`, `toast`, `sheet` and `drawer`.

Five of them now render on the [registry page](./shadcn-registry.md) from the
shipped files, which catches a wrong class name or a missing export in those
five. The other nineteen have never been installed into a real shadcn app and
looked at, and nothing renders any of them in a Next.js project the way a
consumer would.

## Documentation

Every primitive has a reference page and a running demo, and every demo is
asserted to mount and to work. What is left:

- **The demos run in one browser.** Built and tested against Chrome, like the
  rest of the suite. A reader on Safari or Firefox sees the same page and may
  see a primitive degrade. That is documented on
  [browser support](./compat.md) and not demonstrated.
- **No visual regression testing.** A demo can mount, pass its interaction test,
  and still look broken. Nothing catches that.
