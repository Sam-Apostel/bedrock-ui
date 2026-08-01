# AGENTS.md

Handoff for the agent taking over implementation of **bedrock**.

Read this whole file before writing code. It is the single source of truth for
architecture and design decisions. Where this file and the README disagree, this
file wins and the README is the bug.

---

## 1. What bedrock is

Headless React primitives with Radix-shaped anatomy, implemented on native
platform features instead of on JavaScript that reimplements them.

Radix-**shaped**, not Radix-compatible. Same compound-component structure, same
part names, same `asChild`. Different foundation, and where the platform's model
conflicts with Radix's API we follow the platform and document the difference.

Zero runtime dependencies. React and react-dom are peers. This is enforced by a
lint rule, not by discipline.

Current state: all 29 primitives exist. The shared internals are `slot`,
`compose-refs`, `open-state`, `client-render`, `anchor`, `roving`, `interest`,
`capabilities`, `validate-trigger` and `create-controlled-root`.

---

## 2. Non-negotiables

Violating any of these is a bug even if tests pass. If you believe one is wrong,
stop and raise it — do not work around it.

1. **No runtime dependencies.** Not for positioning, not for focus, not for
   merging class names.
2. **Child parts never branch on controlled vs uncontrolled.** See §3.
3. **The default entry point never imports from `controlled` or
   `create-controlled-root`.** Enforced by dependency-cruiser.
4. **No platform feature name appears in a public prop.** See §5.
5. **No fallback that repairs a misused trigger.** See §6.
6. **Every part renders exactly one element and forwards `className`, `style`,
   `id`, `ref`, and unknown props.**
7. **No `useEffect` that opens, closes, positions, or measures anything the
   browser can do declaratively.** If you're writing one, you've probably missed
   a platform feature. Check §5 first.

---

## 3. Architecture

### The state model: DOM leads, React vetoes

Open state lives in the DOM. React does not own it, mirror it, or drive it in
the common case. This is the inversion the whole library rests on.

```
Trigger  --commandfor/command-->  Content
   (the browser wires these together; no JS in the open path)
```

### Two roots, shared parts

Each primitive with open state has two roots and one set of parts.

```
src/dialog/
  root.tsx             plain root      → exported from src/index.ts
  controlled-root.tsx  controlled root → exported from src/controlled.ts
  parts.tsx            Trigger, Content, Close, Title, Description — SHARED
  shared.ts            context, adapter, escape-hatch hook
```

Both roots publish the identical context shape:

```ts
interface RootContextValue {
  id: string
  registerContent(node: HTMLElement | null): void
}
```

Parts consume that context and nothing else. They cannot tell which root they
are under, and must not try. **This is the reason the split saves bytes rather
than relocating them.** The moment a part contains `if (isControlled)`, that
branch ships in both bundles and the entire packaging story collapses.

The plain root's `registerContent` attaches at most a `toggle` listener. The
controlled root's wires the veto and reconciliation. Same signature, different
weight.

### The controlled mechanism

`useControlledRoot` in `src/create-controlled-root.ts` is the whole controlled
layer, generic over an `OpenStateAdapter`. Adding a controlled primitive means
writing a ~6-line adapter, not a new root implementation.

```ts
interface OpenStateAdapter {
  isOpen(node): boolean
  open(node): void
  close(node): void
  closeVetoEvent?: string   // e.g. <dialog>'s 'cancel'
}
```

Sequence:

1. `beforetoggle` fires. Where cancelable and the `open` prop disagrees →
   `preventDefault()`. Nothing moved.
2. `onOpenChange` fires regardless. The consumer decides.
3. An effect on `open` reconciles the DOM when the prop changes without user
   interaction.

Where step 1 is unavailable, step 3 is the whole mechanism and there is one
frame of visible movement in the refusal case. Accepted tradeoff. Do not add a
synchronous re-render or a `flushSync` to avoid it.

### Read-only `onOpenChange` on the plain root

