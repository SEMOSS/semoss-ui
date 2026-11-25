# Skills

Task procedures. Each skill is a flat `<verb>-<object>.skill.md` file that links to the rules in
[docs/standards](../docs/README.md#standards) and never copies them. Load the one that matches
your task; the root [AGENTS.md](../AGENTS.md#task-routing) routes here.

| Skill | Load when |
|---|---|
| [build-feature](./build-feature.skill.md) | Adding or extending an app feature, screen, or route |
| [build-component](./build-component.skill.md) | Adding or changing a reusable component (`@semoss/ui`, shared, app) |
| [build-form](./build-form.skill.md) | Creating or changing a form or dialog form |
| [add-store](./add-store.skill.md) | Adding shared state, or migrating a MobX or Zustand store |
| [call-backend](./call-backend.skill.md) | Reading or writing backend data, adding an `api/` module or SDK API |
| [add-translations](./add-translations.skill.md) | Adding, changing, moving, or removing translation keys |
| [add-workbench-panel](./add-workbench-panel.skill.md) | Adding a dock panel, file view, or domain workbench |
| [make-responsive](./make-responsive.skill.md) | Responsive layout, touch interaction, viewport, mobile navigation |
| [review-change](./review-change.skill.md) | Before handoff, or when asked to review |
| [maintain-agent-docs](./maintain-agent-docs.skill.md) | Editing AGENTS.md, docs, DESIGN.md, or skills |

SDK usage guides (rooms, chat, agent runs, session) ship with `@semoss/sdk` and are reached
through [libs/sdk/AGENTS.md](../libs/sdk/AGENTS.md), not from here.

To add or change a skill, follow [maintain-agent-docs](./maintain-agent-docs.skill.md).
