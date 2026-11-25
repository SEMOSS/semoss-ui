# DESIGN.md - SEMOSS Design Rulebook

How SEMOSS screens should look and be composed. Code-level rules (tokens in classes, banned
patterns, carve-outs, accessibility, responsive, text casing) live in
[docs/standards/ui.md](./docs/standards/ui.md); the component catalog is in
[libs/ui/AGENTS.md](./libs/ui/AGENTS.md).

## Source of Truth

- **`@semoss/ui` is the single source of truth.** Tokens are in
  [libs/ui/src/styles/globals.css](./libs/ui/src/styles/globals.css) (light and dark); components
  are imported only from `@semoss/ui/next`.
- Tokens make a screen theme-compatible, not consistent. Composition comes from the grammar below.

## Workflow

1. **Read the owning surface:** its layout, the nearest sibling, and any local composite. Keep the
   existing navigation and information architecture unless asked to change them.
2. **Classify the surface** with one archetype below.
3. **Reuse in order:** the feature's shell or composite → an `@semoss/ui/next` primitive → a small
   local composite → a new primitive in `libs/ui/src/next/` only when several packages need it.
4. **Set hierarchy before decoration:** title, primary task, one primary action, supporting
   actions, and the minimum information needed.
5. **Cover every state** (see States and Feedback).

When a mockup conflicts with an existing shell, keep the shell unless a redesign was requested. A
redesign keeps navigation destinations, permissions, and capabilities, and establishes one reusable
pattern, not a one-off.

## Product Grammar

SEMOSS is an operational analytics product: quiet, work-focused layouts for scanning, comparison,
and repeated action. Heroes, display type, gradients, floating sections, and illustrations belong
only on branded or promotional surfaces.

### Surface Archetypes

| Surface | Composition |
|---|---|
| List, catalog, dashboard | Page header → compact filters/actions → results summary → table or collection → pagination |
| Detail or settings | Breadcrumb if needed → title/description/actions → grouped sections or tabs → sticky actions only for long forms |
| Editor or workbench | Stable chrome → toolbar → resizable work area → contextual inspector; maximize the canvas |
| Conversational workbench | Readable conversation → anchored composer → contextual work area; tabs when space is tight |
| Focused task or form | Narrow column → grouped fields → inline validation → explicit cancel/submit |
| Overlay | `Dialog` for decisions, `Sheet` for contextual detail, `Drawer` for mobile tasks, `Popover` for brief anchored controls |

One archetype per screen. A dashboard may use cards for repeated metrics; a settings page does not
wrap every group in a card.

### Page Hierarchy

- Navigation stays in the owning layout. Never nest `main` landmarks.
- A page starts with one `H3` and an optional `text-base` muted description; sections are `H3`,
  subsections `H4`. Never pick a heading by visual size. `.heading-*` is for branded headings only.
- Page header: title and description left, task actions right; stacks on narrow screens.
- Spacing groups content: `gap-2` within a control group, `gap-4` within a section, `gap-6` between
  sections. New shells start at `p-4 md:p-6`.
- Prose uses `max-w-prose`; tables, editors, charts, and work areas use the full width.

### Color and Type

- Text: `text-foreground` for headings, `text-muted-foreground` for descriptions; body
  typography components use `text-base`; weights are normal, medium, and bold.
- One accent: `primary` carries every primary interactive element. There is no second brand color.
- Status colors are exactly `destructive`, `success`, and `warning`, always paired with text. If a
  new semantic role is needed (e.g. `info`), propose a token in `globals.css`.

### Actions and Controls

- One primary action (`default`) per page or task; `outline` for supporting, `ghost` for
  low-emphasis chrome, `destructive` only for destructive actions.
- The primary action is last in a left-to-right group.
- `ButtonGroup` for related buttons, `ToggleGroup` for on/off options, `Tabs` to switch the content
  below, menus for related choices. Never a row of unrelated text buttons for a mode or setting.
- Keep destructive actions away from routine ones; confirm hard-to-reverse operations.

### Surfaces and Density

- `bg-background` for the page, `bg-card` for genuinely framed objects, `bg-muted` for subdued
  regions; borders or `Separator` before shadows.
- Cards are for repeated entities, summaries, or tools. Sections are normally unframed; never nest
  cards for spacing. Content cards are `rounded-xl p-6`; compact tool rows are `rounded-md` or
  `rounded-lg` with `p-2`/`p-3`. `shadow-sm` only for slight elevation.
- One control density per region: default sizes for primary workflows, `sm` for dense toolbars and
  tables, `lg` only for prominent standalone actions.

### Conversational Workbenches

- Standalone chat sits in a readable column with the composer anchored below; attachments above the
  editor, compact controls below; overflow actions go in a menu, never clipped.
- Group consecutive tool steps without crossing assistant text. Active and failed groups expand;
  completed ones collapse; reasoning starts collapsed. Pending approvals and questions always stay
  visible. Expanding never runs or approves a tool.
- Keep chat and editors mounted across view switches, resizes, and maximizing; preserve drafts,
  scroll, and unsaved edits. On narrow layouts use `Tabs`, with only the visible pane reachable.

### States and Feedback

- **Loading:** keep the geometry. `Skeleton` for content, `Spinner` in a control or compact region,
  `LoadingScreen` only when a whole route or shell is unavailable. Disable and label the triggering
  control.
- **Empty:** tell empty apart from filtered-empty. Give a title, a useful description, and one next
  action; filtered-empty offers to clear filters.
- **Error:** an `Alert` near the failed content with a recovery action. `toast` is for transient
  feedback, never the only record of a persistent error.
- **Forms:** see [ui.md](./docs/standards/ui.md) and
  [react.md: Forms](./docs/standards/react.md#forms).
- **Destructive:** explain the consequence, confirm, and return focus to a logical control.

### Responsive Layout

- No horizontal page scroll at 360 CSS px. A table, editor, canvas, or code block may scroll inside
  its own labelled region.
- Stack headers, forms, action groups, cards, and list items on narrow screens; let controls wrap.
- Tables pick one approach deliberately: horizontal overflow with essential columns visible,
  column prioritization, or an alternate small-screen view. Never two unsynchronized models.

## Definition of Done

Review the affected surface at:

| Check | Coverage |
|---|---|
| Viewports | 360px mobile, 1440px laptop, wider desktop |
| Themes | Light and dark |
| Content | Empty, typical, long strings, dense results |
| Async | Loading, success, failure |
| Input | Keyboard only, visible focus |
| Zoom | 200% without lost content or controls |

There is no automated design check; lint and builds do not replace this review. Report anything
you could not exercise. The [review-change skill](./skills/review-change.skill.md) runs the rest.