Deliberate, and load-bearing for adoption. Most "controlled" usage in the wild
is really *"tell me when it closed so I can reset a form."* That gets served by
a `toggle` listener on the cheap root, which removes roughly half the reasons to
import `/controlled`. Keep this. Do not "simplify" by moving `onOpenChange` to
the controlled root only.

---

## 4. Design decisions

Recorded with reasoning so you don't helpfully undo them. Each was chosen over a
named alternative.

### D1 — Two roots instead of one root with an optional `open` prop

*Rejected:* a single root that switches on whether `open` is defined.

*Why:* the reconciliation layer would ship to every consumer including the
majority who never control anything. Two roots plus subpath exports gives a hard
bundle guarantee.

*Cost:* two exports of the same name, and consumers aliasing if they need both
variants of one primitive in a single file. Rare, accepted.

### D2 — Same component names in both entry points

*Rejected:* `ControlledDialogRoot` / `Dialog.ControlledRoot`.

*Why:* migration should be a one-line import change and a mechanical codemod,
not a JSX rewrite. `import { Dialog } from 'bedrock/controlled'` reads as a
configuration choice, which is what it is.

### D3 — Subpath export, not a second npm package

*Rejected:* `@apostel/bedrock-controlled`.

*Why:* subpath exports are already separate module graphs, so the guarantee is
identical. A second package adds version skew, two installs, split docs, and a
peer-dependency dance for zero additional benefit.

### D4 — Dev throw, prod `console.error`, no repair, for misused triggers

*Rejected:* attaching a click handler and `aria-expanded` sync when the trigger
isn't a `<button>`.

*Why:* three reasons, in order of weight.
1. The fallback *is* the imperative trigger machinery the library exists to
   delete. Shipping it to every consumer unconditionally undercuts the premise.
2. A fallback that works is a fallback nobody removes. It converts a hard error
   into a permanent silent tax and removes all pressure to use a button.
3. The dev throw fires at mount, immediately. The population it fails to reach —
   someone who wrote a trigger, never rendered it in development, and shipped —
   is nearly empty, and the prod `console.error` covers it.

`useDialogTrigger()` is the named, documented escape hatch. Accessibility burden
visibly transfers to the caller.

**Do not add a fallback. Do not downgrade the dev throw to a warning.**

### D5 — Validation runs in a ref callback, not at render

`asChild` means the child may be `<MyButton>` which may render a `<button>`. You
cannot know from `child.type`. Only the DOM knows. The ref is already composed,
so `node.tagName` costs nothing.

### D6 — Allowed tags are per-invoker-kind, not global

`commandfor` works on `<button>` only. `interestfor` also works on `<a>`, which
is exactly what makes link previews and hover cards possible. Tooltip and
HoverCard triggers must accept anchors; Dialog and Popover triggers must not.
The allowlist lives in `validate-trigger.ts`.

### D7 — `Close` uses `command="request-close"`, never `close`

`close` skips the `cancel` event, which is the only cancelable close hook a
`<dialog>` exposes. Using it would make the controlled root unable to refuse a
close.

### D7a — the adapter's `close` is `close()`, and only there

D7 governs the `Close` *part*, which must stay `request-close` so the user's
close is offered to `cancel` and can be refused.

`OpenStateAdapter.close` is the opposite situation: it runs only from
reconciliation, after React has already decided. Asking again is both wrong and
impossible — see §7. Adapters for close-watcher-backed elements (`<dialog>`,
popovers, and anything with `closedby`) must close outright.

### D11 — content children mount only while open

*Rejected:* leaving the subtree mounted because the element is in the DOM anyway.

*Why:* it is what makes the plain root usable. "Uncontrolled" is only true if
closing actually discards what the content was holding; otherwise every consumer
writes the same `onOpenChange` handler to reset a form, which is the state-driven
code this library exists to remove. It also stops every closed dialog on a page
from running its children's effects and fetches at load.

