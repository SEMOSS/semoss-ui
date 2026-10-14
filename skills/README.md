# Agent Skills

Read [root AGENTS.md](../AGENTS.md), the owning package guide, and all skills relevant
to the task. These files are provider-neutral; follow the explicit links rather
than relying on automatic discovery.

## Required Skills

| Skill | Load when |
| --- | --- |
| [React standard](./react-standard.skill.md) | Creating, editing, refactoring, or reviewing React components, hooks, TypeScript source, or full staged React files |
| [Accessibility](./accessibility.skill.md) | Building or reviewing interactive UI, forms, dialogs, menus, tables, filters, navigation, or accessible behavior |
| [Mobile development](./mobile-development.skill.md) | Working on responsive layouts, small screens, touch interaction, viewport handling, or mobile navigation |
| [React form builder](./react-form-builder.skill.md) | Creating or touching forms, including fields, validation, submission, and modal form behavior |
| [SDK chat](./sdk-chat.skill.md) | Rooms, AskRoom/RunAgent messages, tool approvals, streaming/polling lifecycle, and room configuration |

Specialized skills supplement the React standard and package boundaries.
[DESIGN.md](../DESIGN.md) owns design rules; [biome.json](../biome.json) owns lint
and formatting settings. Use the React skill's
[review checklist](./react-standard.skill.md#full-file-review-and-handoff) for validation.

Package guides own local integration contracts; specialized skills own their task-specific
workflows. If guidance conflicts with a current API or another requirement, verify the
implementation and report the conflict rather than inventing an exception. The
[packaged SDK guide](../libs/sdk/skills/sdk-chat/SKILL.md) is maintained in its published
location; the flat SDK skill routes to it instead of duplicating its API reference.

## Maintaining Skills

- Keep one flat `<name>.skill.md` file per skill, with `name` and `description` metadata.
- Link to shared rules instead of copying them into another skill or AGENTS.md.
- Keep instructions provider-neutral, without tool restrictions or discovery wrappers.
- Update links and this index when renaming or adding a skill.