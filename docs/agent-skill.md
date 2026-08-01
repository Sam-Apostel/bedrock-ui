# The migration skill

`skills/migrate-to-bedrock/SKILL.md` is a [Claude Code
skill](https://code.claude.com/docs) that walks an agent through migrating a
Radix codebase. It is written for the agent, not for you — but it is worth
reading, because it is the shortest honest description of what a migration
actually involves.

## Installing it

Into a project you are migrating:

```bash
mkdir -p .claude/skills/migrate-to-bedrock
curl -o .claude/skills/migrate-to-bedrock/SKILL.md \
  https://bedrock.sams.land/skills/migrate-to-bedrock/SKILL.md
```

Then: *"migrate this app off Radix"*. The description is written so the skill
triggers on that, and on the questions people ask afterwards — why a trigger
throws, why the dialog no longer closes on a backdrop click, why `data-state`
selectors stopped matching.

It also ships inside the package, at
`node_modules/@apostel/bedrock/skills/migrate-to-bedrock/SKILL.md`, so an agent
already working in the project can be pointed at it with no download.

## What it makes the agent do

The order is the point.

**Establish viability first.** Before any code, it checks four things and
reports them: jsdom tests that click triggers, triggers that are not buttons,
`data-state` in shared CSS, and overlays with content in them. If a project has
hundreds of jsdom component tests and no Playwright setup, the skill says so and
stops rather than starting a refactor that ends badly.

**Then the mechanical work** — imports, deleting `Portal` and `Overlay`,
`data-state` → `:open`, the animation classes.

**Then four judgement calls, surfaced rather than resolved:** the button rule,
light dismiss, which roots need `/controlled`, and what depended on content
staying mounted. Each one changes behaviour a user will notice, so the skill is
explicit that the agent should not decide them quietly.

**Then verification that catches the specific failure mode here:** a bad trigger
only throws when its component actually mounts, so type-checking is not enough
and the app has to be opened in a browser.

## Why a skill rather than a codemod

Most of the diff is mechanical, and a codemod could do it. The parts that matter
are not: whether a trigger can become a button depends on what that element is
for, and whether light dismiss should be restored depends on whether the dialog
is a confirmation or a form.

A codemod would either refuse those or guess. The skill is structured so the
agent does the boring 80% and brings you the other 20% with enough context to
answer.
