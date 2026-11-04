# AGENTS.md - @semoss/connectors

This document provides context for AI coding assistants working with the SEMOSS connector
viewers library.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> owns general implementation, naming, imports, and validation rules.

## Overview

`@semoss/connectors` holds the viewers that browse the signed in user's Microsoft 365 and Google
Workspace through the `Microsoft*` and `Google*` reactors, in whatever insight `useInsight()`
provides: `OneDriveViewer`, `MailboxView`, `CalendarAgendaView`, `TeamsChannelViewer`,
`TeamsFilesViewer`, `TeamsChatViewer`, `GoogleDriveViewer`, and `GoogleDocsViewer`. Hosts render
a viewer inside their own panel or dialog.

Mail and calendars are one set of views for both accounts. `MailboxView` and
`CalendarAgendaView` take a `provider` (`ConnectorAccount`, `"microsoft"` or `"google"`) beside
the host contract, and an optional `brand` for the logo. The provider picks a descriptor
(`mail/mail-apps.ts`, `calendar/calendar-apps.ts`) that names the app, its logo, and its reactor
prefix (`MicrosoftOutlook`, `GoogleGmail`, `MicrosoftCalendar`, `GoogleCalendar`). Everything
else is shared, because the backend's mail and calendar reactors answer in one shape whichever
account they read.

It sits above `@semoss/shared`: it depends on `@semoss/i18n`, `@semoss/sdk`, `@semoss/shared`,
`@semoss/ui`, and `@semoss/utility`, and nothing in those libraries depends on it. Its one
third-party library beyond React and the icons is DOMPurify, which sanitizes email HTML.
Generic date, text, and object helpers come from utility category subpaths;
provider parsing, calendar view rules, and presentation remain here.

## Structure

