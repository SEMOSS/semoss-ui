---
name: mobile-development
description: Apply mobile-first responsive design, touch interaction patterns, and mobile UX standards when building or reviewing React components for small-screen and touch environments.
---

# Mobile Development Guide

## When to Use This Skill

Use this skill for:
- Building new components or pages that must work on phones and tablets
- Reviewing or refactoring layouts that are broken, cramped, or unusable on small screens
- Adding touch gestures, swipe interactions, or tap targets
- Implementing bottom sheets, drawers, and mobile navigation patterns
- Tasks that involve viewport handling, safe areas, or orientation changes

Do not use this skill for:
- Desktop-only utility components with no user-facing layout
- Pure backend or API changes
- Styling tweaks that have no impact on layout or touch behavior

---

## Core Principles

- Follow [DESIGN.md](../../../DESIGN.md) for composition, tokens, primitives, states, and the
  definition of done. This skill specializes those rules for small screens and touch input.
- **Mobile-first by default.** Write base styles for the smallest viewport, then scale up with responsive modifiers.
- **Touch targets must be large enough.** WCAG 2.2 AA requires at least 24 × 24 CSS pixels or
  sufficient spacing; prefer 44 × 44 pixels for primary touch interactions.
- **No hover-only interactions.** Every hover behavior must have an equivalent touch/focus interaction.
- **Avoid fixed pixel widths.** Prefer `w-full`, `max-w-*`, percentages, or fluid grid units.
- **Never suppress the viewport meta tag.** Do not use `user-scalable=no` or `maximum-scale=1`.

---

## Tailwind Responsive Breakpoints

Use Tailwind's mobile-first breakpoint prefixes:

| Prefix | Min Width | Target |
|--------|-----------|--------|
| _(none)_ | 0px | Mobile (base) |
| `sm:` | 640px | Large phone / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

**Pattern — column stack on mobile, grid on desktop:**
```tsx
<div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id} item={item} />
  ))}
</div>
```

---

## Touch Target Rules

- Use the sizes built into `Button` and other `@semoss/ui/next` controls. Prefer `icon-lg` for
  an icon-only control used primarily on touch screens.
- Increase the hit area with sanctioned component sizes or padding rather than arbitrary
  pixel dimensions.
- Never place two interactive elements closer than 8 px apart without additional spacing on touch viewports.

**Pattern — ensuring minimum touch target:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button size="icon-lg" variant="ghost" aria-label="Delete record">
      <Trash2 aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Delete record</TooltipContent>
</Tooltip>
```

---

## Layout Patterns

### Full-width forms on mobile
```tsx
<form className="flex flex-col gap-4 w-full md:max-w-lg">
  <Field>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <Input id="name" className="w-full" />
  </Field>
</form>
```

### Responsive data tables

Choose horizontal scrolling, column prioritization, or an alternate compact representation
based on the task. Do not automatically duplicate every table as a card list. When preserving
the table is useful, contain its overflow and label the region:

```tsx
<div className="overflow-x-auto" role="region" aria-label="Audit results">
  <Table className="min-w-max">
    <TableHeader>{/* column headers */}</TableHeader>
    <TableBody>{/* rows */}</TableBody>
  </Table>
</div>
```

### Bottom sheet / mobile drawer
Use `Drawer` from `@semoss/ui/next` for a mobile-first task. It owns stacking, focus, keyboard
behavior, and the backdrop.

```tsx
<Drawer open={open} onOpenChange={setOpen}>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Filter results</DrawerTitle>
      <DrawerDescription>Choose the results to include.</DrawerDescription>
    </DrawerHeader>
    <div className="px-4">{/* filter fields */}</div>
    <DrawerFooter>
      <Button onClick={applyFilters}>Apply filters</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

---

## Navigation on Mobile

- Replace horizontal tab bars with a hamburger menu or bottom navigation bar on screens narrower than `md`.
- Ensure the mobile nav is reachable via keyboard and screen reader.
- Close open menus when the user presses `Escape` or taps outside.

**Pattern — responsive navigation:**
```tsx
<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
  <SheetTrigger asChild>
    <Button className="md:hidden" size="icon-lg" variant="ghost" aria-label="Open navigation">
      <Menu aria-hidden="true" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    <nav aria-label="Mobile navigation">{/* links */}</nav>
  </SheetContent>
</Sheet>

<nav className="hidden md:flex gap-4" aria-label="Main navigation">
  {/* links */}
</nav>
```

