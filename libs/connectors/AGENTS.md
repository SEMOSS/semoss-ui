# AGENTS.md - @semoss/connectors

This document provides context for AI coding assistants working with the SEMOSS connector
viewers library.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> owns general implementation, naming, imports, and validation rules.

## Overview

`@semoss/connectors` holds the viewers that browse the signed in user's Microsoft 365 and Google
Workspace through the `Microsoft*` and `Google*` reactors, in whatever insight `useInsight()`
provides: `OneDriveViewer`, `OutlookMailViewer`, `OutlookCalendarViewer`, `TeamsChannelViewer`,
`TeamsFilesViewer`, `TeamsChatViewer`, `GoogleDriveViewer`, `GmailViewer`,
`GoogleCalendarViewer`, and `GoogleDocsViewer`. Hosts render a viewer inside their own panel or
dialog.

It sits above `@semoss/shared`: it depends on `@semoss/i18n`, `@semoss/sdk`, `@semoss/shared`,
and `@semoss/ui`, and nothing in those libraries depends on it.

## Structure

| Folder | Purpose |
|--------|---------|
| `core/` | What every provider shares: the host contract (`connector.types.ts`), running a reactor (`connector-pixel.ts`, `reactor-call.ts`), saving into the insight (`connector-files.ts`, `use-connector-saver.ts`), formatting, the text to Markdown conversion (`connector-rich-text.ts`), the helpers the saved files are written with (`connector-markdown.ts`), and the list and focus hooks |
| `components/` | The building blocks every viewer is made of: header, list, rows, detail view, status, text body, actions, and the file explorer the drives browse in |
| `microsoft/` | Microsoft 365: its reactor output types, parsers, pixels, and saved files, with a folder per app (`onedrive/`, `outlook/`, `teams/`) |
| `google/` | Google Workspace: the same, with a folder per app (`gmail/`, `calendar/`, `docs/`, `drive/`) |
| `styles/globals.css` | Tailwind source discovery for the host's stylesheet |
| `index.ts` | The public entry point: the viewers, their props, the host contract, and `ConnectorBrandIcon`, the apps' logos, re-exported from `@semoss/shared`, which keeps the logo files so every package can show them |

A new provider gets its own folder beside `microsoft/` and `google/`, built on `core/` and
`components/`. Provider code may import from `core/` and `components/`; those two never import
from a provider.

## What a host has to wire up

- **The stylesheet.** Import `@semoss/connectors/globals.css` next to
  `@semoss/shared/globals.css`, or none of the viewers' Tailwind classes are generated.
- **The strings.** They live in the `connectors` namespace
  (`libs/i18n/src/resources/locales/*/connectors/connectors.json`); the host's i18n loader map
  has to load it.
- **The host contract.** Every viewer takes `ConnectorViewerProps`, described below.

## Behavior That Is Easy to Break

- **Saving goes into the insight's files, at the top level.** The download reactors always write
  there and replace a file of the same name, so `saveToInsight` picks a free name first and runs
  one download at a time per insight. Emails, threads, chats, events, and documents have no file
  of their own; they are written out as Markdown (`microsoft/microsoft.markdown.ts`,
  `google/google.markdown.ts`) and uploaded. The top level matters: a message's `media` is copied
  flat into the room, so a file in a subfolder would be copied a second time.
- **`onAddToContext` is the host's.** The viewer saves the item, then hands the saved file over;
  the action only shows when the host passes the callback. `onSaved` replaces the viewer's own
  confirmation, and `onSignIn` opens the account's sign in, which must happen inside the click.
- **Signed out is a state, not an error.** `runConnectorPixel` turns the backend's
  `LOGGIN_REQUIRED_ERROR` (its spelling) into `ConnectorSignInError`, and HTTP 401 counts the
  same, since the backend treats a token without an expiry as valid. Google's 403 for a missing
  OAuth scope is its own kind, explained as an administrator setting.
- **Parse at the boundary.** Every reactor output goes through `microsoft/microsoft.parsers.ts`
  or `google/google.parsers.ts`, which drop entries missing what the viewers need and reject
  responses of the wrong shape. The backend returns no pagination tokens; lists that reach their
  `limit` say so or read more by raising it.
