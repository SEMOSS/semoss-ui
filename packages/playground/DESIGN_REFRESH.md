# Playground refresh handoff

## Implemented

- Neutral shell and compact headers, a 16rem desktop navigation sidebar with its existing icon rail/mobile drawer, restrained welcome content, and consistent catalog/detail/form spacing. Configured branding images and overrides remain supported.
- Shared conversation composition for new and existing rooms. The work area starts at 35/65, supports keyboard resizing, and becomes Chat/Work area tabs below 1024px of available content width. Both panes stay mounted after first opening. Navigation temporarily collapses and restores its saved preference; manual overrides during an open work area remain temporary.
- Compact Lexical composer with attachment chips, Tools/Knowledge picker, model selection, Send/Stop, and secondary actions. Failed submissions restore text and attachments while preserving text entered during the request. Attachment rows scroll without displacing the controls.
- Consecutive tool activity groups, collapsed reasoning, textual statuses, retained manual expansion, and visible approval/question interfaces. Existing decision handlers and execution modes remain in use.
- Updated history, agent catalogs/details/forms, knowledge collections/documents/permissions, instructions, skill/prompt lists, sharing, room settings, activity logs, login, errors, onboarding, and embedded-page chrome. Agent and knowledge form errors retain entered values. Sharing controls lock during a pending save.
- New copy in English, Spanish, French, Hindi, Arabic, Japanese, and Dutch. Playground now supplies the locale's direction to shared Radix controls, including portaled controls.
- Follow-up render fixes: the error screen tolerates missing root context during initialization and root-route failures; the main layout copies observable style overrides before passing them to React, preventing development-mode freezing errors while preserving live theme updates.

Routes, backend payload shapes, feature flags, permission guards, room-owned workbench registration/deduplication, and separate streaming/agent-run lifecycles were retained. The reference mockup was not edited. No dependencies or backend APIs were added.

## Exact shared changes

| Token | Light | Dark |
| --- | --- | --- |
| `--accent` | `#F5F5F5` → `#F0F6FF` | `#404040` → `#243247` |
| `--sidebar-accent` | `#F5F5F5` → `#F0F6FF` | `#262626` → `#243247` |

These tokens tint shared hover, focus/selection, and sidebar interaction surfaces in every consuming application, including client and terminal. Primary blue `#0570F0`, Geist fonts, base radius, foregrounds, and status colors are unchanged.

Additive shared APIs:

- `MCPSelector.presentation="list"`; its default remains the existing cards. The compact mode retains inherited selections, permission information, catalog links, optional knowledge creation, search, pagination, and loading/error states.
- `FormInput` and `FormTextarea` honor caller IDs and associate their hint/error text with the control, preserving caller `aria-describedby` values. This accessibility improvement applies to all consumers.
- `EngineSelect.id` and `NewEngineInput.inputProps` support label, validation, blur, and ref associations.
- `DirectionProvider` supplies shared controls' reading/keyboard direction; it only affects hosts that opt in. Playground opts in.
- `ProjectDependency.engine_type` accepts the existing legacy `PROJECT` value, resolving the two touched playground dependency-type errors.

`DESIGN.md` now permits explicitly requested shell composition changes while preserving capabilities; defines conversational workbenches, mounted panes, narrow-screen tabs, composer placement, and tool activity hierarchy; replaces invalid `rounded-x`/`spacing-6` wording with valid radius/padding utilities; and scopes the 16rem sidebar, 35/65 split, and temporary navigation behavior specifically to playground.

## Validation completed

All commands used Node 24.4.0 and the installed pnpm workspace.

- Focused Biome checks and `git diff --check`: passed.
- Playground: 50 tests passed. Coverage includes chat-history actions, failed composer recovery and Stop delegation, picker locking/inheritance/search, grouping/expansion, pending decisions and cancellation handlers, navigation restoration, mounted draft/editor preservation, panel deduplication, form associations, agent/knowledge save failures, and sharing/permission guards. Regression tests also cover initialization/root-route error fallbacks, light/dark error branding, and default/custom observable style overrides including edits and removals.
- Shared notebook: 4 tests passed after correcting the sortable cell's child-prop type.
- Production builds: playground, shared UI (including declarations), client, and terminal passed. Existing large-chunk/dynamic-import warnings remain.
- Locale key/interpolation parity: 450 entries checked across the seven locales.
- Live sign-in layout reviewed at 360px and 1440px.
- An isolated, temporary component review exercised the actual pane, picker-row, attachment-chip, and shared controls at 360px, 1280px, and 1440px, in light/dark and Arabic RTL. Verified no horizontal overflow, RTL tab arrow keys, keyboard resizing, retained draft/editor values, and focus return on close. The temporary review files were removed. This was component coverage, not an authenticated end-to-end session.

## Type-check baseline and remaining verification

Playground began with five recorded type errors. All five are now fixed:

- The two dependency-type errors in the workspace list use the supported legacy `PROJECT` value.
- `libs/shared/src/components/notebook/notebook-sortable-cell.tsx`: the child element declares the existing `dragHandleProps` contract, allowing `cloneElement` to infer it.
- `packages/playground/src/stores/chat/chat.store.ts`: conversation export uses the SDK's output-tuple types (`[AbstractPixelMessage[]]` and `[string]`) without changing payloads or runtime behavior.

The playground type check passes. Client type checking now reports 287 errors across 58 existing files, one fewer than the original baseline because the shared notebook error is fixed. Comparison with the original diagnostics found no new errors; this separate client baseline was not repaired. Its production build passed during the refresh.

Authenticated browser verification remains outstanding because the local preview required sign-in. Real backend chat/approval/cancellation, room switching, uploads, sharing/permission writes, all authenticated empty/loading/error variants, and 200% browser zoom still need an authenticated review. Client and terminal were built with the shared tokens; their running buttons, menus, sidebars, and selections were not visually reviewed. Automated/component results above do not claim that coverage.

During follow-up verification of the render fixes, the previous local preview server was no longer reachable. The render regressions were reproduced and verified in React DOM tests using the real MobX root store and shared UI primitives.
