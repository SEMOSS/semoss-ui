# Collaboration

Personal SEMOSS assistant based on the [collaboration mockups](../../mockups).
The daily brief brings together your calendar, actions needing you, completed
work, assistant questions, and Brain's review queue. Work organizes threads,
next steps, waiting items, and completed work. Brain holds people, topics,
thread context, and source readers. Settings brings together your profile,
appearance, context rules, and data reset.

## Daily brief and chat

The fixed Brief view uses the existing SEMOSS components, semantic color tokens,
Geist typography, and spacing scale. It does not define another theme or palette.
A shared sidebar provides quiet New Task and search actions, For you, Brain,
foldable topics, and sessions grouped by date. Its visible toggle switches between
256px navigation and a 64px icon rail; desktop collapse and Topics disclosure
preferences are stored per account and deployment. Mobile navigation remains a
drawer below 1024px. Waiting on others and Handled are always linked from the
For you summary. Brain contains Review, People, Threads, and Sources navigation;
clicking the profile name opens Settings directly.

Work, Brain, and Settings share the Brief's page canvas, reading width, heading
scale, responsive spacing, and quiet card treatment. Directories retain their
grouped rows and filters; contextual panels become drawers on narrower screens.

New Task opens `/new` with the Brief's page canvas and greeting, a centered input,
and suggested prompts in a responsive two-column layout. The suggestions keep
their space while hidden during editing so the input stays in place.
New and saved chats include an agent dropdown and a Settings menu for chat
configuration and Advanced context, usage, and compaction controls.
New and saved chats show a daily context rail on
wide screens. The first accepted message moves to the saved room conversation
with an anchored composer, keeping the same page framing and daily context.
The rail reuses Needs you, Your day, and Handled from the Brief, in that order,
including the same drafts and actions. Asking stays in the conversation; Brain
review stays on the Brief and Brain pages.
Brief/Chat and ⌘/Ctrl J switch
views while retaining the active chat identity and draft. Suggested questions
and the Brief Ask field populate an editable chat draft; they never auto-send.
On narrow screens the daily context is available through Your day.

The brief orders pending actions by deadline, supports topic filtering, and
uses existing Work commands for marking items handled and reopening them.
Reply and decision links open the existing thread review/approval workflow.
Brain review uses existing topic/person decisions. Calendar rows open their
source details; failed reads show their error and retry action.

Dashboard customization is deferred and is no longer exposed in Settings or the
home view. The layout editor, presets, stored preferences, and published-app tile
implementation remain available in source for a future release.

Daily data uses existing Work refreshes and visible/return-to-app calendar and
email reads. Rendering the brief or chat does not start agent work. Chats load
in server pages of 25, with retry and retained scroll position; opening a saved
chat resolves its source/thread association before navigation.

Search (⌘/Ctrl K) combines server-side Collaboration chat-name/message searches
with loaded Work/Brain records, the upcoming calendar week, independent Outlook
sender and subject queries, and pinned apps. Results are deduplicated; stale
responses are ignored and category failures are isolated. Work/Brain list limits
(5,000 actions, threads, and people; 1,000 topics) are surfaced when reached.
Calendar and Outlook bounds are shown alongside their results.

## State and backend boundaries

Work and Brain share a session backed by the existing `Brain*` and `Work*`
reactors. Connected profile edits, topics, review decisions, notes, thread exclusions,
and Work status changes are synchronized to the backend. Sample records remain local.

The thread assistant uses the existing Playground agent harness: collaboration
rooms, `RunAgent` as the only execution path, streamed events, approvals,
cancellation, and reconnect. Each thread owns a separate insight for file staging.
Before the first send, agent selection and saved chat settings remain local and
do not create a room or history entry. The first submitted request persists those
settings while preparing a room; subsequent requests reuse its saved association.
Work assembles current source context for each request and saves it with the
backend transcript. Earlier requests remain in that conversation's history.
Chat settings use existing room options and the selected agent configuration.
Changes in saved chats persist to that room and apply to future turns; changing
agents preserves manual configuration overrides.
Existing direct room links
retain their original room configuration and chat behavior.

## Microsoft sources and drafts

Sources are initially loaded through explicit actions under Brain → Sources.
Loaded email lists refresh while the page is visible and on return to the app.
Work also refreshes existing Brain/Work summaries and actions without remounting
readers or drafts; connection failures offer a retry on the source and Work pages.
Webhook delivery and automatic agent execution remain backend integration dependencies.
They use the existing SEMOSS Microsoft reactors and `oauth("microsoft")`; the
backend must have Microsoft authentication and the relevant permissions enabled.
Failures are displayed without substituting sample results.