- **Outlook reads threads whole.** Emails of one conversation share a row. Opening one reads the
  thread from every folder with `MicrosoftOutlookListMail(conversationId=...)`, which reports each
  email's `uniqueBody`, its text without the history it quotes;
  `microsoft/outlook/outlook-mail.threads.ts` cuts quoted history itself when a body arrives
  without one. Saving an email, from its row or its own view, saves its whole thread.
- **Bodies are plain text, shown and saved as the same Markdown.** The Microsoft reactors ask
  Graph for its text rendering of mail and event bodies, which keeps line breaks and writes a
  link after its text as `label<url>`; Google HTML goes through `toPlainText`, which keeps links
  the same way. `toMarkdownText` (`core/connector-rich-text.ts`) turns that text into Markdown
  (line breaks, dividers, bullets as lists, links, no `[cid:...]` image marks, and escapes where
  text would otherwise read as markup), which `ConnectorTextBody` renders with the `Markdown`
  component's `document` preset and the provider's Markdown module writes into saved files.
- **Rows act the same everywhere.** A row takes its actions as data (`ConnectorItemActions`),
  shows one as a button, as the file explorer's rows do (add to context, or save where the host
  takes no context), and offers all of them on a right-click (`ConnectorItemMenu`, the Radix
  context menu, which a long press or the context menu key also opens). There is no row menu
  button; the drives' explorer rows offer the same entries on their own right-click.
- **Drives are the shared file explorer.** OneDrive and Teams Files render `@semoss/shared`'s
  `FileExplorer` through `ConnectorFileExplorer` (`components/`), so they browse, search, and
  refresh like every other file tree. `microsoft/microsoft-drive.adapters.ts` supplies the files:
  My Files and a channel's files are browsed by path, while Shared with Me reaches each folder by
  the ids it was listed with, remembered under the path it is shown at. The rows carry their
  drive item in `FileItem.data` for the connector's actions: the row button adds a file to
  context, and the menu saves it to the chat's files or opens it in its app. A new drive, such
  as Google Drive, needs only an adapter and those two callbacks. Because the explorer is
  rendered, the tests alias `monaco-editor` the way every host that renders a file panel does.
- **The Google reactors are thin.** Drive lists names only and reads no file contents, so only
  Google Docs, through `GoogleDocsRead`, can be brought in; `GoogleDriveDownload` writes to any
  server path and is never used. Opening a Gmail email marks it read.

## Viewer Presentation

Use the compact shared header, tabs, rows, and action bar across providers. Tabs stay content
width, detail actions remain above the scrolling body, and all surfaces use semantic theme
colors. A host that already names the viewer, such as in a tab, passes `showHeader={false}`;
the refresh then sits at the end of the viewer's toolbar row (the calendars' `actions`), and
Teams Chats, which has no toolbar, keeps a slim row for it. Keep the existing shared file explorer for OneDrive and Teams Files.

Both calendars use `ConnectorCalendar` and `useCalendarWindow`: Sunday-first weeks (the default),
day, three-day, and month views. The List View button shows the current range as an agenda;
Calendar View restores the grid, retaining the view and selected date. Read the visible range,
including adjacent-month days in the six-week month grid. Outlook uses an hourly canvas with
overlapping events side by side; Google uses dated columns because its list response does not
include times. `groupCalendarEvents`
repeats overlapping Outlook events on each local day, treating all-day ends as exclusive. Google
event times load only when opening the event. Outlook still caps each read at 100 events, so
the calendar explicitly identifies incomplete results and does not claim an unloaded day is
empty. Keep the grid mounted during loading to preserve keyboard focus.

## Build System

`@semoss/connectors` is **source-only**, like `@semoss/shared`: no bundler and no `dist/`. Its
`package.json` `exports` point at `src/`, so consuming apps compile the TypeScript themselves.
Keep the source type-clean and Biome-clean.

| Import | Resolves to |
|--------|-------------|
| `@semoss/connectors` | `src/index.ts` |
| `@semoss/connectors/globals.css` | `src/styles/globals.css` |

## Testing Changes

```bash
pnpm --filter @semoss/connectors test         # the parsers, pixels, Markdown, and helpers
pnpm check                                    # Biome lint/format
pnpm --filter @semoss/playground type-check   # compiles the package from a consumer
```
