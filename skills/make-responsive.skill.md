---
name: make-responsive
description: "Use when building or changing responsive layout, small-screen overflow, touch targets or gestures, mobile navigation, drawers, viewport handling, safe areas, or orientation behavior."
---
# Make Responsive

## When to Use

- A layout must work from narrow phones to wide desktops, or overflows at small widths.
- You add or change touch targets, swipe or drag gestures, mobile navigation, drawers or sheets.
- You touch the viewport meta tag, safe-area insets, or orientation handling.

Not needed for backend-only work or changes unrelated to layout or input.

## Read First

- [docs/standards/ui.md#responsive-and-touch](../docs/standards/ui.md#responsive-and-touch): layout, targets, tables,
  navigation, viewport, gesture hook pattern.
- [docs/standards/ui.md#accessibility](../docs/standards/ui.md#accessibility): target size, reflow,
  focus and overlay rules.
- [docs/standards/react.md#forms](../docs/standards/react.md#forms) when the surface contains a form.
- [DESIGN.md](../DESIGN.md) for composition, tokens and its self-audit.
- The owning package's `AGENTS.md`.

## Steps

1. Read the owning layout and the shared primitives it uses. Identify the minimum content,
   essential actions, and overflow and focus risks. Do not redesign the navigation.
2. Write unprefixed styles for the narrowest viewport, then add `sm`/`md`/`lg`/`xl`
   breakpoints only where content needs them. Check the theme for breakpoint overrides.
3. Replace fixed widths that cause overflow with `w-full`, `min-w-0`, `max-w-*`, wrapping
   action groups or responsive grid tracks.
4. Size touch targets with `Button` sizes plus `min-h-11 min-w-11` for primary touch actions;
   measure the computed hit area and spacing.
5. For tables, choose scrolling, column priority, or a compact view; wrap a scrolling table in
   a named, focusable region as in the standard.
6. For overlays, pick `Drawer`, `Sheet` or `Dialog` by task; wire title, description, initial
   focus, dismissal and focus return. Apply the form dismissal policy to every close path.
7. For gestures, reuse the existing implementation, or keep a small hook like `useTouchSwipe`
   and add visible button alternatives.
8. Check the viewport meta tag still allows zoom, and apply safe-area padding only at the
   owning edge.
9. Exercise the affected states at each width (see Verify) and write down what you tested.

## Checklist

- [ ] Works at 360px, 1440px and the relevant desktop widths; reflows at 320 CSS px where
      WCAG 1.4.10 applies.
- [ ] No page-level horizontal overflow, except two-dimensional content in its own bounded
      scroll region.
- [ ] Long content, translated labels, loading, error and empty states checked, not just
      typical data.
- [ ] Keyboard and touch both work; target sizes and spacing measured; focus visible.
- [ ] Selected tab stays visible; overlays return focus; orientation change handled.
- [ ] Focused input and form actions stay reachable with the virtual keyboard open.
- [ ] Zoom and text resizing unrestricted; both themes checked; safe areas and reduced motion
      checked where relevant.
- [ ] DOM and focus order match the visual order after stacking.
- [ ] Every gesture has a visible single-pointer and keyboard alternative.
- [ ] Gesture hooks have tests for both directions, threshold, vertical and multi-touch input,
      missing touch IDs, cancellation, and current callbacks.

## Verify

```bash
pnpm check
pnpm --filter <package> test
pnpm --filter <package> type-check   # or check-types: use the name in its package.json
```

Inspect the package's scripts before naming a command; do not invent a mobile test command or
install tools. Emulation does not prove real-device keyboard or screen-reader behavior. Report
the widths, states, commands and interactions you actually tested, plus their limits. A
documentation-only edit needs no device audit.
