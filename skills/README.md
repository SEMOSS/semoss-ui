# Agent Skills

Every agent must read the full [React standard](./react-standard.skill.md) before
every task involving React files, regardless of directory or task size. Follow
the [root loading and delegation requirements](../AGENTS.md#required-skill-routing-all-agents),
read the owning package guide, and load additional skills relevant to the task.
These files are provider-neutral; follow the explicit links rather than relying
on automatic discovery.

## Required Skills

| Skill | Load when |
| --- | --- |
| [React standard](./react-standard.skill.md) | Always for React work anywhere in the repo: creating, editing, refactoring, debugging, investigating, planning changes to, or reviewing `.tsx`/`.jsx`, React components/hooks/context/providers in `.ts`/`.js`, and React tests, stories, or examples |
| [Accessibility](./accessibility.skill.md) | Building or reviewing interactive UI, forms, dialogs, menus, tables, filters, navigation, or accessible behavior |
| [Mobile development](./mobile-development.skill.md) | Working on responsive layouts, small screens, touch interaction, viewport handling, or mobile navigation |
| [React form builder](./react-form-builder.skill.md) | Creating or touching forms, including fields, validation, submission, and modal form behavior |
| [SDK chat](./sdk-chat.skill.md) | Rooms, AskRoom/RunAgent messages, tool approvals, streaming/polling lifecycle, and room configuration |
| [SEMOSS sync](./semoss-sync.skill.md) | Generating selected @semoss/sdk TypeScript REST and Pixel contracts from Monolith/SEMOSS annotations |

Loading the React standard is mandatory for React work; apply individual rules
to the work they govern, including applicable TypeScript rules for non-React
source. Unrelated documentation, configuration, scripts, and CI tasks do not
require it solely because they are in the repository. Specialized skills
supplement the standard and package boundaries.
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
- Keep the React standard's mandatory scope aligned with root and package instructions.
- Link to shared rules instead of copying them into another skill or AGENTS.md.
- Keep instructions provider-neutral, without tool restrictions or discovery wrappers.
- Update links and this index when renaming or adding a skill.
