---
name: accessibility
description: Apply WCAG 2.2 AA accessibility requirements when building or reviewing React UI, forms, dialogs, menus, tables, filters, navigation, and other interactive frontend components.
---

# Accessibility Implementation and Review Guide

## When to Use This Skill

Use this skill for:
- New React components with interactive UI
- Forms, dialogs, menus, dropdowns, tabs, tables, filters, and navigation
- UI reviews, bugfixes, and refactors where accessibility may be affected
- Frontend tasks involving keyboard interaction, focus management, status messaging, or validation

Do not use this skill for:
- Pure backend changes
- Non-UI utility refactors with no user-facing interaction
- Styling-only changes that do not affect semantics, focus, contrast, or interaction

## Accessibility Standard

Target WCAG 2.2 Level AA.

Follow [DESIGN.md](../../../DESIGN.md) for the shared component, state, responsive, and visual
contracts. This skill specializes those rules for semantic and assistive-technology behavior.

The implementation and review must explicitly account for these success criteria:
- 1.1.1 Non-text Content
- 1.3.1 Info and Relationships
- 1.4.3 Contrast - Minimum
- 1.4.11 Non-text Contrast
- 2.1.1 Keyboard
- 2.1.2 No Keyboard Trap
- 2.4.3 Focus Order
- 2.4.7 Focus Visible
- 2.5.8 Target Size - Minimum
- 3.2.2 On Input
- 3.3.1 Error Identification
- 3.3.2 Labels or Instructions
- 3.3.8 Accessible Authentication
- 4.1.2 Name, Role, Value
- 4.1.3 Status Messages

## Required Implementation Rules

### Semantics and Relationships
- Prefer native HTML elements before ARIA.
- Use semantic landmarks and headings where appropriate.
- Every form control must have a programmatic label.
- Group related controls with `fieldset` and `legend` when appropriate.
- Tables must use proper table semantics and header associations.
- Decorative icons and images must use empty alt text or be hidden from assistive technology.

### Keyboard and Focus
- All interactive behavior must be usable with keyboard only.
- Never remove visible focus styles.
- Ensure focus order matches the visual and logical order.
- Dialogs, popovers, and menus must support `Escape` when appropriate.
- Focus must not become trapped unless the component is a true modal dialog with an intentional focus trap and a clear exit.
- Do not create hover-only or pointer-only interactions.

### Forms and Validation
- Do not trigger navigation or submit on value change alone.
- Error messages must be textual, specific, and associated with the field.
- Required fields must be identified clearly.
- Validation feedback should be announced when possible.
- Compose controls with `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` from
	`@semoss/ui/next`, following the owning feature's form-state pattern.

### Status and Dynamic Updates
- Use `aria-live` for success, loading, and error status messages that update without focus movement.
- Ensure interactive controls expose accessible name, role, state, and value.
- When content changes after a user action, verify the update is announced or focus is moved intentionally.

### Visual Accessibility
- Text must meet minimum contrast.
- Component boundaries, selected states, error states, and focus indicators must meet non-text contrast.
- Click and tap targets must be at least 24 by 24 CSS pixels or have equivalent spacing.

## React-Specific Guidance

- Prefer real `button` elements for actions and real links for navigation.
- Do not attach click handlers to non-interactive elements unless the full keyboard and semantic behavior is added.
- When conditionally rendering content, verify focus destination and screen reader announcement behavior.
- For dialogs and overlays, verify initial focus, focus return, and escape behavior.
- For icon-only controls, provide an accessible name.
- Keep async logic outside `useEffect` and keep the effect focused on orchestration, consistent with repo conventions.

## Review Checklist

When reviewing UI code, check:
- Is every interactive element reachable and operable by keyboard?
- Is there a visible focus indicator on every focusable control?
- Does the control expose a clear accessible name?
- Are form fields labeled and errors tied to the correct inputs?
- Are live updates announced without stealing focus?
- Are there any mouse-only affordances?
- Are contrast and target sizes sufficient?
- Does changing a form control unexpectedly navigate, submit, or refresh content?

## Output Requirements for UI Tasks

For UI implementation or UI review tasks, conclude with:

**Accessibility Compliance Audit:**
- **SC IDs Addressed**: list the WCAG criteria covered
- **Keyboard Test**: describe expected `Tab`, `Shift+Tab`, `Enter`, `Space`, arrow key, and `Escape` behavior where applicable
- **Screen Reader Check**: describe the expected announcement for the main interactive elements and status messages
- **Automated Test**: provide the exact command used or recommended

## Automated Testing Guidance

Prefer the affected package's existing Testing Library/Vitest suite. Add `jest-axe` coverage
only where that package already provides the dependency and setup; do not invent a command or
silently install a tool during validation. At minimum, run the package test command and record
the keyboard and screen-reader checks performed manually.

Example for the client:

```bash
pnpm --filter @semoss/client test
```

## Project-Conscious Expectations

- Preserve existing component, hook, and API patterns used in the repo.
- Keep accessibility fixes minimal, specific, and semantic.
- Avoid adding ARIA when native semantics already solve the problem.
- When a custom widget is necessary, implement the full keyboard interaction model rather than a partial approximation.
- Follow root TSDoc and form conventions directly; no additional repository skill is currently
	defined for those patterns.
