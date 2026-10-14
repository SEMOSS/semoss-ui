---
name: accessibility
description: Apply WCAG 2.2 AA accessibility requirements when building or reviewing React UI, forms, dialogs, menus, tables, filters, navigation, and other interactive frontend components.
---

# Accessibility Implementation and Review Guide

## When to Use This Skill

Use for interactive UI, forms, overlays, navigation, tables, and changes to semantics,
keyboard behavior, focus, contrast, status messages, or validation. Backend-only work and
non-UI refactors do not need a UI audit. For documentation, check the guidance and examples;
do not claim that reviewing prose verifies an application.

Target [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/). Apply all criteria relevant to
the affected surface; the criteria below are working checks, not an exhaustive conformance
assessment. Follow [DESIGN.md](../DESIGN.md) for shared design contracts and the
[React standard](./react-standard.skill.md) for implementation conventions. Use the
[form skill](./react-form-builder.skill.md) for form composition and state, and the
[mobile skill](./mobile-development.skill.md) for responsive and touch behavior.

## Workflow

1. Read the affected component and its shared primitives. Identify the task, accessible
	 names, keyboard model, focus destinations, and relevant async states before editing.
2. Reuse `@semoss/ui/next` components and native semantics. Inspect rendered behavior rather
	 than assuming that a shared wrapper implements every accessibility requirement.
3. Fix in-scope issues without changing public APIs or unrelated navigation. Report shared
	 primitive limitations that cannot be fixed within the authorized scope.
4. Verify the affected behavior using the checks below and distinguish observed results
	 from expected behavior and checks that could not be run.

## Semantics and Names

- Use native buttons for actions, links for navigation, logical headings and landmarks,
	and table headers with correct associations (1.3.1, 2.4.6, 4.1.2).
- Every control needs a programmatic name. Prefer an associated visible label; placeholders
	and tooltips are not substitutes. An icon-only button needs an accessible name, usually
	`aria-label`. When visible text exists, the accessible name must contain it (2.5.3).
- Group related controls with `FieldSet`/`FieldLegend` where appropriate. Verify individual
	option names and group names for radio groups, sliders, and other composite controls.
- Give meaningful images appropriate alternative text. Use `alt=""` for decorative images
	and `aria-hidden="true"` for decorative icons, not for focusable controls (1.1.1).
- Expose expanded, selected, checked, invalid, and busy states where applicable. Do not add
	redundant roles or conflicting ARIA to library/native semantics.

## Keyboard, Focus, and Overlays

- Support the widget's keyboard model, including tab order, activation, arrow keys, and
	dismissal where applicable. Do not add custom arrow-key handling to ordinary links or
	buttons (2.1.1, 2.1.2).
- Keep DOM, visual, and logical focus order aligned; avoid positive `tabIndex`. Preserve
	visible focus and keep focused controls from being entirely hidden by author-created
	sticky bars or overlays (2.4.3, 2.4.7, 2.4.11).
- Use shared dialogs, sheets, drawers, menus, and popovers. Verify their title/name,
	initial focus, modal containment when applicable, dismissal, and focus return to the
	trigger or a logical successor. Non-modal content must not gain an arbitrary focus trap.
