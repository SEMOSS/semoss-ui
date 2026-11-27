# `@semoss/i18n`

Shared translations and i18next integration for SEMOSS applications. The package exports
`I18nBuilder`, React bindings, language constants, namespace preloading, and one lazy resource map
for each supported app family.

## Structure

```text
libs/i18n/src/
├── builder.ts
├── constants.ts
├── index.ts
├── preload.ts
└── resources/
    ├── types.ts
    ├── client.ts
    ├── playground.ts
    ├── terminal.ts
    ├── auditlog.ts
    └── locales/<language>/
        ├── common.json
        ├── validation.json
        ├── notifications.json
        ├── shared/
        ├── client/
        ├── playground/
        ├── terminal/
        └── connectors/
```

The core namespaces (`common`, `validation`, and `notifications`) are available to every app.
Package-owned namespaces live under their owner directory; `shared/` contains namespaces used by
more than one app. The supported languages are `en`, `es`, `fr`, `nl`, `ar`, `hi`, and `ja`;
English is the fallback and Arabic is right-to-left.

## Initialize an app

Pass the app's resource map to `I18nBuilder`. Wait for `ready` before the first render, and provide
the instance through `I18nextProvider`:

```tsx
import { I18nBuilder, I18nextProvider, clientResources } from "@semoss/i18n";

const builder = new I18nBuilder(clientResources, { lockToEnglish: true });
export const i18nReady = builder.ready;

export function App() {
    return (
        <I18nextProvider i18n={builder.i18n}>
            <Application />
        </I18nextProvider>
    );
}
```

Await `i18nReady` in the app entry point before mounting `App`. The client uses
`lockToEnglish: true`; other apps detect the saved language or browser language.

Use the package's React binding to translate text:

```tsx
import { useTranslation } from "@semoss/i18n";

export function SaveButtonLabel() {
    const { t } = useTranslation();
    return <span>{t("common:buttons.save")}</span>;
}
```

Pass a namespace to `useTranslation` when appropriate, or use the `namespace:key` form. Add
user-facing strings to locale JSON rather than hard-coding them in components.

## Changing translations

Follow the [add-translations skill](../../skills/add-translations.skill.md) for adding, updating,
moving, or removing keys and namespaces. The [i18n architecture guide](../../docs/architecture/i18n.md)
covers resource maps and loading behavior. Package boundaries, invariants, and verification
guidance are in [AGENTS.md](./AGENTS.md).
