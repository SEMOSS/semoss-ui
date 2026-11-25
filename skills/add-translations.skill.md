---
name: add-translations
description: "Use when adding, changing, moving or removing UI text keys in @semoss/i18n, or giving a new package its own translation namespaces."
---
# Add Translations

## When to Use

- A component needs new user-facing text, or existing text changes.
- A key is no longer used, or a key is needed by more than one package.
- A new package or feature needs its own namespace.

## Read First

- [libs/i18n/AGENTS.md](../libs/i18n/AGENTS.md): boundaries and invariants.
- [docs/architecture/i18n.md](../docs/architecture/i18n.md): tiers, loader maps, lazy loading.
- [docs/standards/ui.md#ui-text](../docs/standards/ui.md#ui-text): Title Case and sentence case.

## Steps

1. **Check existing keys first.** Reuse a key in the relevant namespace before adding one.
   Before removing a key, check every consumer, including dynamic keys and namespace prefixes;
   a text search alone does not prove a key is unused:
   ```bash
   pnpm --filter @semoss/playground exec grep -r "t('chat:oldKey')" src/
   pnpm --filter @semoss/playground exec grep -r 't("chat:oldKey")' src/
   ```
2. **Pick the tier.** Used by several packages → core (`locales/*/common.json`) or
   `locales/*/shared/`. Playground only → `locales/*/playground/*.json`. Client only →
   `locales/*/client/*.json` and `client.ts`.
3. **Add or change the key in every language** in `LANGUAGES`
   ([constants.ts](../libs/i18n/src/constants.ts)), in one batch per namespace:
   ```json
   // locales/en/playground/chat.json
   { "newFeature": { "title": "New Feature", "description": "Feature description" } }

   // locales/es/playground/chat.json
   { "newFeature": { "title": "Nueva Función", "description": "Descripción de la función" } }

   // locales/fr/playground/chat.json
   { "newFeature": { "title": "Nouvelle Fonction", "description": "Description de la fonction" } }
   ```
4. **Use it in code:**
   ```typescript
   import { useTranslation } from "@semoss/i18n";

   function Component() {
     const { t } = useTranslation();
     return <div>{t('chat:newKey')}</div>;
   }
   ```
5. **Register a new namespace file.** Add a `load` entry to every loader map in
   `libs/i18n/src/resources/` whose app reads it, and an `ns` entry if it must render before user
   interaction. Copy an existing entry: a dynamic `import()`, never a static import.
6. **Remove a confirmed unused key** from every language, within the requested scope only.
   To remove a whole namespace, delete its file in every language and remove its `load` and
   `ns` entries from every loader map.
7. **Move a key to core** when several packages need it:
   1. Move it from the package file (e.g. `locales/en/playground/chat.json`) to
      `locales/en/common.json`, in every language.
   2. Update references: `t('chat:commonKey')` → `t('common:commonKey')`.
   3. No loader change is needed; `common` is in every map's `load` and `ns`.
8. **Add a new package's namespaces:** a `locales/<lang>/<package>/` folder for every language,
   then a loader map modeled on [client.ts](../libs/i18n/src/resources/client.ts), exported from
   `src/index.ts`.
9. **Update `libs/i18n/README.md`** when namespaces, the directory structure, a package
   configuration or the tier system change: the namespace list, the tree, usage examples, and
   any new convention.

## Checklist

- [ ] Existing keys checked before adding; removals checked against dynamic keys too.
- [ ] Every language updated together; none left as English or TODO.
- [ ] New namespace files have lazy `load` entries (and `ns` if preloaded) in every map that uses them.
- [ ] Labels are Title Case and sentences are sentence case.
- [ ] README updated for structural changes.

## Verify

```bash
pnpm --filter @semoss/playground build:dev   # or the affected app
pnpm --filter @semoss/client build:dev
pnpm --filter @semoss/playground dev         # browser console: no missing keys
```

A `Cannot find module` error means a wrong `load` path, a missing language file, or invalid
JSON (trailing comma, wrong quotes). A passing build does not prove completeness: compare key
coverage across the locale files, for example by listing literal usage with
`pnpm --filter @semoss/playground exec grep -r "t('" src/ | grep -o "t('[^']*')" | sort -u`
and checking it against the JSON. In the running app, switch language and confirm the text.
