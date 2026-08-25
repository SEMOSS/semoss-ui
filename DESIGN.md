# DESIGN.md - SEMOSS Design Consistency Rulebook

This is the repo-wide design rulebook for humans and AI coding agents. The compact hard rules
live in [AGENTS.md](./AGENTS.md#design-system--styling); this file holds the full decision
trees, banned patterns, carve-outs, and rationale. The token/component catalog lives in
[libs/ui/AGENTS.md](./libs/ui/AGENTS.md).

## Source of Truth

**`@semoss/ui` (`libs/ui`) is the single source of truth for design.**

- **Tokens**: [libs/ui/src/styles/globals.css](./libs/ui/src/styles/globals.css) — semantic
  colors, radius, Geist fonts, type scale, heading/section utilities. Light and dark theme.
- **Components**: `libs/ui/src/next/`, imported **only** as `@semoss/ui/next` (including
  `cn()`).
- **Design reference**: the Figma kit *"shadcn ui kit for SEMOSS"* uses the same semantic
  token names, Geist, and the standard Tailwind type scale. When values differ between a
  mockup and code, `globals.css` wins for implementation.

Tokens and shared components make a screen theme-compatible; they do not make its composition
consistent by themselves. Follow the workflow and product grammar below before choosing
individual classes.

## Required UI Workflow

For every user-facing UI task:

1. **Read the owning surface.** Inspect the route layout, the nearest comparable sibling, and
   any local composite already used by that feature. Preserve established navigation and
   information architecture unless the request explicitly changes them.
2. **Classify the surface.** Choose one primary archetype from the table below. Do not mix a
   marketing composition into an operational screen or turn every section into a card.
3. **Choose from the authority order.** Reuse, in order: the feature's existing shell or
   composite; an `@semoss/ui/next` primitive; a small local composite; a new shared primitive
   in `libs/ui/src/next/` only when multiple packages need the same contract.
4. **Define hierarchy before decoration.** Identify the page title, primary task, one primary
   action, supporting actions, and the minimum information needed to complete the task.
5. **Implement the full state set.** Account for initial loading, empty, populated, partial or
   filtered-empty, error, disabled, and submitting states where they apply.
6. **Check responsive and accessible behavior.** Verify the layout, focus order, keyboard
   operation, announcements, overflow, and long content before polishing visual details.
7. **Run the design audit.** A UI change is not complete when it merely compiles.

If a mockup conflicts with an existing feature shell, preserve the shell and implement the
requested content inside it. If a new pattern is truly required, establish one reusable
pattern rather than introducing a one-off visual dialect.

## SEMOSS Product UI Grammar

SEMOSS is an operational analytics product. Default to quiet, work-focused layouts optimized
for scanning, comparison, and repeated action. Marketing-style heroes, oversized display
type, decorative gradients, floating page sections, and illustration-led composition belong
only on explicitly branded or promotional surfaces.

### Surface Archetypes

| Surface | Default composition |
|---------|---------------------|
| List, catalog, or dashboard | Page header → compact filters/actions → results summary → table or repeated collection → pagination |
| Detail or settings | Breadcrumb when needed → title/description/actions → grouped sections or tabs → sticky actions only for long forms |
| Editor or workbench | Stable application chrome → toolbar → resizable work area → contextual inspector; maximize usable canvas |
| Focused task or form | Narrow readable column → grouped fields → inline validation → explicit cancel/submit actions |
| Overlay | `Dialog` for focused decisions, `Sheet` for contextual detail, `Drawer` for mobile-first tasks, `Popover` for brief anchored controls |

Use one dominant archetype per screen. A dashboard may contain cards as repeated metrics; a
settings page is not a dashboard and should not wrap every field group in a card.

### Page and Section Hierarchy

- Keep global navigation in the owning layout. Page components render one semantic `main` or
  use the shell's existing `main`; never nest `main` landmarks.
- Start a page with one clear `H3` and optional description using text-base/leading-normal/medium with muted-foreground. Follow heading levels in order (`H3` sections, `H4`
  subsections); do not select a heading by visual size alone.
- A standard page header contains title and optional description on the left, with task
  actions on the right. It stacks on narrow screens and aligns horizontally when space
  permits.
- Use `H1`–`H4`, `P`, `Small`, and `Muted` from `@semoss/ui/next`. Reserve `.heading-*` for
  genuine branded or promotional headings, not dense application panels.
- Use spacing to communicate grouping: `gap-2` within a compact control group, `gap-4`
  within a section, and `gap-6` between major sections. Reuse the owning shell's page padding;
  for a new shell, start with `p-4 md:p-6`.
- Keep prose readable with `max-w-prose`; let tables, editors, charts, and work areas use the
  available width.

### Actions and Controls

- Expose one visually primary action per page or self-contained task. Use `default` for that
  action, `outline` for supporting actions, `ghost` for low-emphasis chrome,
  and `destructive` only for destructive actions.
- Put the primary action last in a left-to-right action group and first in the natural mobile
  focus sequence only when the layout preserves the same logical order.
- Use Lucide icons already available in the package. Decorative icons are `aria-hidden`;
  icon-only buttons require an accessible name and a `Tooltip` when the meaning is not
  universally familiar.
- Use `ButtonGroup` for related buttons, `ToggleGroup` for buttons that can only be toggled on or off, `Tabs` for changing the display under the tab section, or menus for related choices. Do not represent a
  mode, boolean setting, or option set as a row of unrelated text buttons.
- Keep destructive actions away from routine primary actions and require confirmation when
  the operation is difficult to reverse.

### Surfaces and Density

- Use `bg-background` for the page, `bg-card` for genuinely framed objects, `bg-muted` for
  subdued regions, and borders or `Separator` before introducing shadows.
- Cards are for repeated entities, summaries, or tools that need a visual boundary. Page
  sections are normally unframed. Never nest cards merely to create spacing. All cards should follow rounded-x and padding using spacing-6. For primary actions/cards use shadow/sm.
- Keep control density consistent within a region. Use default component sizes for primary
  workflows, `sm` for dense toolbars and tables, and `lg` only for prominent standalone
  actions.
- Prefer borders, spacing, and typography over decorative shadows. Do not add ornamental
  gradients, color blobs, or accent panels to operational screens.
- Preserve stable dimensions for toolbars, tables, grids, editors, and icon controls so
  loading, hover, labels, and long content do not shift surrounding layout.

### States and Feedback

- **Loading:** preserve the expected geometry. Use `Skeleton` for content-shaped loading,
  `Spinner` inside a control or compact region, and `LoadingScreen` only while an entire route
  or application shell is unavailable. Keep the triggering control disabled and label its
  in-progress action.
- **Empty:** distinguish a genuinely empty collection from a filtered-empty result. Provide a
  concise title, useful description, and one relevant next action; filtered-empty states
  should offer a way to clear or change filters.
- **Error:** place an `Alert` near the failed content with a recovery action when recovery is
  possible. Use `toast` for transient action feedback, not as the only record of a persistent
  page or form error.
- **Success and warning:** pair color and iconography with text. Status must never be conveyed
  by color alone.
- **Forms:** use `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` with the matching
  `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, or other primitive. Show
  validation next to its field and preserve entered values after a recoverable submit error.
- **Destructive actions:** explain the consequence, require deliberate confirmation for
  difficult-to-reverse changes, and return focus to a logical control after completion.

### Responsive Behavior

- Write the unprefixed layout for the narrowest supported viewport, then add `sm:`, `md:`, or
  `lg:` changes when the content needs them. Do not choose breakpoints by device name.
- At 360 CSS pixels, pages must not scroll horizontally. A table, editor, canvas, or code block
  may scroll inside a clearly bounded and labelled region when preserving its structure is
  more useful than transforming it.
- Stack page headers, forms, and action groups on narrow screens; allow controls to wrap rather
  than shrinking labels or overflowing. Keep the primary action easy to find without changing
  the logical focus order between layouts. Cards, list items, buttons should stack one on top of each other.
- For data tables, deliberately choose one approach: horizontal overflow with essential
  columns kept visible, column prioritization, or an alternate small-screen representation.
  Do not automatically turn every table into cards or render two unsynchronized interaction
  models.
- Prefer `w-full`, `min-w-0`, `max-w-*`, responsive grid tracks, and `aspect-*` constraints.
  Long identifiers and user content must wrap, truncate with an accessible full-value path,
  or scroll inside their own region.
- Support 200% browser zoom and mobile browser chrome. Use dynamic viewport units and safe-area
  environment values only when building an edge-to-edge surface that needs them.
- WCAG 2.2 AA requires pointer targets at least 24 by 24 CSS pixels or sufficient spacing.
  Prefer the library's default 32–40 pixel controls and a 44 by 44 pixel target for primary
  touch interactions.

### Accessibility Contract

- Prefer native elements and the semantics built into `@semoss/ui/next`. A visible text label
  normally supplies a control's accessible name; add `aria-label` only when no visible or
  programmatic label exists.
- Maintain one logical heading hierarchy and appropriate landmarks. Do not add a `role` that
  duplicates a native element.
- Every operation must work with a keyboard. Preserve visible focus, visual order matching DOM
  order, `Escape` behavior for dismissible overlays, initial focus, and focus return.
- Associate form labels, descriptions, required state, and errors programmatically. Do not
  submit, navigate, or unexpectedly replace content merely because a value changed.
- Announce asynchronous loading, success, and error updates with the primitive's built-in
  behavior or an appropriate live region. Do not move focus for routine status updates.
- Mark decorative icons `aria-hidden`. Images conveying content need meaningful alternative
  text; do not repeat adjacent visible text in the alternative.
- Verify text, focus indicators, boundaries, and selected/error states in both light and dark
  themes. Never rely on color alone.

### Definition of Done

Before handing off a UI change, review the affected surface at:

| Check | Required coverage |
|-------|-------------------|
| Viewports | 360px mobile, 1440px laptop and ≥ 1440px desktop width |
| Themes | Light and dark |
| Content | Empty, typical, long strings, and dense results |
| Async states | Loading, success, and failure |
| Input | Keyboard-only operation and visible focus |
| Magnification | 200% browser zoom without lost content or controls |

Also run the relevant behavior tests, `pnpm lint:design` for touched frontend files, and the
package's type-check/build commands. Record anything that could not be exercised manually.

## Decision Trees

**Need a color?**
→ Use a semantic token class: `bg-primary`, `text-muted-foreground`, `border-border`,
`text-destructive`, `text-success`, `text-warning`, `bg-sidebar`, `bg-chart-1`…`chart-5`.
→ For text: Use `text-foreground` for header and subheaders, use`text-muted-foreground` for descriptions.
→ Status/state colors are exactly three: `destructive` (errors/danger), `success`, `warning`.
→ No matching token → use the *closest* semantic token. Never invent a hex value or reach for
a raw palette shade (`text-blue-600`). If a genuinely new semantic role is needed (e.g.
`info`), propose adding a token to `globals.css` instead of styling ad hoc.
→ Single primary accent color `base-primary` carries every primary interactive element and primary CTA. No second brand color exists. 

**Need text styling?**
→ Use a Typography component from `@semoss/ui/next`: `H1`–`H4`, `Lead`, `P`, `Large`,
`Small`, `Muted`, `InlineCode`, `MultilineCode`, `List`, `Quote` — or the `.heading-xl/lg/md/sm`
utilities for responsive marketing-style headings.
→ Inline tweaks use scale classes only (`text-sm`, `font-medium`, `leading-normal`).
→ Never `text-[13px]`, `text-[1.4rem]`, or micro-sizes like `text-[9px]`/`text-[10px]`/
`text-[11px]` — the smallest sanctioned size is `text-xs`.
→ For non-header typography components use 'text-base'. 
→ Use font weights normal, medium, and bold. 

**Need a modal, popover, or overlay?**
→ Use `Dialog`, `Sheet`, `Drawer`, `Popover`, `HoverCard`, `Tooltip`, `DropdownMenu`,
`ContextMenu`, or `Command` from `@semoss/ui/next`.
→ **Never** hand-roll `fixed inset-0` + a backdrop div + `z-[N]`. The lib components manage
backdrop color, stacking, focus traps, and a11y. (The repo has 9 legacy hand-rolled overlays
with four different backdrop opacities and five different z-indexes — do not add a tenth.)

**Need a component?**
1. Import it from `@semoss/ui/next` (check the inventory in
   [libs/ui/AGENTS.md](./libs/ui/AGENTS.md#component-inventory-srcnext-imported-as-semossuinext)).
2. Reuse an existing local composite built on it.
3. Build new: in `libs/ui/src/next/` if reusable across packages, locally if not — always
   composing `@semoss/ui/next` primitives and token classes via `cn()`, never from raw
   elements + copied class strings.

**Need a size or spacing?**
→ Tailwind scale on an 8px rhythm: `gap-2`, `p-4`, `px-6`; icons via `size-4`/`size-5`
(not `h-[18px] w-[18px]`).
→ Arbitrary values (`w-[347px]`, `min-h-[639px]`, `ml-[84%]`) are allowed **only** to match an
external constraint (a third-party widget, a fixed asset). Add a design-lint suppression on
the preceding line with the rule ID and a concrete reason; never use an unexplained disable.

## MUST / NEVER

### MUST

- Import all shared components, hooks, and `cn()` from **`@semoss/ui/next`** only.
- Use **semantic token classes** for every color, border, ring, fill, and stroke.
- Tint with the **token + slash-opacity idiom**: `bg-primary/10`, `ring-ring/50`,
  `bg-destructive/20`, `hover:bg-accent`. `disabled:opacity-50` on a whole element is fine.
- Use Typography components (or `.heading-*`) for headings and body text.
- **Boy-scout rule**: the staged-file design lint checks each touched frontend file in full.
  Migrate its violations to tokens/components or apply an enumerated, reason-bearing carve-out.
  Do not expand cleanup into unrelated files. (Extends the root
  [Incremental Migration](./AGENTS.md#incremental-migration) policy.)

### NEVER

| Banned pattern | Example (wrong) | Instead |
|----------------|-----------------|---------|
| Arbitrary hex classes (`-[#`) | `bg-[#f0f0f0]`, `text-[#808080]`, `border-[#E6E6E6]` | `bg-muted`, `text-muted-foreground`, `border-border` |
| Raw Tailwind palette classes | `text-green-600`, `bg-gray-500`, `border-blue-500/40` | `text-success`, `bg-muted`, `border-primary/40` |
| Pixel/rem font sizes | `text-[11px]`, `text-[1.4rem]` | `text-xs`, `H2` component |
| Arbitrary z-index | `z-[100]`, `z-[1300]`, `z-[1501]` | Use lib overlay components; they manage stacking |
| Opacity on raw colors | `bg-white/15`, `text-black/50`, `text-yellow-800/80` | `bg-background/50`, `text-muted-foreground`, `text-warning` |
| Inline style colors/fonts | `style={{ color: "#999" }}`, `style={{ fontSize: 12 }}` | Token classes (see carve-outs for runtime values) |
| Importing `libs/ui/src/next/theme.ts` | `import { lightTheme } from ...` | Dead MUI-shaped palette; contradicts `globals.css`. Never use |
| MUI / Emotion | `@mui/*`, `@emotion/*` | Fully removed from the repo; never reintroduce |
| Copying lib class strings onto raw elements | pasting `textarea.tsx` classes onto a `<textarea>` | Render the component: `<Textarea />` |
| Bare `@semoss/ui` barrel imports | `import { Button } from "@semoss/ui"` | `import { Button } from "@semoss/ui/next"` |
| Re-implementing lib components | local tooltip/modal/button forks | Import from `@semoss/ui/next` |
| Ad-hoc per-file status color maps | `BADGE_TONES = { blue: "bg-blue-500/10 ..." }` | `Badge` variants + `destructive`/`success`/`warning`/`chart-*` tokens |

## Carve-Outs (enumerated — nothing else is exempt)

1. **Token definitions:** literal colors, radii, and fonts are allowed in
  `libs/ui/src/styles/globals.css`, which defines the system. Components consuming those
  values are not exempt.
2. **User-configurable canvas data:** values rendered by
  `libs/renderer/src/components/block-defaults/**/*Block.tsx` and equivalent Blocks workspace
  previews may use runtime inline styles. Mark each site with a reason-bearing
  `inline-visual-style` suppression containing `user-configured`; the renderer's own chrome
  follows all rules.
3. **ECharts:** canvas option objects may require resolved color strings. Read chart tokens
  through one shared adapter and reuse its `chart-1`…`chart-5` values; never free-hand a
  literal map in a feature file.
4. **Third-party style bridges:** adapter CSS such as FlexLayout may map the library's custom
  properties to SEMOSS semantic variables. A literal required by an external API needs a
  line-level suppression naming that constraint.
5. **Host-controlled extension UI:** VS Code webviews should use `--vscode-*` host variables,
  including documented fallbacks where required. Chrome extension CSS cannot consume the UI
  package directly; new literals must match a current `globals.css` token and carry a
  line-level suppression naming that token.

Suppression format:

```typescript
// design-lint-disable-next-line arbitrary-size -- fixed dimensions of vendor canvas
```

Markdown fences that intentionally demonstrate invalid code must include
`design-lint-ignore` in the fence info string. Do not suppress positive examples.

## Deprecated Styling Systems

- **`packages/browser-automation/src/index.css` `@theme` block** (`--color-canvas`,
  `--color-surface`, `--color-accent: #36c7b0`, …): a rival, dark-only palette. **Deprecated**
  — do not extend it, do not add tokens, do not diverge its values further from `globals.css`.
  When touching a file that uses it, migrate those usages to `@semoss/ui` semantic classes.
- **`libs/ui/src/next/theme.ts`**: dead MUI-shaped palette with wrong values (`#1976d2` vs the
  source in `globals.css`). Zero consumers. Never import; deletion is future work.

## Scoped References

- Use `libs/ui/src/next/` to learn a primitive's API, variants, slots, and accessibility
  behavior. Primitive implementation details are not page-composition templates.
- `packages/client/src/components/ui/section/section.tsx` demonstrates a small local composite
  built with `cn()` and semantic token classes.
- Search the owning feature for its current route shell, page header, and state handling before
  borrowing a pattern from another package. No application file is a blanket exemption from
  this rulebook.

## Self-Audit

Run `pnpm lint:design -- <touched-files>` before marking work complete. The pre-commit hook
runs the same audit on every staged frontend file. Every diagnostic must be migrated in scope
or covered by an enumerated, reason-bearing carve-out above.

## Future Work (tracked, not yet done)

- `--info` token, if a real need appears (propose before styling).
- A z-index scale token set; today, rely on lib overlay components.
- Delete `libs/ui/src/next/theme.ts`.
- Migrate `packages/browser-automation` off its local `@theme` block.
