# Contributing

Read `AGENTS.md` first. It is the source of truth for architecture and for the
decisions that look arbitrary until you know why they were made — most review
comments on this repo are a pointer to a section of it.

## Setup

```bash
npm install
npx playwright install chromium
```

## The loop

```bash
npm run verify   # everything CI runs, in the same order
```

Individually:

| command              | what it checks                                              |
| -------------------- | ----------------------------------------------------------- |
| `npm run format:check` | oxfmt. `npm run format` fixes.                             |
| `npm run lint`       | oxlint.                                                      |
| `npm run typecheck`  | tsc, no emit.                                                |
| `npm run lint:graph` | the two packaging non-negotiables. See below.                |
| `npm run build`      | tsc to `dist`, then import-specifier rewrite and CSS copy.    |
| `npm test`           | Playwright against Chrome.                                   |

`npm run lint:graph` is not a style check. It enforces that `src/index.ts`
cannot reach the controlled layer by any path, and that nothing in `src` imports
a runtime dependency. Both are promises made in the README that a normal diff
review would not catch being broken.

## Tests

Playwright against real Chrome, never jsdom — jsdom implements neither the top
layer, nor invoker commands, nor anchor positioning, so a green suite there
would say nothing about whether the library works.

Add cases to `tests/fixtures/main.tsx` keyed by `?case=`, then drive them from a
spec. Anything asserting on open state should assert on the DOM (`dialog.open`,
`:modal`, `:popover-open`), not on a React-side mirror of it.

## Adding a primitive

The order in `AGENTS.md` §6 is deliberate — each entry is placed to surface a
specific unknown before the primitives that depend on the answer. The
definition of done is in §8.

If your change alters what a consumer types, it needs a decision from the
maintainer first (§9). If it only alters how we make that work, decide it
yourself and write down why.
