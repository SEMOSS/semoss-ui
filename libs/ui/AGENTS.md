# AGENTS.md - @semoss/ui Component Library

This document provides context for AI coding assistants working with the SEMOSS UI component library.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.
> Repo-wide design rules live in [../../DESIGN.md](../../DESIGN.md).

## Overview

`@semoss/ui` is the **single source of truth for design** in this monorepo:

- **shadcn/ui** + **Radix UI** primitives, styled with **Tailwind CSS v4** (CSS-first — there
  is no `tailwind.config.*` anywhere in the repo).
- All design tokens live in [src/styles/globals.css](src/styles/globals.css) and are consumed
  by every app via `@import "@semoss/ui/globals.css";`.
- All shared components live in [src/next/](src/next/) and are imported by consumers **only**
  as `@semoss/ui/next`.

> **Conventions:** `@semoss/ui` is the **exception** to the root "one component per file" rule
> — related components are colocated in a file (e.g. `Card` + `CardHeader` + `CardContent`).

## Design Tokens (`src/styles/globals.css`)

Tokens are raw values on `:root` (light) and `.dark` (dark), mapped to Tailwind utilities via
`@theme inline`. **Never hardcode a color, radius, or font — use the token's utility class.**

### Semantic colors

| Token | Utility examples | Use for |
|-------|------------------|---------|
| `background` / `foreground` | `bg-background`, `text-foreground` | Page surface and default text |
| `secondary-background` | `bg-secondary-background` | Alternate page surface |
| `card` / `card-foreground` | `bg-card`, `text-card-foreground` | Card surfaces |
| `popover` / `popover-foreground` | `bg-popover` | Popovers, dropdowns, menus |
| `primary` / `primary-foreground` | `bg-primary`, `text-primary` | Brand blue; primary actions, links |
| `secondary` / `secondary-foreground` | `bg-secondary` | Secondary actions |
| `muted` / `muted-foreground` | `bg-muted`, `text-muted-foreground` | De-emphasized text/surfaces |
| `accent` / `accent-foreground` | `hover:bg-accent` | Hover/active tints |
| `destructive` / `destructive-foreground` | `text-destructive`, `bg-destructive/10` | Errors, dangerous actions |
| `success` / `success-foreground` | `text-success`, `bg-success/10` | Success/positive status |
| `warning` / `warning-foreground` | `text-warning`, `bg-warning/10` | Warning/caution status |
| `border` / `input` / `ring` / `ring-offset` | `border-border`, `ring-ring/50` | Borders, input outlines, focus rings |
| `chart-1` … `chart-5` | `bg-chart-1`, `text-chart-2` | Data visualization series colors |
| `sidebar-*` | `bg-sidebar`, `border-sidebar-border` | Sidebar chrome (8 tokens) |
| `login-*` | — | Login page skin only |

Status colors are **only** `destructive`, `success`, and `warning`. There is no `info` token —
propose one before inventing blue status styling.

### Other tokens

- **Radius**: `--radius: 0.625rem`, exposed as `rounded-sm/md/lg/xl`. Never `rounded-[10px]`.
- **Fonts**: `--font-sans` (Geist), `--font-mono` (Geist Mono) → `font-sans`, `font-mono`.
- **Type scale**: the full Tailwind scale (`--text-xs` … `--text-9xl`, weights, tracking,
  leading) is re-declared as runtime CSS variables so it can be read at runtime.
- **Heading/section utilities**: `.heading-xl/lg/md/sm`, `.container-padding-x`,
  `.section-padding-y`, `.section-title-gap-*` — responsive classes defined in `@layer base`.
- **Spacing**: no custom scale; use Tailwind defaults on an 8px rhythm (`gap-2`, `p-4`).

### `src/next/theme.ts` is dead code — never use it

`src/next/theme.ts` exports a MUI-shaped `lightTheme`/`darkTheme` palette whose values
contradict `globals.css`. It has zero consumers. Never import, extend, or treat it as a token
source. Deleting it is planned future work.

## Component Inventory (`src/next/`, imported as `@semoss/ui/next`)

- **Buttons & actions**: `Button` (+`buttonVariants`), `ButtonGroup`, `Toggle`, `ToggleGroup`
- **Inputs & forms**: `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Select`, `Slider`,
  `Switch`, `Label`, `Calendar`, `FileDropzone`, `InputGroup`, `Field` (+ `FieldLabel`,
  `FieldError`, …)
- **Layout**: `Card`, `Separator`, `ScrollArea`, `Resizable*`, `Collapsible`, `Item`,
  `Sidebar` (+ `SidebarProvider`, `useSidebar`, …)
- **Typography**: `H1`, `H2`, `H3`, `H4`, `Lead`, `P`, `Large`, `Small`, `Muted`,
  `InlineCode`, `MultilineCode`, `List`, `Quote`
- **Feedback**: `Alert`, `toast` + `Toaster` (sonner), `Progress`, `Skeleton`, `Spinner`,
  `LoadingScreen`
- **Overlays**: `Dialog`, `Sheet`, `Drawer`, `Popover`, `HoverCard`, `Tooltip`,
  `DropdownMenu`, `ContextMenu`, `Command`
- **Data display**: `Table`, `TreeView`, `Badge` (+`badgeVariants`), `Avatar`, `Accordion`,
  `Code`, `Markdown`