Three timings make it safe, all in `open-state.ts` and all tested:

- mount on `beforetoggle`, not `toggle`, so the element is never painted empty
  and `showModal()` has a real control to focus
- put the flag back if a controlled root refuses the open
- unmount only once the exit animation has finished, and reuse the subtree if it
  reopens inside that window

The element itself is always rendered — `commandfor` must resolve — and content
is present when server-rendered and for the hydrating render, so a page without
JavaScript still has a working dialog.

*Cost:* no `forceMount` equivalent, and the root now re-renders on open and
close where it previously did not.

### D8 — React 19 minimum

`ref` as a regular prop removes `forwardRef` from every component and keeps
`Slot` around 40 lines. Not worth supporting 18 for.

### D9 — Chrome-first is a shipping decision, not an architectural one

See §5. It must stay reversible.

### D10 — The bundle guarantee is a lint rule

`.dependency-cruiser.cjs`. A convenience re-export could break it invisibly in a
diff nobody flags. Run `npm run lint:graph` in CI.

---

## 5. Platform features, and the reversibility rule

Target: latest Chrome. Other engines follow.

**Safe bets** — standardized, other engines shipping or committed:
`popover`, `<dialog>`, invoker commands, anchor positioning, `@starting-style`,
`transition-behavior: allow-discrete`, `:open`, `<details name>`,
`appearance: base-select`, `popover=hint`, `interpolate-size`, `calc-size()`,
`::scroll-marker`, `::scroll-button`, `<dialog closedby>`.

**Genuine risk** — not standardized:
`interestfor` / `:interest-source`. This drives Tooltip and HoverCard. Treat as
replaceable.

### The rule

**No public prop may be named after, or shaped by, a platform feature.**

`Tooltip.Root` takes `delayDuration`. Today that becomes `interest-show-delay`.
Tomorrow it may become a timer. The prop survives either way.

Practically:
- Feature detection lives in one module, `src/capabilities.ts` (to be written).
- Every non-Baseline CSS block sits behind `@supports`.
- No prop named `hint`, `popover`, `anchor`, `positionArea`, `command`, or any
  other spec term.
- `side` / `align` / `sideOffset` map to `position-area` internally. Keep Radix's
  names.

If you find yourself unable to name a prop without referencing the spec, that's
a signal the API is leaking implementation — stop and raise it.

---

## 6. Build order

Do them in this order. Each one is chosen to surface a specific unknown early.

**1. Popover** — done. Exercised anchor positioning, the unique
`anchor-name`-per-instance problem, and `beforetoggle` on the path where it
genuinely is cancelable. Also settles whether `side`/`align` map onto
`position-area` cleanly enough to keep Radix's prop names. If they don't, that
changes the API surface for four other primitives, so it must be answered
before them.

**2. Tooltip / HoverCard** — the `interestfor` path plus the `<a>` allowlist.
Build the JS fallback behind `capabilities.ts` from the start, since this is the
one feature that may never land elsewhere.

**3. Collapsible / Accordion** — `<details name>`, `::details-content`,
`interpolate-size` for height animation. Low risk, high payoff, good validation
that the two-root pattern generalizes past top-layer elements.

**4. Checkbox / Switch / RadioGroup / Toggle** — native inputs.
`indeterminate` is property-only and cannot be set via attribute, so Checkbox
needs a ref effect regardless. Expected, not a violation of §2.7.

**5. Select** — `appearance: base-select`. Big surface, well-scoped.

**6. The roving-focus family** — DropdownMenu, ContextMenu, Menubar, Tabs,
Toolbar, ToggleGroup. All share one internal roving-tabindex + typeahead module.
Build that module once, deliberately, before any of them. **The two-root split
saves almost nothing here** — both roots pull in the same focus machinery. Do
not claim otherwise in docs.

**7. Slider, ScrollArea, Toast, NavigationMenu** — mostly conventional JS. No
useful native primitive exists. Lowest priority.

