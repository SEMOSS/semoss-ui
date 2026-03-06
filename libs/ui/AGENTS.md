# AGENTS.md - @semoss/ui Component Library

This document provides context for AI coding assistants working with the SEMOSS UI component library.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for monorepo conventions, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/ui` is a React component library using a hybrid approach:
- **shadcn/ui** + **Radix UI** for new accessible components
- **Tailwind CSS v4** for styling

## Build System

- **Bundler**: Rollup
- **Output**: ES modules (`dist/index.mjs`)
- **Types**: TypeScript declarations (`dist/types/`)
- **Styles**: PostCSS with Tailwind

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode with Rollup |
| `pnpm build` | Production build (minified) |
| `pnpm build:dev` | Development build |

## Component Architecture

### shadcn/ui Configuration

From `components.json`:
- **Style**: new-york
- **Base color**: zinc
- **CSS variables**: enabled
- **Icon library**: lucide-react

### Preferred Component Location: `src/next/`

**New components should be added to `src/next/`**, not `src/components/`. The `src/next/` directory contains modern shadcn/ui-style components that are the preferred pattern going forward.

When consuming components, prefer importing from `src/next/` when available:
```typescript
// Preferred - use next/ components
import { Button } from "@semoss/ui/next";

// Legacy - only if not available in next/
import { LegacyComponent } from "@semoss/ui";
```

### The `cn()` Utility

All components use the `cn()` utility for className merging:

```typescript
import { cn } from "@/lib/utils";

// Combines clsx + tailwind-merge
<div className={cn("base-class", conditional && "conditional-class", className)} />
```

**Location**: `src/lib/utils.ts`

### Component Structure

```
src/
├── components/      # Main component exports (60+ components)
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.stories.tsx
│   └── ...
├── next/            # shadcn/ui-style components
├── hooks/           # Shared React hooks
├── lib/             # Utilities (cn, etc.)
├── styles/          # Global CSS, Tailwind config
├── theme.ts         # Theme configuration
└── index.ts         # Main exports
```

## Exported Components (60+)

The library exports components including:
- **Layout**: Box, Container, Grid, Stack, Divider
- **Inputs**: Button, TextField, TextArea, Select, Checkbox, Radio, Switch, Slider
- **Display**: Avatar, Badge, Chip, Typography, Icon, Code, Markdown
- **Feedback**: Alert, CircularProgress, LinearProgress, Skeleton, Snackbar
- **Surfaces**: Accordion, Card, Paper, Modal, Drawer, Popover
- **Navigation**: Breadcrumbs, Link, Menu, Pagination, Stepper, Tabs
- **Data**: Table, TreeView, List
- **Utility**: Backdrop, Collapse, Tooltip, ThemeProvider

## Peer Dependencies

Components require these peer dependencies in consuming packages:

```json
{
  "@emotion/react": "11.11.1",
  "@emotion/styled": "11.11.0",
  "@mui/icons-material": "6.0.0",
  "@mui/material": "6.0.0",
  "react": "18.3.1",
  "react-dom": "18.3.1"
}
```

## Key Dependencies

- **Radix UI**: Accessible primitives (dialog, dropdown, select, etc.)
- **class-variance-authority**: Component variants
- **lucide-react**: Icon library
- **tailwind-merge**: Tailwind class conflict resolution
- **xterm**: Terminal component
- **shiki**: Code syntax highlighting

## Agent Guardrails

### Do Not Modify

- **`dist/`** - Build output, regenerated on build
- **Peer dependency versions** - Must stay synchronized with consuming packages

### Be Cautious With

- **`src/index.ts`** - Main exports, affects all consumers
- **`rollup.config.js`** - Build configuration
- **`components.json`** - shadcn CLI configuration

### When Adding Components

1. **Add new components to `src/next/`** (not `src/components/`)
2. Follow the shadcn/ui component pattern
3. Export from component's `index.ts`
4. Add export to `src/next/index.ts`
5. Use `cn()` for all className composition
6. Follow existing patterns for props interfaces

> **Note**: `src/components/` contains legacy MUI-based components. New development should use `src/next/` with Radix primitives.

### Testing Components

```bash
pnpm build          # Verify build succeeds
```

Then test in a consuming package:
```bash
cd ../../packages/playground
pnpm dev
```
