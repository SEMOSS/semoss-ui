---
name: review-change
description: "Use before handing off any code change, or when asked to review a diff, branch, or file. Runs the standards checklists (architecture, React, TypeScript, design, accessibility) and the validation commands, reports findings, and writes the commit message and PR description."
---

# Review a Change

## When to Use

Run this before every handoff of a code change, and whenever you are asked to review. In
review-only mode, report findings and make no edits.

## Read First

- [general.md: Principles](../docs/standards/general.md#principles)
- The standards that cover what changed. The [docs index](../docs/README.md#standards) lists them.
- The owning package `AGENTS.md`, plus a feature `AGENTS.md` if one exists.

## Steps

1. Read every touched file in full. For a staged review, read the index version
   (`git show :path`).
2. Check the change against the checklist below. In implementation mode, fix in-scope violations
   and keep public contracts intact. Do not widen scope. Report larger migrations instead of
   making them.
3. Run the focused checks first, then the package checks (see Verify).
4. For UI changes, check the change in the running app, on desktop and at mobile width.
   Follow the [DESIGN.md definition of done](../DESIGN.md#definition-of-done).
5. Report what ran, what failed, and what was not covered. Give each finding a file:line and the
   risk it carries.
6. Write the PR description last, after the checks pass, using the [Pull Request](#pull-request)
   template. Fill it from the actual diff and what ran.

## Checklist

**Architecture**: [general.md: Architecture](../docs/standards/general.md#architecture)
- [ ] Imports respect the package graph and the feature layers
- [ ] New files follow [general.md: Naming](../docs/standards/general.md#naming)
- [ ] No new `utils`/`common` catch-all, and no duplicate of an existing helper
- [ ] No pass-through layers or behavior-switching booleans ([design](../docs/standards/general.md#design))
- [ ] Requests are cancellable; mutations are never auto-retried or double-submitted
      ([requests](../docs/standards/general.md#requests))
- [ ] Refactors and behavior changes are separate; unclear behavior was pinned by a test first
      ([changing code](../docs/standards/general.md#changing-existing-code))

**React and TypeScript**: [react.md](../docs/standards/react.md), [typescript.md](../docs/standards/typescript.md)
- [ ] Effects sync only external systems, with cleanup
- [ ] Values are derived in render, not mirrored into state
- [ ] `pnpm check` passes. Hooks and complex mappers have explicit return types
- [ ] Single-use pieces that meet the fold criteria have been folded
- [ ] Deprecated usage is migrated or reported. Every suppression states its reason
- [ ] Every export has a concise comment saying what it is for; comments explain why, not what;
      no barrel comments ([comments](../docs/standards/general.md#comments))
- [ ] New shared state uses `StoreState` ([react.md: State](../docs/standards/react.md#state))

**UI**: [ui.md: Styling](../docs/standards/ui.md#styling), [ui.md: Accessibility](../docs/standards/ui.md#what-counts-as-verified), [ui.md: UI Text](../docs/standards/ui.md#ui-text)
- [ ] Uses `@semoss/ui/next` and semantic tokens only, with no arbitrary values
- [ ] Every control has an accessible name and works by keyboard, with visible focus and
      managed focus in overlays
- [ ] Status messages are announced, without redundant ARIA
- [ ] Loading, empty, and error states are present
- [ ] Strings go through i18n and use correct casing

**Tests**: [testing.md](../docs/standards/testing.md)
- [ ] Tests assert behavior and select by role and name
- [ ] Optimizations come with evidence

**Commit and PR**: [AGENTS.md: Commits and Pull Requests](../AGENTS.md#commits-and-pull-requests)
- [ ] Commit messages pass `pnpm exec commitlint`; the PR description uses the [org template](#pull-request)

## Verify

```bash
pnpm exec biome check <touched files>
pnpm --filter <package> test
pnpm --filter <package> type-check
pnpm check
```

## Pull Request

Every PR description follows the org-wide
[PR template](https://github.com/SEMOSS/.github/blob/main/.github/PULL_REQUEST_TEMPLATE.md),
which GitHub prefills in the web UI. `gh pr create --body` skips that prefill, so write the same
headings yourself: `## Description`, `## Changes Made`, `## How to Test`, `## Notes`. How to Test
lists the exact commands that ran (from Verify) and the manual steps, with expected outcomes.
