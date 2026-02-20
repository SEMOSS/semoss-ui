# @semoss/i18n

Internationalization library for the SEMOSS monorepo using i18next.

## Structure

The translations are organized in a two-tier structure to support multiple packages in the monorepo:

```
libs/i18n/src/
├── locales/
│   ├── en/                    # English translations
│   │   ├── common.json        # Tier 1: Core shared (buttons, labels, actions)
│   │   ├── validation.json    # Tier 1: Core shared (form validations)
│   │   ├── notifications.json # Tier 1: Core shared (notification templates)
│   │   └── playground/        # Tier 2: Playground-specific
│   │       ├── chat.json
│   │       ├── room.json
│   │       ├── sidebar.json
│   │       ├── knowledge.json
│   │       ├── workspace.json
│   │       └── mcp.json
│   ├── es/                    # Spanish translations (same structure)
│   ├── fr/                    # French translations (same structure)
│   ├── hi/                    # Hindi translations (same structure)
│   ├── ar/                    # Arabic translations (same structure)
│   └── ja/                    # Japanese translations (same structure)
├── core.ts                    # Core shared resources
├── playground.ts              # Playground package resources
├── client.ts                  # Client package resources (placeholder)
└── config.ts                  # i18next configuration (uses playground by default)
```

## Two-Tier System

### Tier 1: Core Shared
Translations used across **all** packages:
- `common.json` - Generic buttons, labels, placeholders, actions
- `validation.json` - Form validation messages
- `notifications.json` - Notification templates

### Tier 2: Package-Specific
Translations specific to individual packages:
- `playground/` - Playground app translations (chat, room, sidebar, knowledge, workspace, mcp)
- Future: `client/` - Client app translations (will be added when needed)

## Usage

### In Playground Package

The default i18next configuration uses playground resources:

```typescript
import { i18n, useTranslation } from "@semoss/i18n";

function MyComponent() {
    const { t } = useTranslation();

    // Core shared translations
    t('common:buttons.save')           // "Save"
    t('validation:required')            // Validation message

    // Playground-specific
    t('chat:messages.placeholder')      // "Type a message..."
    t('room:welcome')                   // "Welcome"
    t('sidebar:search')                 // "Search"
}
```

### In Client Package

Create a custom i18next instance using client resources:

```typescript
// packages/client/src/i18n/config.ts
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { clientResources } from "@semoss/i18n";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: clientResources,
        fallbackLng: "en",
        defaultNS: "common",
        // ... other config
    });

export default i18n;
```

Then use it in components:

```typescript
import { useTranslation } from "react-i18next";

function ClientComponent() {
    const { t } = useTranslation();

    // Core shared translations
    t('common:buttons.save')           // "Save"

    // Client-specific (add namespaces as needed)
    t('dashboard:welcome')              // "Welcome to your dashboard"
}
```

## Adding New Translations

### Adding a Core Shared Translation

1. Add to `locales/en/common.json` (or validation/notifications)
2. Add to `locales/es/common.json`
3. Add to `locales/fr/common.json`
4. No config changes needed - automatically available to all packages

### Adding a Package-Specific Translation

1. Create/update file in appropriate package folder (e.g., `locales/en/playground/sidebar.json`)
2. Add the same for other languages
3. Import and add to the package config file (e.g., `playground.ts`)

Example:

```typescript
// libs/i18n/src/playground.ts
import sidebarEN from "./locales/en/playground/sidebar.json";
import sidebarES from "./locales/es/playground/sidebar.json";
import sidebarFR from "./locales/fr/playground/sidebar.json";

export const playgroundResources = {
    en: {
        ...coreResources.en,
        sidebar: sidebarEN,  // Add here
        // ... other namespaces
    },
    // ... repeat for es and fr
};
```

## Supported Languages

- English (`en`) - Default
- Spanish (`es`)
- French (`fr`)
- Hindi (`hi`)
- Arabic (`ar`)
- Japanese (`ja`)

## Type Safety

The library exports TypeScript types for translation resources. Import from `@semoss/i18n` to get type definitions for your translation keys.
