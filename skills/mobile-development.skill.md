---
name: mobile-development
description: Apply mobile-first responsive design, touch interaction patterns, and mobile UX standards when building or reviewing React components for small-screen and touch environments.
---

# Mobile Development Guide

## When to Use This Skill

Use for responsive layouts, small-screen overflow, touch targets/gestures, mobile navigation,
drawers, viewport handling, safe areas, or orientation changes. Do not require mobile audits
for backend-only work or changes unrelated to layout or input.

Follow [DESIGN.md](../DESIGN.md) for composition and tokens, the
[React standard](./react-standard.skill.md) for hooks/types/naming, and the
[accessibility skill](./accessibility.skill.md) for interactive behavior. Use the
[form skill](./react-form-builder.skill.md) for fields and submission. Formatting and lint
settings live in [biome.json](../biome.json).

## Workflow and Layout

1. Read the owning layout and relevant shared primitives. Identify the minimum content,
   essential actions, and overflow/focus risks without redesigning the navigation.
2. Write unprefixed styles for the narrowest supported viewport, then add breakpoints when
   content needs them. Tailwind defaults are `sm` 40rem, `md` 48rem, `lg` 64rem, and `xl`
   80rem (640/768/1024/1280 CSS px at the default 16px size). Check theme overrides; these
   are layout thresholds, not phone/tablet detection or evidence of touch capability.
3. Prefer `w-full`, `min-w-0`, `max-w-*`, wrapping action groups, responsive grid tracks,
   and `aspect-*`. Stable sizes for icon buttons/media are useful; do not ban all fixed
   dimensions. Avoid unexplained arbitrary values under the design rulebook.
4. Preserve logical DOM/focus order as content stacks. Avoid CSS reordering that makes
   keyboard order differ from the visual sequence. Keep controls usable with long labels,
   translated text, large text, and reduced motion.
5. Verify the affected states and viewports with the checks below. Do not infer a usable
   touch experience solely from a responsive screenshot.

## Touch Target Rules