| Folder | Purpose |
|--------|---------|
| `core/` | What every provider shares: the host contract (`connector.types.ts`), running a reactor (`connector-pixel.ts`, `reactor-call.ts`), saving into the insight (`connector-files.ts`, `use-connector-saver.ts`), formatting, the text to Markdown conversion (`connector-rich-text.ts`), the helpers the saved files are written with (`connector-markdown.ts`), the list, focus, and search field hooks, and what the tool views share: reading a call (`tool-view-call.ts`), the tool view host as viewer props (`tool-view-host.ts`), and one decision at a time (`use-tool-decision.ts`) |
| `components/` | The building blocks every viewer is made of: header, list, rows, detail view, status, text body, actions, and the file explorer the drives browse in; and those of the tool views: their card, the call's status, the decision row, and Back to the Agent |
| `mail/` | Mail for both accounts: types, parsers, pixels (`mailPixels(prefix)`), folders, threads, saved files, the formatted body (`mail-html.ts`, `MailHtmlBody`), the views (`MailboxView`, its message, thread, and attachment views), and the mail tool views (`MAIL_TOOL_VIEWS`, `mail-compose.ts` for the compose form's rules) |
| `calendar/` | Calendars for both accounts: the same, with `CalendarAgendaView` and its event view, and the calendar tool views (`CALENDAR_TOOL_VIEWS`, `calendar-event-edit.ts` for the event form's rules) |
| `microsoft/` | Microsoft 365 apps without a shared counterpart: their reactor output types, parsers, pixels, and saved files, with a folder per app (`onedrive/`, `teams/`) |
| `google/` | Google Workspace: the same, with a folder per app (`docs/`, `drive/`) |
| `styles/globals.css` | Tailwind source discovery for the host's stylesheet |
| `index.ts` | The public entry point: the viewers, their props, the host contract, and `ConnectorBrandIcon`, the apps' logos, re-exported from `@semoss/shared`, which keeps the logo files so every package can show them |

A new provider gets its own folder beside `microsoft/` and `google/`, built on `core/` and
`components/`. A new mailbox or calendar is a descriptor in `mail-apps.ts` or
`calendar-apps.ts`, once its reactors answer in the shared shape. Provider, mail, and calendar
code may import from `core/` and `components/`; those two never import from them.

## What a host has to wire up

- **The stylesheet.** Import `@semoss/connectors/globals.css` next to
  `@semoss/shared/globals.css`, or none of the viewers' Tailwind classes are generated.
- **The strings.** They live in the `connectors` namespace
  (`libs/i18n/src/resources/locales/*/connectors/connectors.json`); the host's i18n loader map
  has to load it.
- **The host contract.** Every viewer takes `ConnectorViewerProps`, described below. The mail
  and calendar views also take the `provider` they read.
- **Tool views.** A host that draws tool calls passes `MAIL_TOOL_VIEWS` and
  `CALENDAR_TOOL_VIEWS` to `@semoss/shared`'s `ToolViewProvider` as the `mail` and `calendar`
  libraries, and gives each view a `ToolViewHost`, described under Tool views below.

## Behavior That Is Easy to Break

- **Saving goes into the insight's files, at the top level.** The download reactors always write
  there and replace a file of the same name, so `saveToInsight` picks a free name first and runs
  one download at a time per insight. Emails, threads, chats, events, and documents have no file
  of their own; they are written out as Markdown (`mail/mail.markdown.ts`,
  `calendar/calendar.markdown.ts`, `microsoft/microsoft.markdown.ts`,
  `google/google.markdown.ts`) and uploaded. The top level matters: a message's `media` is copied
  flat into the room, so a file in a subfolder would be copied a second time.
- **`onAddToContext` is the host's.** The viewer saves the item, then hands the saved file over;
  the action only shows when the host passes the callback. `onSaved` replaces the viewer's own
  confirmation, and `onSignIn` opens the account's sign in, which must happen inside the click.
- **Save preparation belongs to the originating host.** Optional
  `prepareSave?: () => Promise<void | (() => void)>` runs before saving. A returned release
  function runs in `finally`, after save callbacks, including failures and navigation away.
  The host retains its originating session before preparing its files; if preparation rejects,
  the host releases that retention itself. Saves capture their insight and callbacks when
  requested. Browsing does not invoke preparation or allocate a saved chat.
- **Signed out is a state, not an error.** `runConnectorPixel` turns the backend's
  `LOGGIN_REQUIRED_ERROR` (its spelling) into `ConnectorSignInError`, and HTTP 401 counts the
  same, since the backend treats a token without an expiry as valid. Google's 403 for a missing
  OAuth scope is its own kind, explained as an administrator setting.
- **Parse at the boundary.** Every reactor output goes through the parsers of its folder
  (`mail/mail.parsers.ts`, `calendar/calendar.parsers.ts`, `microsoft/microsoft.parsers.ts`,
  `google/google.parsers.ts`), built on `core/connector-parse.ts`, which drop entries missing what
  the viewers need and reject responses of the wrong shape. The mail and calendar listings take
  `limit` and `offset` and answer `hasMore`; a view that stops at its limit says so. The other
  reactors return no pagination tokens, so their lists that reach their `limit` say so or read
  more by raising it.
- **Mailbox pages stay at 25 messages.** `useMailPages` advances `offset` by `MailPage.rawCount`
  before malformed entries and duplicate IDs are removed, and continues while `hasMore` is
  true. Refresh and filter/provider/insight changes restart the sequence. Concurrent page
  requests are guarded and stale responses discarded. Additional-page failures retain loaded
  rows and retry the same offset; expired authentication uses the existing sign-in flow. An
  empty raw page with `hasMore` is retryable, not an end-of-list signal. Shared connector
  queries also discard retained data when their originating insight changes.
- **Mail reads threads whole.** Emails of one conversation share a row. Opening one reads the
  thread from every folder with `<prefix>ListMail(conversationId=...)`. Outlook reports each
  email's `uniqueBody`, its text without the history it quotes; `mail/mail.threads.ts` cuts
  quoted history itself when a body arrives without one, as every Gmail body does. Saving an
  email, from its row or its own view, saves its whole thread.
- **Folders are a tree.** `<prefix>ListMailFolders` returns nested folders too, each right after
  the folder it sits in, with `parentId`, `path` (`Inbox/Projects`), and `depth`: Outlook walks
  Graph's `childFolders`, and Gmail nests a label under the label its name continues. The
  picker (`MailFolderPicker`) reads up to 500 folders and shows them as the `TreeView` of
  `@semoss/ui/next` in a popover: the inbox first under its well known name with the folders
  inside it (`mail/mail.folders.ts` orders and nests them), open to start with, each folder
  that holds others opening and closing with its chevron, and each with its unread count. A
  chosen nested folder is named by its path on the closed picker and in the header. The inbox
  is the folder whose `wellKnownName` is `inbox`, whatever it is called in the user's language,
  and only a listing without one falls back to a top-level folder named Inbox.
- **Search reads like the mailbox's own.** The search box sends what is typed whole as
  `<prefix>ListMail(search=...)`, and the backend reads it once (`MailSearchParser`): words
  match anywhere, `from:`, `to:`, `cc:`, `subject:`, and `body:` narrow the word or quoted
  phrase after them, and each mailbox writes the terms in its own syntax, a clause per word.
  Gmail has no `body:`, so its hint (`MailApp.searchHintKey`) says words match anywhere. The
  results come newest first.
- **A search field searches once typing pauses, and clearing it stops at once.** Mail and
  Teams Chats both use `useConnectorSearch` (`core/use-connector-search.ts`): what is typed is
  searched 300 ms after the last key, and clearing the field forgets what it searched, so a
  search typed right after a clear never shows the results of the one before.
- **Emails show with their own formatting; everything saved is Markdown.** The message view and
  an opened thread email read `<prefix>GetMail(includeDisplayBody=true)` and show the
  `displayBody` HTML with `MailHtmlBody`; Outlook reads the body as written for it with a
  read of its own, since every other read asks Graph for its text rendering. `mail/mail-html.ts`
  sanitizes it into a document of its own, for a frame that runs no script and is as tall as
  the email, with an instance of DOMPurify made for mail alone, so the hooks other code adds to
  the shared instance (diagram rendering adds some) never change what an email keeps. The
  sanitized page is read back into a document and its content policy, which loads nothing
  until the reader asks, is put first in its head along with a `no-referrer` policy; a page the
  policy cannot lead is not shown, and the text body stands in. Outlook writes its CSS inside an
  HTML comment, which the sanitizer would drop with every rule in it, so the comment markers are
  taken out of style elements first. Links, image map areas included, open in a new tab, and
  the history a reply quotes (Outlook's `divRplyFwdMsg`, Gmail's `gmail_quote`, and the like)
  waits for Show Quoted Emails. The text body shows until the HTML arrives and stands in when an
  email has none; `displayBody` is display only and is never saved or added to context.
- **Pictures load only when the reader says.** While an email holds pictures back, or has news
  of them, a bar above it offers Show Embedded Pictures and Show Web Pictures separately; once
  they show, the bar goes. Embedded pictures, the ones the HTML names by `cid:` in an `img`, a
  style's `url()`, or an old `background` attribute (moved into the style), are read from the
  mailbox on demand (`useMailEmbeddedImagesReader`, which reads
  `GetMail(includeDisplayBody=true, includeInlineImages=true)`): `displayBody.inlineImages`
  carries each as base64, up to 3 MB each and 10 MB per email, and `inlineImagesOmitted` counts
  the rest, which keep their placeholder. They show as `data:` addresses, which the frame's
  policy allows only once they are shown; web pictures, backgrounds included, need `https:`.
  `MailPicturesMenu` beside an email's date (under it, in a thread) keeps a choice of what
  shows without asking (Ask Each Time, Always Show Embedded Pictures, Always Show All Pictures)
  in `localStorage` under `semoss.connectors.mail.pictures.v1`
  (`use-mail-picture-preference.ts`), shared by every email shown, and offered only on an email
  with pictures (`hasMailHtmlPictures`); a change leaves what an email already shows, and
  without storage every email asks. Show Embedded Pictures stays one button while it reads and
  when it fails (Try Again), marked `aria-disabled` while it reads so it keeps focus; once a
  picture button goes, focus moves to the bar's next button or to the email's frame.
- **The frame fits the email.** The frame is measured from outside, so the document has a
  doctype, and a style after every style the email has makes `html` and `body` as tall as
  their content with no scrolling of their own, the body holding its floats and its children's
  margins (`display: flow-root`). The measure is the whole page's box and a scroll bar across a
  wide email; past 20,000 px the frame stops growing and the rest scrolls inside it, so none
  of the email is out of reach. An email that sizes itself to its window would otherwise leave
  a second scroll bar inside the panel's.
- **Text bodies are shown and saved as the same Markdown.** The Microsoft reactors ask
  Graph for its text rendering of mail and event bodies, which keeps line breaks and writes a
  link after its text as `label<url>`; the Gmail reactors turn HTML into text the same way on
  the server, and the Docs and Drive viewers use `toPlainText` for Google HTML. `toMarkdownText` (`core/connector-rich-text.ts`) turns that text into Markdown
  (line breaks, dividers, bullets as lists, links, no `[cid:...]` image marks, and escapes where
  text would otherwise read as markup), which `ConnectorTextBody` renders with the `Markdown`
  component's `document` preset and the provider's Markdown module writes into saved files.
- **Rows act the same everywhere.** A row takes its actions as data (`ConnectorItemActions`),
  shows one as a button, as the file explorer's rows do (add to context, or save where the host
  takes no context), and offers all of them on a right-click (`ConnectorItemMenu`, the Radix
  context menu, which a long press or the context menu key also opens). There is no row menu
  button; the drives' explorer rows offer the same entries on their own right-click.
- **Drives are the shared file explorer.** OneDrive and Teams Channel Files render `@semoss/shared`'s
  `FileExplorer` through `ConnectorFileExplorer` (`components/`), so they browse, search, and
  refresh like every other file tree. `microsoft/microsoft-drive.adapters.ts` supplies the files:
  My Files and a channel's files are browsed by path, while Shared with Me reaches each folder by
  the ids it was listed with, remembered under the path it is shown at. The rows carry their
  drive item in `FileItem.data` for the connector's actions: the row button adds a file to
  context, and the menu saves it to the chat's files or opens it in its app. A new drive, such
  as Google Drive, needs only an adapter and those two callbacks. Because the explorer is
  rendered, the tests alias `monaco-editor` the way every host that renders a file panel does.
- **Teams chats read newest first, by when each message was sent.** `MicrosoftTeamsListChats`
  answers each chat with its last message, and the chat list orders and dates chats by that
  message (`teamsChatActivityDate`); a chat's `lastUpdatedDateTime` is when it was renamed or
  its members changed, so it only stands in for a chat read without one.
  `MicrosoftTeamsListChatMessages` asks Graph for `createdDateTime desc`, so an old message
  somebody edited or reacted to stays where it was sent, and `TeamsChatDetail` shows the 50
  newest with the newest at the top. Channel threads come newest first with their replies oldest first.
  A saved chat (`teamsChatToMarkdown`) is always written oldest first, whatever order it is
  given.
- **Teams search finds messages, not chats.** Typing in Teams Chats' search field runs
  `MicrosoftTeamsSearchMessages` with `chatsOnly` (`use-teams-message-search.ts`), the Microsoft
  Search index over message text, senders, and attached files, which also takes KQL such as
  `from:` and `sent>`. Channel posts are left out on the server, since the Channels viewer shows
  them. Each hit carries a plain text `summary` around the match, not its body, and is named by
  its chat from the chat list when the list holds it. Opening a hit opens its chat with
  `matchedMessageId`: the message is marked and scrolled to when it is among the newest 50, and
  the chat says so when it is older. A chat the list does not hold is opened by id and named
  with `MicrosoftTeamsGetChat`. The search is read 25 messages a page: Show More reads the next
  page from the `nextOffset` the reactor answered with, which counts the channel posts it left
  out, and adds it below without listing a message twice, so the rows already shown keep their
  places. A new search, even for something searched before, starts from its first page, and a
  page that fails keeps what was found and can be tried again.
- **The Google reactors are thin.** Drive lists names only and reads no file contents, so only
  Google Docs, through `GoogleDocsRead`, can be brought in; `GoogleDriveDownload` writes to any
  server path and is never used. Opening an email in either mailbox leaves it unread; marking it
  read is its own reactor, `<prefix>MarkMailRead`.

## Tool views

The mail and calendar reactors declare `component://mail/<view>` and
`component://calendar/<view>` as their calls' view, with the account as `provider`. The views
implement `@semoss/shared`'s `ToolViewProps`, and each mailbox or calendar shares them:

| URI | Call | While it waits | Once it ran |
|-----|------|----------------|-------------|
| `mail/list` | `ListMail` | | The emails found, each opening in place |
| `mail/message` | `GetMail` | | The email, with its attachments |
| `mail/message?intent=move`, `intent=delete` | `MoveMail`, `DeleteMail` | The email, and for a move its folder, editable | What was done |
| `mail/compose?intent=send`, `draft`, `reply`, `forward` | `SendMail`, `SaveDraft`, `ReplyMail`, `ForwardMail` | The email as a form, every field editable | The email as sent or saved |
| `mail/compose?intent=send` | `SendDraft` | The saved draft, as it is | The email as sent |
| `calendar/agenda` | `ListEvents` | | The events found, each opening in place |
| `calendar/event` | `GetEvent` | | The event |
| `calendar/event?intent=respond`, `intent=delete` | `RespondToEvent`, `DeleteEvent` | The event, and for an answer the answer, message, and whether the organizer is told, editable | What was done |
| `calendar/event-edit?intent=create`, `intent=update` | `CreateEvent`, `UpdateEvent` | The event as a form, every field editable | The event as the calendar left it |
| `calendar/availability` | `GetSchedule` | | Each person's busy times |

- **Every field starts from the model and can be changed.** Approving runs the call with the
  edited arguments; arguments a form does not show, such as attachments or a reminder, are kept
  as the model gave them. An update sends only what is filled in, so a field left empty keeps
  what the event has.
- **Another operation, then Back to the Agent.** A send offers Save as Draft, and a draft Send
  Now, on the same mailbox (`mailComposeAlternative`). It runs at once from the view; the call
  then waits until the user presses Back to the Agent, which resolves it with
  `{ userAction, summary, result }` through `onRespond`, so the agent continues from what was
  really done. Until then the operation is kept by call (`mail-compose-outcomes.ts`), so the call
  shown again, inline or in the sidebar, offers Back to the Agent rather than the form, and the
  email never runs twice; a reload of the page forgets it. A result view shows such an outcome as
  what the user did instead.
- **A result is the call's own.** The message and event views take `isSummaryComplete` for a
  call's result: it shows at once, a read again only brings it up to date, and a failed read
  keeps it.
- **A view reads its call, and reads only what the user opens.** A list's rows open and save
  through the reactors directly, not through the model. The views never write a pixel by hand:
  `MailPixels` builds the alternative operations, and `call` takes lists, such as recipients, as
  every value of a key.
- **Saves carry their app.** `toViewerHost` turns the host's `ToolViewHost` into viewer props,
  naming the viewer service a saved file came from as its `source`.

## Viewer Presentation

Use the compact shared header, tabs, rows, and action bar across providers. Tabs stay content
width, detail actions remain above the scrolling body, and all surfaces use semantic theme
colors. A host that already names the viewer, such as in a tab, passes `showHeader={false}`;
the refresh then sits at the end of the viewer's toolbar row (the calendars' `actions`), and
Teams Chats keeps a slim row for it above its search field. Each Teams view starts its toolbar row with `TeamsViewLabel`, naming what it lists (Posts, Files, Your chats), since the three share the Teams logo. Keep the existing shared file explorer for OneDrive and Teams Channel Files.