- **Navigation**: `Breadcrumb`, `Pagination`, `Tabs`, `Stepper`
- **Theming**: `ThemeProvider`, `useTheme` (`"dark" | "light" | "system"`)
- **Utilities & hooks**: `cn`, `useCacheState`, `useDebouncedCallback`, `useDebouncedValue`,
  `useInfiniteScroll`, `useIsMobile`

### Typography map

There is **no** `<Typography variant="...">` component. Use the discrete components:

| Component | Element | Use for |
|-----------|---------|---------|
| `H1`–`H4` | `h1`–`h4` | Headings (bold/semibold, 4xl→xl) |
| `Lead` | `p` | Intro/subtitle text (muted, xl) |
| `P` | `p` | Body text |
| `Large` / `Small` | `div` / `p` | Emphasized / fine-print text |
| `Muted` | `span` | Secondary/hint text |
| `InlineCode` / `MultilineCode` | `code` / `pre` | Code snippets |
| `List` / `Quote` | `ul` / `blockquote` | Lists / block quotes |

### Import rules for consumers

```typescript
// The only sanctioned import path — components, hooks, and cn():
import { Button, H2, Muted, cn, toast } from "@semoss/ui/next";
```

```css
/* Once per app, at the top of its index.css: */
@import "@semoss/ui/globals.css";
```

- The bare `@semoss/ui` barrel currently re-exports `./next`, but **always import from
  `@semoss/ui/next`** — 100% of existing imports already do; keep it that way.
- The `@/*` alias (e.g. `@/lib/utils`) is **internal to this lib** — consumers must never
  use it.

## shadcn/ui Configuration

From `components.json`:
- **Style**: new-york
- **Base color**: zinc
- **CSS variables**: enabled
- **Icon library**: lucide-react

## Authoring Pattern

Every component in `src/next/` follows the same conventions — match them exactly when adding
or editing components:

```typescript
import { cn } from "@/lib/utils";               // internal alias, lib-only
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ...",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive ...",
                outline: "border bg-background hover:bg-accent ...",
                // secondary | ghost | link
            },
            size: { default: "h-9 px-4 py-2", sm: "...", lg: "...", icon: "size-9" },
        },
        defaultVariants: { variant: "default", size: "default" },
    },
);
```

- **CVA** for variants; variant names stay consistent across components
  (`default | destructive | outline | secondary | ghost | link`; sizes `default | sm | lg | icon`).
- **`data-slot="<name>"`** attribute on every root and sub-part (used as styling hooks, e.g.
  `has-data-[slot=card-action]:grid-cols-[1fr_auto]`).
- **Semantic token classes only** — never hex, never raw palette shades, never `text-[Npx]`.
- `asChild?: boolean` + Radix `Slot` for polymorphic components.
- `className` is always the **last** argument to `cn(...)` so callers can override.
- **Named exports only**; export the component together with its `xVariants`.
- Colocate related sub-components in the same file.

### The `cn()` Utility

```typescript
// Combines clsx + tailwind-merge — use for ALL className composition
<div className={cn("base-class", conditional && "conditional-class", className)} />
```

**Location**: `src/lib/utils.ts` (internal import `@/lib/utils`); re-exported to consumers
through `@semoss/ui/next`.

## Structure

```
src/
├── next/            # All components (shadcn/Radix style, flat kebab-case files)
│   └── index.ts     # Barrel — every component must be exported here
├── hooks/           # Shared React hooks
├── lib/             # Utilities (cn, etc.)
├── styles/          # globals.css — the design-token source of truth
└── index.ts         # Re-exports ./next
```

## Build System

- **Bundler**: Rollup
- **Output**: ES modules (`dist/index.mjs`), CSS (`dist/index.css` → `@semoss/ui/globals.css`)
- **Types**: TypeScript declarations (`dist/types/`)
- **Styles**: PostCSS with `@tailwindcss/postcss`

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode with Rollup |
| `pnpm build` | Production build (minified) |
| `pnpm build:dev` | Development build |

## Key Dependencies

- **Radix UI**: Accessible primitives (dialog, dropdown, select, etc.)
- **class-variance-authority**: Component variants
- **lucide-react**: Icon library
- **tailwind-merge** + **clsx**: `cn()` class merging
- **shiki**: Code syntax highlighting
- **Peer dependencies**: `react: 18.3.1`, `react-dom: 18.3.1` only (MUI/Emotion were fully
  removed from the repo — never reintroduce them)

## Agent Guardrails

### Do Not Modify

- **`dist/`** - Build output, regenerated on build
- **Peer dependency versions** - Must stay synchronized with consuming packages

### Be Cautious With

- **`src/next/index.ts` / `src/index.ts`** - Main exports, affect all consumers
- **`src/styles/globals.css`** - Token changes affect every app; adding a token requires
  light + dark values and an `@theme inline` mapping
- **`rollup.config.js`** - Build configuration
- **`components.json`** - shadcn CLI configuration

### When Adding Components

1. Add the component to `src/next/` (flat kebab-case file)
2. Follow the authoring pattern above (CVA + `data-slot` + Radix + tokens)
3. Add the export to `src/next/index.ts`
4. Use `cn()` for all className composition
5. Reuse existing variant/size names before inventing new ones

### Testing Components

```bash
pnpm build          # Verify build succeeds
```

Then test in a consuming package:
```bash
cd ../../packages/playground
pnpm dev
```
