---
name: build-component
description: "Use when adding or changing a design-system component in @semoss/ui (src/next), or a reusable component in @semoss/shared or an app. Covers the CVA + data-slot authoring pattern, exports, and folding single-use pieces."
---

# Build a Component

## When to Use

Adding or changing a reusable component. If the piece has one consumer, first check whether it
should be folded into that consumer ([Fold Single-Use Pieces](../docs/standards/react.md#fold-single-use-pieces)).

## Read First

- [libs/ui/AGENTS.md](../libs/ui/AGENTS.md) for token and import rules;
  [src/next/index.ts](../libs/ui/src/next/index.ts) is the component inventory
- [DESIGN.md](../DESIGN.md) and [ui.md: Styling](../docs/standards/ui.md#styling)
- [react.md](../docs/standards/react.md) and [ui.md: Accessibility](../docs/standards/ui.md#accessibility)

## Steps

1. Look for an existing `@semoss/ui/next` component or local composite. Extend it with a variant
   before creating a new one.
2. Choose the owner:
   - A design-system primitive with no product logic goes in `libs/ui/src/next/`.
   - A product component reused across apps goes in `libs/shared`.
   - Anything else stays in the app feature that uses it.
3. **In `libs/ui`**, add the component as a flat kebab-case file in `src/next/`, following the
   authoring pattern:
   - Use `cva` for variants, reusing the names already in
     [button.tsx](../libs/ui/src/next/button.tsx) rather than inventing synonyms.
   - Put `data-slot="<name>"` on the root and on every sub-part.
   - Support `asChild?: boolean` with Radix `Slot` for polymorphic components.
   - Compose classes with `cn(...)`, passing `className` last. Use the internal `@/lib/utils` inside `libs/ui` only.
   - Colocate related sub-components in the same file.
   - Export the component and its `xVariants` from `src/next/index.ts`.
4. **Outside `libs/ui`**, write one component per file, with a typed props
   interface that has TSDoc. Import UI only from `@semoss/ui/next`.
5. Give it an accessible name and keyboard behavior. Overlays must manage focus.
6. Make sure it uses only semantic tokens, has stable dimensions, and has no arbitrary values.

## Checklist

- [ ] Reuses existing variants and sizes rather than inventing new ones
- [ ] Has `data-slot` on every part (when in `libs/ui`)
- [ ] Places `className` last in `cn()`
- [ ] Has no new state library ([ui boundaries](../libs/ui/AGENTS.md#boundaries))
- [ ] Is keyboard operable with visible focus
- [ ] Is a public export only if it has more than one consumer

## Verify

```bash
pnpm exec biome check <touched files>
pnpm --filter @semoss/ui build            # when libs/ui changed
pnpm --filter @semoss/playground dev      # check it in a consumer
```
