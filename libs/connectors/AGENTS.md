# AGENTS.md - @semoss/connectors

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

Viewers that browse the signed-in user's Microsoft 365 and Google Workspace through the
`Microsoft*` and `Google*` reactors, in whatever insight `useInsight()` provides, plus the mail and
calendar tool views. Hosts render a viewer inside their own panel, page, or dialog.

## Boundaries

- Nothing it depends on may import it. Source-only, like `@semoss/shared`: no bundler, no `dist/`.
- Inside: provider, mail, and calendar code may import `core/` and `components/`; those two never
  import from them.
- No state library. Shared state uses `StoreState` ([state standard](../../docs/standards/react.md#state)).
  The listener sets in `mail/mail-compose-outcomes.ts` and `mail/use-mail-picture-preference.ts`
  predate it; migrate them when touched.
- **One mail and one calendar implementation serve both accounts**, picked by `provider` through a
  descriptor in `mail/mail-apps.ts` or `calendar/calendar-apps.ts`. A new mailbox or calendar is a
  descriptor, once its reactors answer in the shared shape. A new provider gets its own folder
  beside `microsoft/` and `google/`, built on `core/` and `components/`.

## What a host has to wire up

- **Stylesheet:** import `@semoss/connectors/globals.css` next to `@semoss/shared/globals.css`, or
  no viewer classes are generated.
- **Strings:** the `connectors` namespace must be in the host's i18n loader map.
- **Host contract:** every viewer takes `ConnectorViewerProps`; mail and calendar also take
  `provider`. `onSignIn` must open sign-in inside the click.
- **Tool views:** pass `MAIL_TOOL_VIEWS` and `CALENDAR_TOOL_VIEWS` to `@semoss/shared`'s
  `ToolViewProvider` as the `mail` and `calendar` libraries, and give each view a `ToolViewHost`.
- **Tests that render a drive** alias `monaco-editor`, like every host that renders a file panel.

## Invariants

- **Signed out is a state, not an error.** The backend spells it `LOGGIN_REQUIRED_ERROR`; it and
  HTTP 401 become a sign-in prompt. Google's 403 for a missing scope is its own kind (an
  administrator setting).
- **Omitting optional host APIs keeps the inline behavior Playground relies on.**
- **The Google reactors are thin.** Drive lists names only; only Google Docs (`GoogleDocsRead`) can
  be brought in. Never use `GoogleDriveDownload`: it writes to any server path.

## Validation

```bash
pnpm --filter @semoss/connectors test
pnpm check
pnpm --filter @semoss/playground type-check   # compiles this package from a consumer
```
