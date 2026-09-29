---
name: sdk-chat
description: "Use when creating or listing SDK rooms, sending AskRoom or RunAgent messages, streaming chat or agent runs, handling tool approvals, or managing room messages, options, and insight bindings. Routes to the packaged SDK API guide and repository workflow."
---

# SDK Chat Workflow

Read the [packaged SDK chat guide](../libs/sdk/skills/sdk-chat/SKILL.md) before
implementing or reviewing room, chat, or agent-run behavior. It is the single
maintained usage guide and is shipped with `@semoss/sdk`; keep it self-contained
for consumers outside this repository. Do not duplicate its API tables or examples
here.

## Repository Workflow

- Follow the [SDK package guide](../libs/sdk/AGENTS.md) when changing the SDK and
  the consuming package's guide when changing a caller.
- Apply the [React standard](./react-standard.skill.md) to TypeScript and React
  work. [biome.json](../biome.json) remains the lint and formatting authority.
- Verify signatures, exports, defaults, and lifecycle behavior against
  [SDK source](../libs/sdk/src/index.ts) and nearby tests. Update the packaged
  guide for API corrections, not a second local API reference.
- Keep chat job streaming separate from agent-run polling. Review bounded waits,
  subscription cleanup, local cancellation, durable reconciliation, and tool
  approval ownership using the packaged guide's lifecycle guidance.
- SDK types, comments, and mocked tests do not establish backend compatibility.
  Preserve documented gaps unless backend behavior is independently verified.
- For documentation-only changes, check relative links, shipped skill metadata,
  and examples against current exports/types; run focused tests for lifecycle
  claims. Report unverified behavior without staging changes or widening scope.