- Include `DialogTitle` and a useful `DialogDescription` where appropriate. If no description
	applies, deliberately omit the description association using the supported content API.
	A disabled Cancel button alone does not disable Escape, outside clicks, or the close icon;
	follow the [form dismissal policy](./react-form-builder.skill.md#modal--dialog-forms).
- Hover/focus content must be dismissible, hoverable, and persistent under 1.4.13, subject
	to its stated exceptions. Keep essential information available on touch and keyboard.
	The current [Tooltip](../libs/ui/src/next/tooltip.tsx) sets `disableHoverableContent` on
	its internal provider; use the supported `<Tooltip disableHoverableContent={false}>`
	override when hoverability is required, and verify pointer travel into the content.
	An outer provider does not override the nested one. Tooltips must not contain interactive
	controls; do not claim automatic compliance from the primitive alone.

## Forms and Status Messages

- Follow the [form skill](./react-form-builder.skill.md) for `Form`/`Form*` composition,
	server errors, resets, and submission. Identify required fields in visible text and
	programmatic state; provide specific textual errors and useful correction suggestions
	(3.3.1, 3.3.2, 3.3.3).
- Verify labels, `aria-invalid`, description/error associations, and focus on invalid
	submission. The current [Form wrappers](../libs/ui/src/next/form.tsx) render descriptions
	and errors but do not generally connect them with `aria-describedby`. Rendered text or
	an alert announcement alone is not a persistent field association. Use supported props
	where sufficient and report shared API gaps; do not fork the wrappers or waive the check.
- Do not unexpectedly submit, navigate, or change context merely because a value changes
	(3.2.2). Updating filter results is not automatically a change of context; preserve focus
	and communicate the meaningful result.
- Announce meaningful asynchronous statuses without routine focus movement (4.1.3).
	Prefer existing primitive behavior; otherwise use a stable `role="status"` region for
	polite updates, or `role="alert"` for urgent errors. These roles already imply live
	behavior. Do not announce every keystroke or duplicate the same error through a field
	alert, toast, and an additional live region. `aria-busy` alone is not a status message.
- Preserve accessible recovery after errors; a toast is not the only record of a persistent
	failure. For authentication changes, support password managers and paste and review
	3.3.8; do not require a cognitive test without an allowed alternative or assistance.

## Contrast, Reflow, and Pointer Targets

- Text contrast (1.4.3): at least 4.5:1 normally; at least 3:1 only for text at least 18pt
	(24 CSS px) regular or 14pt (about 18.67 CSS px) bold. Small bold text still needs 4.5:1.
	Account for the criterion's exceptions such as inactive controls and logos.
- Non-text contrast (1.4.11): at least 3:1 against adjacent colors for visual information
	needed to identify controls and their states, and meaningful graphical objects. Not
	every decorative border needs contrast; inactive controls and unmodified user-agent
	appearance have exceptions. Verify focus and error/selected states in both themes and
	never rely on color alone (1.4.1).
- Support text resizing to 200% (1.4.4). Check reflow at 320 CSS px width for horizontally
	written content (1.4.10), equivalent to a 1280px viewport at 400% zoom. Necessary
	two-dimensional content such as a data table may scroll in its own bounded region;
	this is not a blanket exception for page-level overflow. Also meet the design rulebook's
	viewport and zoom checks.
- Pointer targets (2.5.8): at least 24 by 24 CSS px, unless a defined exception applies.
	For the spacing exception, a 24px-diameter circle centered on each undersized target
	must not intersect another target or the circle around another undersized target.
	Equivalent controls, inline targets, unmodified user-agent controls, and essential
	presentation have specific exceptions. An arbitrary 8px gap is not proof of compliance.
	Prefer 44 by 44 CSS px for primary touch actions; 44px is not the AA minimum.
- Gestures need an appropriate single-pointer alternative (2.5.1); dragging needs a
	non-dragging single-pointer alternative unless essential (2.5.7). A keyboard alternative
	alone does not satisfy these pointer requirements.

## Verification and Handoff

Scope checks to the changed behavior while honoring the owning package and
[React handoff guidance](./react-standard.skill.md#full-file-review-and-handoff):

- Exercise keyboard-only operation, visible/unobscured focus, overlay dismissal and focus
	return, field naming/associations, and relevant loading/error/success announcements.
- Inspect the accessibility tree and test with a screen reader where available. An
	expected announcement is not a tested announcement; say which was actually checked.
- Check contrast, reflow/zoom, and target geometry for the affected surface. Use the
	existing package's focused tests. Use axe tooling only if installed and configured;
	inspect scripts before giving an exact command. Do not invent tools or install them
	silently. Automated checks cannot certify full WCAG conformance.
- Report concrete fixes, relevant criterion IDs for findings, commands/results, and
	residual gaps. Do not attach a detailed compliance audit to unrelated tasks or report
	untested behavior as passing. Lint/formatting rules live in [biome.json](../biome.json).