- Meet the [WCAG target-size rule and exceptions](./accessibility.skill.md#contrast-reflow-and-pointer-targets).
  AA's baseline is 24 by 24 CSS px; prefer 44 by 44 CSS px for primary touch actions.
  There is no universal 8px-gap rule. Measure the actual target and spacing, not its icon.
- Reuse `Button` sizes and token-scale padding/minimums. The current
  [button implementation](../libs/ui/src/next/button.tsx) uses `size-10` for `icon-lg`
  (normally 40px), not 44px. A `min-h-11 min-w-11` constraint can supply the preferred
  touch area; verify computed dimensions and avoid overlapping hit areas.
- Do not hide essential content or actions behind hover. Provide accessible names and
  keyboard/touch access independently of tooltips. For hoverable tooltips, use the
  supported root override and verify hover, focus, and Escape behavior.

Standalone example; `onRemove` invokes the feature's existing removal/confirmation flow:

```tsx
import { Trash2 } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface RemoveItemButtonProps {
	/** Requests the feature's removal or confirmation flow. */
	onRemove: () => void;
}

/** Provides a named removal action with a larger touch target. */
export const RemoveItemButton = ({ onRemove }: RemoveItemButtonProps) => (
	<Tooltip disableHoverableContent={false}>
		<TooltipTrigger asChild>
			<Button
				type="button"
				size="icon-lg"
				variant="ghost"
				className="min-h-11 min-w-11"
				aria-label="Remove item"
				onClick={onRemove}
			>
				<Trash2 aria-hidden="true" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Remove item</TooltipContent>
	</Tooltip>
);
```

## Layout Patterns

### Forms

Use the [React form builder's canonical pattern](./react-form-builder.skill.md#canonical-pattern)
and allow fields/actions to fill or wrap within the available width. Do not add another native
form. Test virtual-keyboard resizing, visibility of errors, and access to the submit/cancel
actions; a fixed footer must not hide the focused input.

### Data Tables

Choose horizontal scrolling, column prioritization, or an alternate compact representation
based on the task. Keep comparison semantics and access to hidden information; do not
automatically duplicate every table as cards. `Table` already supplies an overflow wrapper.
In this composition fragment, `wrapperClassName="overflow-visible"` makes the named, focusable
outer region the single scroll owner. Use it when a keyboard-accessible scroll region is
needed, preserve focus styling, and supply actual headers/rows from the feature:

```tsx
<div
	className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
	role="region"
	aria-label="Audit results"
	tabIndex={0}
>
	<Table className="min-w-max" wrapperClassName="overflow-visible">
		<TableHeader>{headers}</TableHeader>
		<TableBody>{rows}</TableBody>
	</Table>
</div>;
```

### Drawers and Sheets

Use `Drawer` for mobile-first tasks, `Sheet` for contextual detail, or the existing `Dialog`
for focused decisions; do not replace every dialog at a breakpoint. Include each primitive's
title and appropriate description, initial focus, a visible dismissal path, and focus return.
Keep long content scrollable with actions reachable. Reuse the library's backdrop/stacking
and verify its behavior with the virtual keyboard and viewport resizing. For forms, apply
the form skill's pending-dismissal policy to every close path, including gestures.

## Navigation on Mobile

- Preserve information architecture. `Tabs` switch associated panels; navigation links
  change location. A narrow viewport is not a reason to turn all tabs into a hamburger menu
  or bottom navigation. Keep selected state, panel relationships, and keyboard behavior.
- Choose wrapping or a clearly discoverable scrollable tab list when suitable; verify the
  focused/selected tab remains visible. Use an existing mobile navigation shell or a named
  `Sheet` trigger for genuinely collapsed site navigation when content requires it.
- Keep one active navigation representation accessible at each breakpoint. Close a mobile
  navigation overlay after selection and handle focus when resizing hides its trigger.
  Preserve Escape/outside-dismissal behavior where appropriate; do not impose it on a
  non-cancellable in-flight form without its dismissal policy.

## Viewport and Safe Areas

Preserve a zoom-capable viewport declaration in the owning HTML document:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Do not add `user-scalable=no` or zoom-limiting `maximum-scale`, or remove legitimate existing
viewport options. Use dynamic viewport units when mobile browser chrome affects an edge-to-edge
surface. Apply safe-area padding only at the owning edge, with distinct left/right insets;
do not apply the left inset to both sides or double-pad nested content. Where edge-to-edge
rendering is intended, coordinate `viewport-fit=cover` with all affected edges and devices.
Use the design rulebook's viewport exception, not arbitrary sizing throughout the app.

## Touch Gesture Hooks

Reuse the feature's existing gesture implementation first. For a small custom interaction,
keep touch tracking in a hook, do not block native scrolling/zoom indiscriminately, and
provide visible button alternatives usable by single-pointer and keyboard input. Dragging
requires a non-dragging pointer alternative too. Honor reduced motion for animated responses.

This standalone hook is a minimal horizontal swipe detector, not a carousel/drag engine. It
ignores multi-touch, predominantly vertical movement, missing touches, and cancellation.
Its callbacks reflect the current render without React 19.2-only hooks. Returned event
props keep native `onX` names; handlers use `handleX`.

```ts
import { type TouchEventHandler, useRef } from "react";

interface SwipeHandlers {
	onTouchStart: TouchEventHandler<HTMLElement>;
	onTouchEnd: TouchEventHandler<HTMLElement>;
	onTouchCancel: TouchEventHandler<HTMLElement>;
}

interface SwipeStart {
	identifier: number;
	clientX: number;
	clientY: number;
}

/**
 * Detects single-touch horizontal swipes without preventing native gestures.
 * @param onSwipeLeft - Called after a left swipe.
 * @param onSwipeRight - Called after a right swipe.
 * @param threshold - Positive finite minimum horizontal distance in CSS pixels.
 * @returns Touch handlers for the gesture surface.
 */
export function useTouchSwipe(
	onSwipeLeft: () => void,
	onSwipeRight: () => void,
	threshold = 50,
): SwipeHandlers {
	const startRef = useRef<SwipeStart | null>(null);

	const handleTouchStart: TouchEventHandler<HTMLElement> = (event) => {
		const touch = event.touches[0];
		startRef.current =
			event.touches.length === 1 && touch
				? {
						identifier: touch.identifier,
						clientX: touch.clientX,
						clientY: touch.clientY,
					}
				: null;
	};

	const handleTouchCancel: TouchEventHandler<HTMLElement> = () => {
		startRef.current = null;
	};

	const handleTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
		const start = startRef.current;
		startRef.current = null;
		if (
			!start ||
			event.touches.length > 0 ||
			!Number.isFinite(threshold) ||
			threshold <= 0
		)
			return;

		const touch = Array.from(event.changedTouches).find(
			(candidate) => candidate.identifier === start.identifier,
		);
		if (!touch) return;

		const deltaX = touch.clientX - start.clientX;
		const deltaY = touch.clientY - start.clientY;
		if (
			Math.abs(deltaX) < threshold ||
			Math.abs(deltaX) <= Math.abs(deltaY)
		)
			return;

		if (deltaX < 0) onSwipeLeft();
		else onSwipeRight();
	};

	return {
		onTouchStart: handleTouchStart,
		onTouchEnd: handleTouchEnd,
		onTouchCancel: handleTouchCancel,
	};
}
```

Call the hook unconditionally at the top level of the owning component, then spread its
handlers onto the intended non-control surface. Do not intercept gestures over inputs or
other nested interactive elements; use the existing gesture library if arbitration is needed.
Keep explicit previous/next controls available; a gesture is an enhancement, not the only path.

## Content, Scrolling, and Performance

- Preserve aspect ratios and reserve media dimensions. Use responsive `srcSet`/`sizes` or
  `<picture>` where useful; JSX spells it `srcSet`. Choose `object-contain` when users need
  the whole object, `object-cover` only when cropping is acceptable. Lazy-load off-screen
  images, not a critical first-viewport image.
- Use shared Typography components and the design type scale. Wrap long content with a
  shrinkable parent (`min-w-0`); truncation requires a keyboard/touch-accessible full-value
  path. Do not shrink important text just to make it fit.
- Preserve scroll reachability and a discoverable overflow affordance. Do not set body
  overflow to hidden merely to conceal layout bugs; let shared modal primitives own scroll
  locking. Test nested scrolling and avoid unnecessary competing scroll containers.
- Measure main-thread work before optimizing. Debouncing every scroll handler by a fixed
  delay is not a general fix. Use an existing observer or scheduling abstraction when
  appropriate; clean up subscriptions and do not make a listener passive if it must prevent
  default behavior. Follow the React standard for lazy loading and supported React versions.

## Verification and Handoff

For the changed surface, apply [DESIGN.md's definition of done](../DESIGN.md#definition-of-done)
and the accessibility skill, including:

- 360px, 1440px, and relevant desktop widths; 320 CSS px reflow where WCAG 1.4.10 applies;
  no page-level horizontal overflow except permitted two-dimensional content within its
  bounded region. Check long content and loading/error/empty states, not just typical data.
- Keyboard and touch operation, measured target sizes/spacing, visible focus, selected-tab
  visibility, overlay focus return, orientation changes, and virtual-keyboard reachability.
- Zoom/text resizing, unrestricted viewport scaling, both themes, and safe areas/reduced
  motion where relevant. Emulation does not prove real-device keyboard or screen-reader behavior.
- Focused existing behavior tests for gestures and responsive interactions. For the hook
  above, test both directions, threshold, vertical/multi-touch input, missing touch IDs,
  cancellation, and current callbacks; no dependency installation is implied.

Report the widths, states, commands, and interactions actually tested, plus limits. Do not
invent a mobile test command or require a device audit for an unrelated documentation edit.