Hosts can opt into retained browsing without depending on a particular dock. `MailboxView`
accepts `presentation="compact"`, `onOpenItem(MailSelection)`, and a `focusItem` request
(`{ itemKey, requestId }`). `MailDetailView` renders the selected message or thread using the
provider captured in that selection. `CalendarAgendaView` accepts `onOpenEvent`,
`onOpenCalendar`, and a shared `CalendarWindow` from the exported `useCalendarWindow`;
`CalendarEventDetailView` renders a selected event for its fixed provider. Calendar
`presentation="agenda"` keeps the date-grouped browser; `presentation="calendar"` adapts
below 640px of its own container and restores the chosen grid when wider. The default
presentation preserves Playground's existing calendar/list behavior.

Optional `onControlsChange(ConnectorViewerControls)` publishes refresh, external-link,
internal Open calendar, and mail/event Add to Context actions instead of showing their inline
equivalents. Only visible viewers publish (`isVisible` defaults to true); hosts keep callbacks
scoped to their provider/tab and own registration, retention, and navigation. Omitting the callback restores existing viewer
controls, including in compact host layouts. Mail detail links use only a matching loaded
message, or the newest loaded matching thread message, validated as an absolute HTTPS URL;
there is no mailbox-home fallback. Retained detail `focusRequestId` values request heading
focus on each open/reopen, while browser `focusItem` restores the originating row or focuses
the list when the row is gone (the browser container in empty/error states). Hidden viewers
do not move focus. Omitting these optional host APIs preserves inline detail
navigation and existing Playground controls.

`CalendarAgendaView` uses `ConnectorCalendar` and `useCalendarWindow`: Sunday-first weeks (the
default), day, three-day, and month views. The List View button shows the current range as an
agenda; Calendar View restores the grid, retaining the view and selected date. Read the visible
range, including adjacent-month days in the six-week month grid. Both calendars return UTC
instants, or dates for all-day events, so both use the hourly canvas with overlapping events
side by side. `groupCalendarEvents` repeats overlapping events on each local day, treating
all-day ends as exclusive. Each read is capped at 100 events, and when the reactor answers
`hasMore` the calendar identifies incomplete results, naming the app to open for the rest, and
does not claim an unloaded day is empty. Keep the grid mounted during loading to preserve
keyboard focus.

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
