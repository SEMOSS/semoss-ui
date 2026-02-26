# AGENTS.md - @semoss/i18n

This document provides context for AI coding assistants working with the SEMOSS internationalization library.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for monorepo conventions, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/i18n` is a shared internationalization library using **i18next** with React bindings. It supports multiple packages in the monorepo with a two-tier translation structure:
- **Tier 1: Core Shared** - Translations used across all packages
- **Tier 2: Package-Specific** - Translations unique to each package

## Supported Languages

- **English** (`en`) - Default
- **Spanish** (`es`)
- **French** (`fr`)
- **Hindi** (`hi`)
- **Arabic** (`ar`)
- **Japanese** (`ja`)

All translation changes must be reflected across all six languages.

## Directory Structure

```
libs/i18n/
├── README.md                          # Documentation (CRITICAL)
└── src/
    ├── builder.ts                     # I18nBuilder class (i18next configuration)
    ├── constants.ts                   # Language definitions (LANGUAGES array)
    ├── index.ts                       # Main exports
    └── resources/
        ├── core.ts                    # Core shared resources
        ├── playground.ts              # Playground package resources
        ├── client.ts                  # Client package resources (template)
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
            └── ja/                    # Japanese (same structure)
```

## Key Concepts

### Package-Specific Resources

Each package consumes translations differently:

- **Playground**: Uses `playgroundResources` (configured in `builder.ts`)
  - Includes: core + playground-specific namespaces

- **Client**: Will use `clientResources` (template ready)
  - Includes: core + client-specific namespaces (to be added)

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

Each package has its own resource export:

```typescript
// playground.ts
export const playgroundResources = {
  en: { ...coreResources.en, chat: chatEN, room: roomEN, ... },
  es: { ...coreResources.es, chat: chatES, room: roomES, ... },
  fr: { ...coreResources.fr, chat: chatFR, room: roomFR, ... },
};
```

## Agent Workflow for Translation Updates

### **CRITICAL: Follow This Workflow for ALL Translation Changes**

When modifying or adding translations, **ALWAYS** follow these steps in order:

#### 1. Remove Unused Translations First

Before adding new translations, scan the relevant namespace and remove any translations that are no longer used:

```bash
# Example: Check if 'chat:oldKey' is still used
pnpm --filter @semoss/playground exec grep -r "t('chat:oldKey')" src/
pnpm --filter @semoss/playground exec grep -r 't("chat:oldKey")' src/
```

**Remove unused keys across ALL languages** (en, es, fr, hi, ar, ja) to keep files synchronized.

#### 2. Add New Translations

Add the new translation key to all six language files:

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
- All six languages are synchronized

```bash
# Verify all translation keys are defined
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
- All language variants exist (en, es, fr, hi, ar, ja)
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
- **Language codes** - Must remain `en`, `es`, `fr`, `hi`, `ar`, `ja`
- **`builder.ts` initialization logic** - Core i18next setup
- **`constants.ts`** - Language definitions (unless adding new languages)

### Be Cautious With

- **`core.ts`** - Changes affect all packages
- **`playground.ts` / `client.ts`** - Changes affect specific packages
- **`index.ts`** - Main export file, affects all consumers
- **File/directory renames** - Must update imports in package config files

### When Adding Translations

1. **Determine the tier**:
   - Used in multiple packages? → Add to `locales/*/common.json` (core)
   - Playground-specific? → Add to `locales/*/playground/*.json`
   - Client-specific? → Create `locales/*/client/*.json` and update `client.ts`

2. **Add to all languages**:
   - `locales/en/...` - English (original)
   - `locales/es/...` - Spanish translation
   - `locales/fr/...` - French translation
   - `locales/hi/...` - Hindi translation
   - `locales/ar/...` - Arabic translation
   - `locales/ja/...` - Japanese translation

3. **Update the config file**:
   - Core translations: No changes needed (auto-imported)
   - Package translations: Add import and resource entry to `playground.ts` or `client.ts`

4. **Verify the build**:
   ```bash
   pnpm --filter @semoss/playground build:dev
   ```

### When Removing Translations

1. **Search for usage** across the consuming package:
   ```bash
   pnpm --filter @semoss/playground exec grep -r "translationKey" src/
   ```

2. **Remove from all six languages**:
   - `locales/en/...`
   - `locales/es/...`
   - `locales/fr/...`
   - `locales/hi/...`
   - `locales/ar/...`
   - `locales/ja/...`

3. **If removing an entire namespace** (e.g., deleting `sidebar.json`):
   - Remove files from all language directories
   - Remove imports from package config file (`playground.ts` or `client.ts`)
   - Remove from resource definitions
   - Verify build succeeds

### When Adding a New Package

To add translations for a new package (e.g., `@semoss/client`):

1. **Create directory structure**:
   ```bash
   mkdir -p locales/{en,es,fr,hi,ar,ja}/client
   ```

2. **Add translation files**:
   - `locales/en/client/feature.json`
   - `locales/es/client/feature.json`
   - `locales/fr/client/feature.json`
   - `locales/hi/client/feature.json`
   - `locales/ar/client/feature.json`
   - `locales/ja/client/feature.json`

3. **Update `client.ts`**:
   ```typescript
   import featureEN from "./locales/en/client/feature.json";
   import featureES from "./locales/es/client/feature.json";
   import featureFR from "./locales/fr/client/feature.json";
   import featureHI from "./locales/hi/client/feature.json";
   import featureAR from "./locales/ar/client/feature.json";
   import featureJA from "./locales/ja/client/feature.json";

   export const clientResources = {
     en: { ...coreResources.en, feature: featureEN },
     es: { ...coreResources.es, feature: featureES },
     fr: { ...coreResources.fr, feature: featureFR },
     hi: { ...coreResources.hi, feature: featureHI },
     ar: { ...coreResources.ar, feature: featureAR },
     ja: { ...coreResources.ja, feature: featureJA },
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

# Test client package (when implemented)
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

Check for missing or unused translation keys:

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
// 5. No config file changes needed (core auto-imports)
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

1. ✅ **Remove unused translations BEFORE adding new ones**
2. ✅ **Always update all six languages** (en, es, fr, hi, ar, ja)
3. ✅ **Verify across the filesystem** for broken/missing keys
4. ✅ **Check that builds pass** after translation changes
5. ✅ **Update README.md** for structural changes
6. ✅ **Batch changes efficiently** by namespace
7. ❌ **Never leave translations in one language only**
8. ❌ **Never skip build verification**
9. ❌ **Never forget to update documentation**
