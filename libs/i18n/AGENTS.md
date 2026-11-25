# AGENTS.md - @semoss/i18n

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

Shared internationalization for every SEMOSS app, built on i18next and react-i18next. It holds
the locale JSON for all packages and one lazy loader map per app. How loading works is in
[docs/architecture/i18n.md](../../docs/architecture/i18n.md); keep [README.md](./README.md) in sync
with structure changes.

## Boundaries

- **Must not import:** any `@semoss/*` package, `@semoss/utility` included. Language state
  belongs to i18next, so do not add a store or state library here.
- **Public entry point:** `src/index.ts` only.

## Invariants

- **Every key lives in every language** in `LANGUAGES`. Never leave a key in English only or mark
  one as a TODO.
- **Renaming a locale file or folder** means updating the `load` paths in every loader map that
  references it.
- **A build does not prove key completeness.** Compare keys across locales and inspect dynamic
  keys and namespace prefixes, not just literal `t('ns:key')` calls.
- **Do not change** existing translation values unless asked, the language codes unless
  language support is in scope, or the init logic in `builder.ts`.
- **Be cautious with** `builder.ts`, `resources/*.ts` and `index.ts` (every app depends on
  them), and with consumer `vite.config.ts` locale chunk grouping, which the apps own.

## Validation

Source-only, with no scripts of its own. Verify through the apps that consume it:

```bash
pnpm --filter @semoss/playground build:dev
pnpm --filter @semoss/client build:dev
pnpm --filter @semoss/playground dev   # check the browser console for missing keys
```

Then confirm switching language loads the new strings.

## Reference

- Adding, changing, moving or removing keys, and adding a package's namespaces:
  [skills/add-translations.skill.md](../../skills/add-translations.skill.md)
- Title Case and sentence case for UI text: [ui.md: UI Text](../../docs/standards/ui.md#ui-text)