Trivial and can be done any time between the above: `AspectRatio`, `Separator`,
`Label`, `VisuallyHidden`, `Progress`, `AccessibleIcon`.

---

## 7. Known open problems

Raise these rather than solving them silently.

- ~~**`<dialog>` `beforetoggle` cancelability.**~~ **Answered, Chrome 141.**
  `beforetoggle` is cancelable for `closed->open` and *not* for `open->closed`;
  `cancel` is cancelable for both Escape and `command="request-close"`. So opens
  are refused outright with no visible movement, and closes are refused through
  `cancel`. Covered by `tests/controlled.spec.ts`.

  It surfaced a second thing, which is now D11: reconciliation cannot use
  `requestClose()`. React flushes the effect synchronously inside the dispatch
  it is reacting to, and a close watcher ignores a `requestClose()` re-entered
  from its own cancel action — no error, no close, React and the DOM silently
  disagree. A microtask is not enough; only a full task is, or `close()`, which
  is what the adapter uses.
- **Arrow direction after a position-try flip.** `@position-try` accepts a
  limited property set — inset, margin, sizing, self-alignment — and there is no
  selector exposing which fallback was applied. Verify against the current spec
  before designing an `Arrow` part. If it's genuinely impossible, `Arrow` may
  have to be a documented gap rather than a component.
- **`anchor-name` is document-scoped.** Every instance needs a unique name,
  which means an inline style from `useId()`. `anchor-scope` may help; its
  behaviour across shadow boundaries is inconsistent. Resolve during Popover.
- **Pointer-anchored positioning** for ContextMenu. Anchor positioning can only
  target an element, so a JS-positioned zero-size anchor is required. Design it
  once, reuse it.
- **`transition: overlay`** is what keeps an element in the top layer during its
  exit transition. Confirm behaviour before promising exit animations for
  non-Chromium in docs.

---

## 8. Conventions

**Layout** — one directory per primitive under `src/`, containing `root.tsx`,
`controlled-root.tsx`, `parts.tsx`, `shared.ts`. Primitives without open state
skip the roots.

**Exports** — `src/index.ts` and `src/controlled.ts` only. Each exports a
namespace object (`export const Dialog = { Root, Trigger, ... }`) plus prop
types plus any escape-hatch hooks.

**TypeScript** — strict. Props extend `ComponentPropsWithRef<'element'>`. No
`any`. `AsChildProps` for parts supporting `asChild`.

**Comments** — explain *why*, especially where a platform behaviour is
counterintuitive. Do not narrate what the code does.

**Styling** — parts emit `data-bedrock-*` attributes for the optional
stylesheet. State is expressed by native pseudo-classes (`:open`,
`:popover-open`, `:checked`), not by `data-state` attributes. This is a
deliberate divergence from Radix; document it in each primitive's docs.

**Tests** — real browser, not jsdom. jsdom implements neither the top layer nor
invoker commands nor anchor positioning, so a passing jsdom suite would be
meaningless here. Playwright against Chrome.

**Definition of done for a primitive:**
- [ ] Plain root, controlled root, shared parts, adapter
- [ ] `asChild` on every part that renders an interactive element
- [ ] Trigger validation wired with the correct invoker kind
- [ ] Keyboard behaviour verified against the ARIA APG
- [ ] No `data-state`; native pseudo-classes only
- [ ] `npm run lint:graph` passes
- [ ] Playwright coverage for open, close, Esc, and controlled refusal
- [ ] README section listing any Radix API divergence

---

## 9. When to stop and ask

Decide alone: file layout, internal helper design, test structure, naming of
internals, anything reversible.

Ask first:
- Any change to a §2 non-negotiable
- Any public prop that diverges from Radix's name for the same concept
- Adding a runtime dependency, for any reason
- Anything from §7 that turns out to be unsolvable and needs an API change
- Dropping a primitive from scope

The bar: if it changes what a consumer types, ask. If it changes how we make
that work, decide.