| Source | Bounded read |
| --- | --- |
| Outlook | Up to 20 message headers from the last 1, 7, 30, or 90 days (default 7); folder, sender, subject, and unread filters |
| Teams | Up to 20 chats; the latest 30 messages in a selected chat |
| Calendar | Up to 30 events in the next 7 days, normalized to UTC |

Lists omit message bodies. Reading a selected item fetches its content with a
12,000-character body cap, and importing it into Work is a separate action.
Truncated content is identified. These bounds describe the available first page,
not complete mailbox or conversation synchronization.

Outlook supports formatted new, native reply/reply-all, and forward drafts. The
shared Lexical editor exports sanitized HTML with inline formatting, including
tables. Reply/forward saving creates a native draft, prepends authored HTML to
Outlook's quoted body, and updates that new draft before confirming success.
Further saves create a new copy. Reply composers show editable To and Cc chips,
initialized from the original reply-all envelope, honoring Reply-To and excluding
the connected Microsoft account. Assistant context exclusions do not alter this
envelope. Recipient edits survive panel reopening and assistant body revisions;
empty lists explicitly clear recipients. Loading or unverified recipient defaults
block saving, and the saved draft's envelope must match the reviewed addresses.
Save draft never sends; uncertain saves require an Outlook check before another
attempt.

Email readers and thread controls offer Draft reply, manual Reply, Forward, and
Delete. AI drafting produces editable text; manual Reply makes no agent request.
Every shared draft editor separates Save draft from explicit Send, including new
emails. Sending first saves the reviewed envelope, then sends that exact draft
identity. Uncertain delivery requires an Outlook check before retrying the same
draft. Delete confirms moving the selected message to Outlook Deleted Items.
Teams sending is unavailable.

## Context and new sessions

Context contains one summary and editable goal, editable action items, relevant
PowerPoint progress/results, source-labelled facts, and collapsed inclusion
controls. It contains no mailbox feed or refresh control. Summarize generates a
summary and action items through the existing agent session; Regenerate replaces
untouched generated actions while preserving manual edits and completed items.
The empty action row accepts Enter and remains focused for the next item.
Generated summaries are session state; their underlying requests/results remain
in the saved conversation. Connected action edits use the existing Work APIs.

Topic editing and mute controls live in Settings → Thread. Current/last-request
snapshots, usage, and compaction live in Settings → Advanced; `/compact` opens
that section. Existing Files and Tools panels provide artifacts and sourced
results. Use in reply selects tool results for the next request, with removable
reference chips. Presentation generation remains agent/tool owned and only
appears in Context when relevant activity or saved results exist.

`/new` starts a source-free session with an initially closed, generic workspace
for settings, files, and tool results. Opening these panels does not add an Emails
pane. Email actions remain available through explicit prompts and tool results.

Thread readers opt in to `includeDisplayBody`; older callers default to plain
text. Display bodies are session-only and excluded from assistant context. HTML
emails use DOMPurify and a script-free sandboxed iframe with an independent CSP;
remote images require per-message consent. Teams uses sanitized app typography,
quotes/code/mentions, and media placeholders. Display bodies cap at 128 Ki
characters, falling back to plain text with a notice rather than cutting markup.

**Rollout:** deploy the backend opt-in HTML readers and formatted reply/forward
draft support before releasing these formatted frontend actions. Editable reply
recipients additionally require `MicrosoftOutlookGetMail(includeReplyRecipients=true)`
and `MicrosoftOutlookReplyMail(overrideRecipients=true, to=[...], cc=[...])`.
Deploy that backend support first; existing callers retain native reply behavior. No database
migration, sending-backend changes, or authentication-configuration changes are
required. Existing Microsoft permission errors flow through the current UI.

Native file attachments can be opened, downloaded, or explicitly attached to an
assistant request. Brain threads list them with
`BrainGetThreadMessages(includeAttachments=true)` and read them with
`BrainStageAttachment`, which applies the thread's rules first. Imported Sources
mail uses `MicrosoftOutlookDownloadAttachment`. Open and Download stage one copy,
under a unique filename, in an isolated insight that is never bound to an
assistant room; Open shows it in the dock from there. Assistant attachments are
staged in that thread's insight and submitted only with the user's next message.
Word, Excel, PowerPoint, .msg, and .eml files are sent as a plain-text copy,
because most providers reject those formats. A message's other files may total
20 MB, since every later turn re-sends them.

## Routes and ownership

| Routes | Feature |
| --- | --- |
| `/` | Daily brief |
| `/work`, `/work/waiting`, `/work/done`, `/work/topic/:topicId` | Work lists and topic views |
| `/work/thread/:threadId` | Thread workspace and assistant |
| `/brain`, `/brain/sources` | Review and source readers/imports |
| `/settings/about-you`, `/settings/appearance`, `/settings/rules`, `/settings/data` | Profile/VIPs, theme, context rules, and data reset |
| `/brain/people`, `/brain/people/:personId` | People directory and detail |
| `/brain/threads`, `/brain/threads/:threadId`, `/brain/topics/:topicId` | Context directories and detail |
| `/room/:roomId` | Existing direct conversation links |
| `/new` | New source-free chat session |

