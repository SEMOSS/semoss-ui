# AGENTS.md - @semoss/i18n

This document provides context for AI coding assistants working with the SEMOSS internationalization library.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> owns general TypeScript, imports, and validation rules.

## Overview

`@semoss/i18n` is a shared internationalization library using **i18next** with React bindings. It supports multiple packages in the monorepo with a two-tier translation structure:
- **Tier 1: Core Shared** - Translations used across all packages
- **Tier 2: Package-Specific** - Translations unique to each package

### Lazy loading architecture (IMPORTANT)

Locale JSON uses lazy loaders rather than static imports into the app's main chunk.
Verify consumer build output when changing language or namespace loading; lazy loading
does not guarantee a fixed initial bundle size or request count.

How it works:
- Package loader maps live in `resources/client.ts`, `resources/playground.ts`,
  `resources/terminal.ts`, and `resources/auditlog.ts`.
- `builder.ts` registers a tiny i18next **backend** that calls those loaders on demand — at init for the active language, and again on `i18n.changeLanguage()`.
- Keep consumer locale chunk grouping compatible with these lazy imports; confirm
  request behavior in the affected app rather than assuming one request per language.
- Apps `await i18nBuilder.ready` in `main.tsx` before the first render so the active language is present (no flash of raw keys).
- Namespaces not preloaded at init (e.g. the client's embedded terminal) are fetched at runtime via `preloadNamespaces([...])`.

There is **no** `core.ts` / `shared.ts` aggregate and **no** `coreResources`/`sharedResources` export. Core/shared namespaces are just entries in each app's loader map.

## Supported Languages

- **English** (`en`) - Default
- **Spanish** (`es`)
- **French** (`fr`)
- **Hindi** (`hi`)
- **Arabic** (`ar`)
- **Japanese** (`ja`)
- **Dutch** (`nl`)

All translation changes must be reflected across all languages (see `LANGUAGES` in `constants.ts`).

## Directory Structure

```
libs/i18n/
├── README.md                          # Documentation (CRITICAL)
└── src/
    ├── builder.ts                     # I18nBuilder + dynamic-import i18next backend
    ├── preload.ts                     # preloadNamespaces() for on-demand namespaces
    ├── constants.ts                   # Language definitions (LANGUAGES array)
    ├── index.ts                       # Main exports
    └── resources/
        ├── types.ts                   # LazyResources interface
        ├── playground.ts              # Playground lazy loader map
        ├── terminal.ts                # Terminal lazy loader map
        ├── client.ts                  # Client lazy loader map
        ├── auditlog.ts                # Audit log lazy loader map
        └── locales/
            ├── en/                    # English translations
            │   ├── common.json        # Core: buttons, labels, actions
            │   ├── validation.json    # Core: form validations
            │   ├── notifications.json # Core: notification templates
            │   └── playground/        # Playground-specific
            │       ├── chat.json
            │       ├── room.json
            │       ├── sidebar.json
            │       ├── knowledge.json
            │       ├── workspace.json
            │       └── mcp.json
            ├── es/                    # Spanish (same structure)
            ├── fr/                    # French (same structure)
            ├── hi/                    # Hindi (same structure)
            ├── ar/                    # Arabic (same structure)
            ├── ja/                    # Japanese (same structure)
            └── nl/                    # Dutch (same structure)
```

## Key Concepts

### Package-Specific Resources

Each package consumes translations differently:

- **Playground**: `resources/playground.ts`
  - Includes: core + playground-specific namespaces

- **Client**: `resources/client.ts`, with existing `locales/*/client/` namespaces
- **Terminal**: `resources/terminal.ts`, with `locales/*/terminal/` namespaces
- **Audit log**: `resources/auditlog.ts`

### Translation Namespaces

Translations are organized into namespaces (JSON files):

```typescript
// Core shared (all packages)
t('common:buttons.save')           // "Save"
t('validation:required')           // "This field is required"
t('notifications:success')         // "Operation completed"

// Playground-specific
t('chat:messages.placeholder')     // "Type a message..."
t('room:welcome')                  // "Welcome"
t('sidebar:search')               // "Search"
```

### Resource Export Pattern

Each package exports a lazy `LazyResources` config — a `ns` list (preloaded at init) and a `load` map of `namespace → (language) => import(...)`:

```typescript
// playground.ts
export const playgroundResources: LazyResources = {
  ns: ["common", "notifications", "validation", "chat", "room", ...],
  load: {
    common: (l) => import(`./locales/${l}/common.json`),
    chat: (l) => import(`./locales/${l}/playground/chat.json`),
    room: (l) => import(`./locales/${l}/playground/room.json`),
    // ...
  },
};
```

To add a namespace: add one `load` entry (and, if it should render before user interaction, add its name to `ns`). The template-literal `import()` makes the bundler emit it lazily; do **not** add a static top-level import.

## Agent Workflow for Translation Updates

### **CRITICAL: Follow This Workflow for ALL Translation Changes**

When modifying or adding translations, **ALWAYS** follow these steps in order:

#### 1. Check Existing Translations First

Before adding translations, check the relevant namespace for reusable keys. Remove a key
only within the requested scope and after checking all consumers, including dynamic keys;
a text search alone does not prove a key is unused:

```bash
# Example: Check if 'chat:oldKey' is still used
pnpm --filter @semoss/playground exec grep -r "t('chat:oldKey')" src/
pnpm --filter @semoss/playground exec grep -r 't("chat:oldKey")' src/
```

**Remove confirmed unused keys across ALL languages** (en, es, fr, hi, ar, ja, nl).

#### 2. Add New Translations

Add the new translation key to all seven language files:

```json
// locales/en/playground/chat.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "Feature description"
  }
}

// locales/es/playground/chat.json
{
  "newFeature": {
    "title": "Nueva Función",
    "description": "Descripción de la función"
  }
}

// locales/fr/playground/chat.json
{
  "newFeature": {
    "title": "Nouvelle Fonction",
    "description": "Description de la fonction"
  }
}
```

#### 3. Verify Across the Filesystem

**CRITICAL**: After making translation changes, scan the entire codebase to ensure:

- No broken translation keys (old keys still referenced in code)
- No missing translations (new keys used but not defined)
- All seven languages are synchronized

```bash
# Verify consumer compilation (not translation-key completeness)
pnpm --filter @semoss/playground build:dev

# Check for translation errors in browser console during testing
pnpm --filter @semoss/playground dev
```

#### 4. Check for Errors

Run the build to catch any import errors or missing files:

```bash
# Must pass without errors
pnpm --filter @semoss/playground build:dev
```

If you see errors like `Cannot find module`, verify:
- File paths in package config files (e.g., `playground.ts`)
- All language variants exist (en, es, fr, hi, ar, ja, nl)
- JSON syntax is valid (no trailing commas, proper quotes)

#### 5. Update Documentation

**CRITICAL**: If you modified the structure or added/removed namespaces, update `README.md`:

```bash
# After changes, verify README.md reflects:
# - Current namespace list
# - Directory structure
# - Usage examples
# - Any new patterns or conventions
```

The `README.md` is the source of truth for developers. Keep it accurate.

### Efficiency Tips

- **Batch changes by namespace**: If updating multiple keys in `chat.json`, do all changes at once
- **Use search tools**: Grep/search across the codebase before removing translations
- **Verify builds incrementally**: Don't wait until the end to check if imports work
- **Update all languages together**: Don't leave Spanish/French translations as TODOs

## Agent Guardrails

### Do Not Modify

- **Translation values in production** - Only change if explicitly requested
- **Language codes** - Preserve `en`, `es`, `fr`, `hi`, `ar`, `ja`, `nl` unless language support is explicitly in scope
- **`builder.ts` initialization logic** - Core i18next setup
- **`constants.ts`** - Language definitions (unless adding new languages)

### Be Cautious With

- **`builder.ts`** - The dynamic-import backend + i18next setup affects all packages
- **`resources/*.ts`** - Lazy loader maps and resource types for consuming packages
- **`index.ts`** - Main export file, affects all consumers
- **Consumer `vite.config.ts` files** - Locale chunk grouping belongs to consuming apps
- **File/directory renames** - Must update the `load` paths in the package loader maps

### When Adding Translations

1. **Determine the tier**:
   - Used in multiple packages? → Add to `locales/*/common.json` (core)
   - Playground-specific? → Add to `locales/*/playground/*.json`
  - Client-specific? → Use `locales/*/client/*.json` and update `client.ts`

2. **Add to all languages**:
   - `locales/en/...` - English (original)
   - `locales/es/...` - Spanish translation
   - `locales/fr/...` - French translation
   - `locales/hi/...` - Hindi translation
   - `locales/ar/...` - Arabic translation
   - `locales/ja/...` - Japanese translation
  - `locales/nl/...` - Dutch translation

3. **Update the config file**:
   - Add a `load` entry (and `ns` entry if preloaded) to the relevant `playground.ts` / `terminal.ts` / `client.ts`. No static imports — use the `(l) => import(\`./locales/${l}/.../ns.json\`)` form.

4. **Verify the build**:
   ```bash
   pnpm --filter @semoss/playground build:dev
   ```

### When Removing Translations

1. **Search for usage** across the consuming package:
   ```bash
   pnpm --filter @semoss/playground exec grep -r "translationKey" src/
   ```

2. **Remove from all seven languages**:
   - `locales/en/...`
   - `locales/es/...`
   - `locales/fr/...`
   - `locales/hi/...`
   - `locales/ar/...`
   - `locales/ja/...`
  - `locales/nl/...`

3. **If removing an entire namespace** (e.g., deleting `sidebar.json`):
   - Remove files from all language directories
  - Remove lazy `load` entries and `ns` entries from every consuming resource map
   - Verify build succeeds

### When Adding a New Package

To add translations for a new package, follow the existing client integration:

1. **Create directory structure**:
   ```bash
  # From libs/i18n/src/resources; replace new-package with the new package name
  mkdir -p locales/{en,es,fr,hi,ar,ja,nl}/new-package
   ```

2. **Add translation files**:
  - `locales/{en,es,fr,hi,ar,ja,nl}/new-package/feature.json` (one per language)

3. **Add the package loader map** using `client.ts` as the pattern (adapt the names/paths):
   ```typescript
   export const clientResources: LazyResources = {
     ns: ["common", "notifications", "validation", "feature"],
     load: {
       common: (l) => import(`./locales/${l}/common.json`),
       // ...
       feature: (l) => import(`./locales/${l}/client/feature.json`),
     },
   };
   ```

4. **Document in README.md**:
   - Update directory structure
   - Add usage examples for the new package
   - List the new namespaces

5. **Test the new package**:
   ```bash
   pnpm --filter @semoss/client build
   ```

## Testing Changes

### Build Verification

```bash
# Test playground package (current consumer)
pnpm --filter @semoss/playground build:dev

# Test client package
pnpm --filter @semoss/client build:dev
```

### Runtime Verification

```bash
# Start the playground dev server
pnpm --filter @semoss/playground dev

# In browser, check:
# 1. No console errors about missing translations
# 2. Text displays correctly in UI
# 3. Language switcher works (if implemented)
```

### Translation Key Validation

Compare key coverage across all seven locale files and check the affected runtime
namespaces. A successful build does not prove translation completeness. Text searches
help find literal usage but also inspect dynamic keys and namespace prefixes:

```bash
# Find translation usage in code
pnpm --filter @semoss/playground exec grep -r "t('" src/ | grep -o "t('[^']*')" | sort -u

# Compare against defined keys in JSON files
```

## Common Patterns

### Adding a New Translation Key

```typescript
// 1. Add to JSON files (all languages)
// locales/en/playground/chat.json
{
  "newKey": "New value"
}

// 2. Use in component
import { useTranslation } from "@semoss/i18n";

function Component() {
  const { t } = useTranslation();
  return <div>{t('chat:newKey')}</div>;
}

// 3. Verify build
// pnpm --filter @semoss/playground build:dev
```

### Moving a Translation to Core

If a translation is needed by multiple packages:

```typescript
// 1. Move from package namespace to core
// FROM: locales/en/playground/chat.json
// TO: locales/en/common.json

// 2. Update all references in code
// FROM: t('chat:commonKey')
// TO: t('common:commonKey')

// 3. Remove from playground files (all languages)
// 4. Add to common files (all languages)
// 5. `common` is already in every app's loader map + `ns`, so no config change needed
```

## README.md Maintenance

**The README.md file is a critical documentation resource.** Always update it when:

- Adding/removing namespaces
- Changing directory structure
- Adding a new package configuration
- Modifying the tier system
- Adding new patterns or conventions

**Check the README after every structural change** to ensure developers have accurate information.

## Summary of Key Rules

1. ✅ **Reuse existing keys; remove only confirmed unused keys within scope**
2. ✅ **Always update all seven languages** (en, es, fr, hi, ar, ja, nl)
3. ✅ **Verify across the filesystem** for broken/missing keys
4. ✅ **Check that builds pass** after translation changes
5. ✅ **Update README.md** for structural changes
6. ✅ **Batch changes efficiently** by namespace
7. ❌ **Never leave translations in one language only**
8. ❌ **Never skip build verification**
9. ❌ **Never forget to update documentation**
