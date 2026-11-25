---
name: maintain-agent-docs
description: "Use when editing AGENTS.md files, docs/, DESIGN.md, or skills/: adding a rule, a skill, or a standard, deciding whether knowledge belongs in code or a doc, or fixing guidance that disagrees with the code."
---

# Maintain Agent Docs

## When to Use

When you change guidance for agents or developers, or when you find guidance that is wrong.

## Read First

- [docs/README.md](../docs/README.md) and [skills/README.md](./README.md)

## Where Things Go

| Content | Home | Budget |
|---|---|---|
| Map, non-negotiables, routing | Root [AGENTS.md](../AGENTS.md) | ≤150 lines |
| A package's boundaries, gotchas, host wiring, validation | `<pkg>/AGENTS.md` | ≤120 lines |
| What a symbol is for, and why | A comment on that symbol ([comments](../docs/standards/general.md#comments)) | concise |
| A cross-file or backend/vendor fact no symbol can carry | `<feature folder>/AGENTS.md`, only then | short |
| A rule about what good code looks like | `docs/standards/` (general, typescript, react, ui, testing) | add a section, not a file |
| How something works across packages | `docs/architecture/<topic>.md` | |
| UI composition, tokens, carve-outs | [DESIGN.md](../DESIGN.md) | |
| Steps for a recurring task | `skills/<verb>-<object>.skill.md` | 40–120 lines |
| SDK usage for SDK consumers | `libs/sdk/skills/` (ships with the package) | self-contained |

## Steps

1. Find the one home for the fact (see the table above). If it already lives somewhere, edit it
   there. Everywhere else, link to it rather than copying it.
2. Check the claim against the code before you write it. Guidance that disagrees with the code
   is a bug. Fix whichever one is wrong, and report the conflict.
3. Prefer code over docs: a type, guard, test, or comment on the owning symbol. Write a feature
   `AGENTS.md` only for what no symbol can carry, and never repeat what the code says. No UI
   walkthroughs, copy text, or restated standards.
4. A new skill is named after a task (verb first) and uses this template: frontmatter `name` and
   `description` (the trigger), then the sections When to Use, Read First, Steps, Checklist, and
   Verify. Add it to the [skills index](./README.md) and to the task table in the root `AGENTS.md`.
5. Do not edit `libs/sdk/skills/` for repo-only concerns. Those guides ship to SDK consumers, so
   they must never link to `docs/`, root `skills/`, or other packages. Only
   `libs/sdk/AGENTS.md` routes to them.
6. When a rule keeps getting broken, propose a Biome, Knip, or test check instead of more prose.

## Checklist

- [ ] Each fact lives in exactly one place
- [ ] No guide (`AGENTS.md`, docs, or skills) restates layout trees, command tables, inventories,
      export lists, or facts about a single symbol: link to the code instead, since copies drift
- [ ] Every file you touched has current comments on its symbols
      ([comments](../docs/standards/general.md#comments)), so facts removed from docs live there
- [ ] Every file stays within its line budget
- [ ] Relative links and `#anchors` resolve
- [ ] No mandate or ceremony text ("read this before every task")

## Verify

```bash
wc -l AGENTS.md libs/*/AGENTS.md packages/*/AGENTS.md skills/*.skill.md
grep -rn "skills/[a-z-]*\.skill\.md" --include='*.md' . | grep -v node_modules   # spot stale links
```
