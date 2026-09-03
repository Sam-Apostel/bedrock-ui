# Contributing

`AGENTS.md` is the source of truth for architecture. Read it before writing
code. Most review comments on this repo are a pointer to a section of it, and
the decisions that look arbitrary are the ones it explains.

This file is the practical half: how to run things, where code goes, and what
"done" means.

## Setup

```bash
npm install
npx playwright install chromium
```

Node 20 or later. No other tooling: the linter, formatter and test runner are
all devDependencies.

## The loop

```bash
npm run verify   # everything CI runs, in the same order
```

Individually, cheapest first:

| command | what it checks |
| --- | --- |
| `npm run format` | oxfmt. `format:check` is the CI form. |
| `npm run lint` | oxlint. |
| `npm run typecheck` | tsc, no emit. |
| `npm run lint:graph` | the two packaging promises, described below. |
| `npm run build` | tsc into `dist/`, then the import-specifier rewrite and the CSS copy. |
| `npm test` | Playwright against Chrome. Add `-g "name"` to narrow. |
| `npm run docs:build` | the static site, into `site/`. |
| `npm run registry:build` | regenerates `r/*.json` from the registry sources. |
| `npm run compat:build` | rewrites the versions, dates and Baseline status in `docs/compat.json` from MDN's data. |

`npm run lint:graph` is not a style check. It enforces that `src/index.ts`
cannot reach the controlled layer by *any* path, and that nothing in `src`
imports a runtime dependency. Both are promises the README makes that a normal
diff review would not catch being broken; a convenience re-export is enough.

## Where code goes

One directory per primitive under `src/`:

```
src/dialog/
  root.tsx             plain root      → exported from src/index.ts
  controlled-root.tsx  controlled root → exported from src/controlled.ts
  parts.tsx            every part, shared by both roots
  shared.ts            context, adapter, escape-hatch hooks
```

Primitives without open state skip the roots and have only `parts.tsx`.

The shared internals are worth knowing before you write a new primitive,
because most of the work is already in one of them:

| module | what it does |
| --- | --- |
| `slot.tsx` | `asChild`. Child wins on plain props; handlers chain, `style` and `className` merge. |
| `compose-refs.ts` | Merges refs, including React 19 cleanup functions. |
| `open-state.ts` | DOM-observed open state, with the mount/unmount timing content parts depend on. |
| `client-render.ts` | True on the client, false on the server and the hydrating render. |
| `create-controlled-root.ts` | The entire controlled layer, generic over an `OpenStateAdapter`. |
| `anchor.ts` | `side`/`align`/`sideOffset` → one `position-area` plus a self-alignment. |
| `roving.ts` | Roving tabindex, arrow keys, Home/End, typeahead. |
| `interest.ts` | Hover and focus intent, until `interestfor` ships. |
| `capabilities.ts` | Every non-Baseline feature test, in one file. |
| `validate-trigger.ts` / `validate-element.ts` | The dev-throw checks. |

> If you find yourself writing a second copy of any of these, stop and ask.

## Tests

Playwright against real Chrome, never jsdom. jsdom implements neither the top
layer, nor invoker commands, nor anchor positioning, so a green suite there
would say nothing about whether the library works. That is not a preference;
it is the reason `docs/should-you-switch.md` lists "your component tests stop
working" as the first cost of adopting this.

Fixtures live in `tests/fixtures/`, keyed by a `?case=` value, and are grouped
by area (`primitives.tsx`, `overlays.tsx`, `menus.tsx`, `rest.tsx`,
`parity.tsx`). Add a case, then drive it from a spec.

Two rules that matter:

- **Assert on the DOM, not on a React mirror of it.** `dialog.open`, `:modal`,
  `:popover-open`, `aria-pressed`, and never a `data-state` you wrote yourself.
- **Assert the behaviour, not the implementation.** "Focus lands on the close
  button" survives a rewrite; "an effect ran" does not.

`/ssr?case=…` serves server-rendered markup with no script tag, for testing
what a browser without JavaScript receives. Use it for anything that claims to
work before hydration.

### Radix's suite

> `tests/radix-parity.spec.ts` is Radix's own Dialog tests, ported verbatim with
> their titles kept so the two files can be diffed by eye. It is the most useful
> review tool in the repo. Four rounds of fixes came out of it, and every one
> started with a Radix assertion rather than an idea of ours.

If you change Dialog, run it first. A `test.skip` there is a claim that
something is impossible or belongs to a different design; if you make one
possible, turn it into a real test and say so in `docs/radix-parity.md`.