`/room` redirects to Work; `/agents/*` redirects to Brain;
`/settings` and the legacy `/brain/profile` and `/settings/dashboard` links open Settings → About you.
Settings categories support direct links and browser history. Unsaved profile and
rule form entries survive category changes and are discarded when leaving Settings.
Profile and filing preferences keep their explicit save actions. Appearance applies
immediately using the existing browser preference (Light, Dark, or System; Light
remains the default). Microsoft sign-in, source readers, drafting, and imports
remain under Brain → Sources, with a link to Settings → Rules.

Thin route pages live in `src/pages`. Shared session state and Work/Brain UI live
in `src/features/collaboration`; Microsoft adapters and forms live in
`src/features/connectors`; dashboard, customization, and search contracts live in
`src/features/dashboard`; settings composition lives in `src/features/settings`;
the thread assistant lives in
`src/features/thread-assistant`. Existing room, message, tool, delegation, and
agent-run infrastructure remains available to direct rooms and the assistant.

## Development

```bash
pnpm dev:collaboration
```

The app runs on port `5180`. Configure `ENDPOINT`, `MODULE`, `APP`, `ACCESS_KEY`,
and `SECRET_KEY` through the workspace environment when connecting to a SEMOSS
backend. Development credentials are not embedded in production builds.

Use the repository's Node and pnpm versions. Route pages are loaded on demand;
generic helpers belong in `@semoss/utility`.

### HTTPS development with an existing Microsoft login

To share a Tomcat login session, open Vite using the same hostname as the
Microsoft callback and use HTTPS. The dev port can differ from Tomcat's port.
Set these environment variables when launching the development command:

| Variable | Purpose |
| --- | --- |
| `SEMOSS_DEV_ORIGIN` | HTTPS frontend origin, for example `https://your-host.local:5181` |
| `SEMOSS_DEV_PFX` | Absolute path to a local PKCS12 certificate with its private key |
| `SEMOSS_DEV_PASSPHRASE` | Keystore password, supplied through the process environment |
| `ENDPOINT` | Tomcat HTTPS origin, for example `https://127.0.0.1:8443` |
| `MODULE` | Backend context path, usually `/Monolith` |

The HTTPS listener binds only to `127.0.0.1`. The frontend hostname must resolve
to that address, and its certificate must be accepted by the browser. Keep
keystore files and passwords outside the repository. These options apply only
to the dev server; production builds retain their existing behavior.

The Microsoft redirect URI can continue pointing at Tomcat. The SDK verifies
popup completion through the backend session, so a callback on another port
does not require access to the popup's document. Tomcat must remain running
while using the dev app. The usual HTTP development command remains available
when `SEMOSS_DEV_ORIGIN` is unset.

## Validation

Run package checks from the repository root:

```bash
pnpm --filter @semoss/collaboration type-check
pnpm --filter @semoss/collaboration test
pnpm --filter @semoss/collaboration build
```

The Settings consolidation passed 62 focused tests across settings, routes,
dashboard layout/interactions, and Collaboration interactions, plus package
type-check, production build, and Biome checks on touched source files. The build
reports large-bundle warnings. Its design fixture was checked at 320, 360, and
1440 CSS pixels in light/dark themes, including mobile navigation, keyboard theme
selection, draft retention, source navigation, and reset confirmation/cancellation.
Reset writes were mocked. Live backend writes, screen-reader announcements, and
native 200% browser zoom were not exercised by this pass.

Dashboard behavioral tests cover paginated chats and retry, stale search responses,
independent Outlook queries, scoped message search, account/storage isolation,
reversible presets, keyboard resizing/reordering, stable app nodes, source reader
initialization, agent snapshots, visible refresh, and calendar DST boundaries.

The dashboard was checked at 320, 360, and 1440 CSS pixels in light/dark themes.
Settings customization, keyboard search, Brain navigation, layout persistence,
and cancel/restore were exercised in the development preview. The signed-in app
was inspected for Home, Brain, and New Task. Native 200% zoom, live Microsoft
calendar/email operations, pending approvals/delegations, and published app
embedding/permission changes still need an end-to-end integration pass. The
in-app browser could not open the HTTPS deployment because its certificate was
untrusted; no certificate settings were changed.

`/dashboard-preview.html` is a development-only design fixture with sample data,
using the real dashboard and Brain components. It is not a live integration
harness or a production build entry.
