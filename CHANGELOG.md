# Changelog

## Unreleased

Pre-alpha. Nothing is published yet, so nothing is stable.

### Added

- `Dialog` — `Root`, `Trigger`, `Content`, `Title`, `Description`, `Close`, from
  both `@apostel/bedrock` and `@apostel/bedrock/controlled`.
- `Slot`, `composeRefs`, `validateTrigger` and the `useDialogTrigger` escape
  hatch.
- `bedrock.css`, optional, demonstrating enter and exit transitions with no
  presence wrapper.
- Playwright suite against real Chrome, including a test that the rendered
  markup still opens and closes with JavaScript disabled.
- Documentation under `docs/`, a Radix migration guide, and a shadcn registry.

### Known gaps

See `docs/gaps.md`. The short version: one primitive of about thirty exists,
Chrome is the only tested engine, and `Dialog.Content` has no `asChild`.