## Adding a primitive

> The order in `AGENTS.md` §6 is deliberate: each entry is placed to surface a
> specific unknown before the primitives that depend on the answer.

Definition of done, from §8:

- [ ] Plain root, controlled root, shared parts, adapter
- [ ] `asChild` on every part that renders an element
- [ ] Trigger validation wired with the correct invoker kind
- [ ] Keyboard behaviour checked against the ARIA APG
- [ ] No `data-state`; native pseudo-classes only
- [ ] `npm run lint:graph` passes
- [ ] Playwright coverage for the behaviour that makes it interesting
- [ ] A row in the migration guide if anything diverges from Radix
- [ ] A registry item, if shadcn/ui has a component for it

## Changes and releases

Every change that affects a consumer needs a changeset:

```bash
npm run changeset
```

Pick the bump, then describe the change **for someone using the package**: what
moved and what they have to do about it, rather than for someone reading the
diff.
That text becomes the changelog entry verbatim.

Changes that need no changeset: tests, docs, internal refactors that leave the
public surface identical. CI does not enforce this, so use judgement. Releasing
is automated from there; see [`RELEASING.md`](./RELEASING.md).

## When to stop and ask

From `AGENTS.md` §9, and it is a good bar:

> If it changes what a consumer types, ask. If it changes how we make that
> work, decide.

Ask first about: any change to a §2 non-negotiable, any public prop that
diverges from Radix's name for the same concept, adding a runtime dependency
for any reason, and dropping a primitive from scope.

Decide yourself: file layout, internal helper design, test structure, naming of
internals, and anything else you could reverse in an afternoon.

## Documentation

Docs live in `docs/` as markdown and become pages on the site automatically.
Two of them are written to be used *against* the library and are the ones to
keep honest:

| file | what belongs in it |
| --- | --- |
| `docs/should-you-switch.md` | the costs of adopting bedrock at all, and the page an evaluator should read first. |
| `docs/known-gaps.md` | specific missing behaviour. Close a gap and delete it here; open one and add it here in the same commit, not in a follow-up. |

`docs/compat.md` renders `docs/compat.json` twice: as the timeline grid at the
top of the page and as the matrix below it. Add a row when a primitive starts
depending on a new platform feature, fill in `degrade`, because "what happens
when this is missing" is the column that makes the page worth having, and list the
row under the components that use it, as `requires` if they stop working
without it and `enhances` if they only get worse. The **Here** column is
feature-detected in the reader's own browser by an inline script. See *The
compat data* below for where the version numbers come from.

### Live demos

A reference page without a demo is a claim without evidence. To add one:

1. Write `demos/cases/<name>.tsx` with a default-exported component.
2. Put `<!-- demo: <name> -->` in the markdown where it should appear.
3. Add `['<name>.html', '<name>']` to `PAGES` in `tests/docs.spec.ts`.

That is the whole workflow. The registry is built from the filesystem by a glob
in `demos/main.tsx`, so there is nothing to register by hand.

> A comment rather than a fence, so the markdown still reads as markdown in the
> repository, where there is no bundle to run. The source of the file is
> rendered under the demo automatically, which is why the demo file is the only
> copy: do not paste the same code into the page as well, or the two will
> disagree.

The build fails if a page names a demo with no file, **and** if a demo file no
page names. Both are the same failure: something that looks finished and does
nothing.

Demos are typechecked and linted like everything else, and `npm run verify`
builds the site and drives the real generated pages, so a demo that mounts an
empty box fails the suite rather than shipping. Keep them short: a demo is an
argument for one behaviour, not a kitchen sink.

### Widgets

`<!-- widget: <name> -->` mounts the same way and skips the source view. It is
for the two or three pieces of the site that are a page element rather than an
example, where a `<details>` promising "Source" would open onto a one-line
re-export and help nobody:

```
demos/cases/compat-timeline.tsx   the mount point, one re-export
demos/timeline/                   the widget: data, tiles, chrome, eras
```

Reach for `demo:` unless the thing you are adding is longer than the page
around it.

### The compat data

`docs/compat.json` is half prose and half measurement:

| written by hand | rewritten by `npm run compat:build` |
| --- | --- |
| feature names, what uses them, what breaks without them, the component map, the eras | every version number, every release date, Baseline status and dates |

The generator reads `@mdn/browser-compat-data` and `web-features`. Both are
devDependencies and neither is needed to build the site, because the output is
committed, so run it when a browser ships something and commit what it
produces. The table and the timeline read that one file, which is what stops
the page from disagreeing with itself.