---

## Viewport and Safe Areas

When rendering full-screen or edge-to-edge layouts on devices with notches or home indicators, apply safe area insets:

```tsx
{/* In index.css or a layout component */}
<div className="min-h-screen pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)]">
  {children}
</div>
```

Ensure the `<meta name="viewport">` tag in `index.html` reads:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Never add `user-scalable=no` or `maximum-scale` restrictions — these harm accessibility.

---

## Touch Gesture Hooks

When swipe or drag interaction is needed, encapsulate it in a custom hook rather than placing event logic inline in components.

**Pattern — `useTouchSwipe` hook:**
```ts
import { useRef } from "react";

interface SwipeHandlers {
  onTouchStart: React.TouchEventHandler;
  onTouchEnd: React.TouchEventHandler;
}

/**
 * Detects horizontal swipe gestures and calls direction callbacks.
 * @param {() => void} onSwipeLeft - Called when user swipes left.
 * @param {() => void} onSwipeRight - Called when user swipes right.
 * @param {number} [threshold=50] - Minimum px distance to trigger swipe.
 * @returns {SwipeHandlers} Touch event handlers to spread onto a container element.
 */
export function useTouchSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
): SwipeHandlers {
  const startX = useRef<number | null>(null);

  const onTouchStart: React.TouchEventHandler = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd: React.TouchEventHandler = (e) => {
    if (startX.current === null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    if (delta < -threshold) onSwipeLeft();
    else if (delta > threshold) onSwipeRight();
    startX.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
```

Usage:
```tsx
const swipeHandlers = useTouchSwipe(handleNext, handlePrev);

<div {...swipeHandlers} className="overflow-hidden">
  {/* carousel content */}
</div>
```

---

## Images and Media

- Use `max-w-full` and `h-auto` on all images to prevent overflow.
- Use `object-cover` with a fixed container height for consistent image cards.
- Prefer `<picture>` with `srcset` for responsive images when performance matters.
- Never set a fixed pixel width on an image inside a fluid container.

```tsx
<div className="w-full aspect-video overflow-hidden rounded-md">
  <img
    src={src}
    alt={alt}
    className="w-full h-full object-cover"
    loading="lazy"
  />
</div>
```

---

## Typography on Small Screens

- Use `text-sm` or `text-base` as the mobile default; scale up with `md:text-lg` etc.
- Long strings (names, URLs) must use `truncate` or `break-words` to prevent layout overflow.
- Line length should not exceed ~75 characters (`max-w-prose`) on readable text blocks.

```tsx
<P className="break-words text-sm leading-relaxed md:text-base">
  {description}
</P>
```

---

## Scrolling

- Never hide scrollbars on touch devices with `overflow: hidden` on the `<body>` unless a modal is open.
- Use `-webkit-overflow-scrolling: touch` equivalent (handled by modern browsers) for smooth scroll containers.
- Horizontally scrollable areas must have visible scroll affordance (shadow or fading edge) or a clear label.

Use the responsive table pattern above rather than native table markup with an arbitrary fixed
width.

---

## Performance on Mobile

- Lazy-load off-screen content with `loading="lazy"` on images and React's `React.lazy` + `Suspense` for route-level code splitting.
- Avoid long task blocking on the main thread during scroll handlers; debounce with a 100–200 ms delay.
- Avoid large inline SVGs; import as components or use sprite sheets.

---

## Testing Checklist

Before marking a mobile feature complete, verify:

- [ ] Layout renders without horizontal scroll at 375 px (iPhone SE) and 390 px (iPhone 14)
- [ ] Targets meet the 24 × 24 px WCAG minimum; primary touch controls prefer 44 × 44 px
- [ ] No hover-only interactions
- [ ] Viewport meta tag does not restrict zoom
- [ ] Images do not overflow their containers
- [ ] Keyboard navigation and screen reader behavior are intact (apply the `accessibility` skill)
- [ ] Any swipe/gesture has an equivalent keyboard or button fallback

---

## Relationship to Other Skills

- Always apply the **`accessibility`** skill alongside this one for any interactive component.
- For forms and paginated lists, follow the existing feature pattern plus `DESIGN.md`; no
  additional repository skill is currently defined for those patterns.
