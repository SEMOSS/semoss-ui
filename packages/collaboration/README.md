# Collaboration

Personal SEMOSS assistant based on the [collaboration mockups](../../mockups).
Home brings together a chat composer, calendar, Brain directories, and handled work.
Topics organize related tasks, reviews, context, and saved rooms. Brain holds people,
thread context, review decisions, and source readers. Settings contains profile,
appearance, context rules, and data reset.

## Navigation and Home

The sidebar shows **My topics**, including active and dormant topics with no tasks
or rooms, followed by **Pinned rooms**. Topics sort alphabetically. **New topic**
opens the name-and-description form from either the sidebar or the topic directory;
successful creation opens the saved topic. Suggested topics remain in Brain review.
Pinned rooms use the existing saved pin state and can be pinned or unpinned from
the conversation header and topic Rooms tab. Unpinned rooms remain accessible
through search and topic Rooms.

The sidebar keeps its saved collapse preference, loaded room depth, unread markers,
and scroll position across routes. The mobile sidebar remains a navigation drawer.
Room topic dots and hover/focus details use verified source associations. The
account footer retains Settings and Log out, including visible retryable errors.
The logo returns to Home; the shared header retains search and room controls.
Conversation editors and drafts remain mounted while changing workbench panes.

Home places the composer beneath its greeting and links to Handled and Waiting on
others. Your day, Brain, and Handled follow in that order, as three desktop columns
and stacked sections on narrow screens. The For you section, pending-count headline,
priority board, and dashboard customization widgets have been removed. Existing
pinned-app preferences are still read by search.

## Topics and review

`/tasks/topics` is the topic directory; `/tasks/topic/:topicId` is the landing page.
Each topic opens with its title and saved goal, then Overview, Context, Rooms, and
Chat tabs. The first open goal is prominent; additional goals can be expanded.
Existing topic notes support adding and editing goals.

Overview separates **Needs your input** from **Next up**. Reviews, approvals, and
questions use the existing attention workflows. Other open related tasks include
FYI and suggested items. Task order follows assigned priority, score, recency, and
stable identity, with unprioritized items last. Waiting and completed work remain
accessible separately. Topic-scoped paginated reads avoid silently limiting tasks
to the globally loaded queue.

Task links open a saved room first, then a source thread. Tasks with neither keep
their details and available actions. Work reviews open a contextual sheet without
creating a room or starting an assistant. Failed saves remain visible and retryable;
agent approvals open their owning conversation's approval workflow. Brain decisions
and suggested memories retain their existing review actions. Non-work review
priorities remain browser preferences scoped to the account and deployment.

Context combines the description, saved goals, confirmed memories, people, and
linked source threads. Rooms lists saved source-linked conversations, including
unpinned rooms, with loading, partial-result, retry, and pagination states.

Topic Chat/New chat, standalone action creation, manual ordering, and the activity
timeline show unavailable explanations where existing backend capabilities are
missing. No invented activity, counts, or goal-based ranking is displayed. The
verified contracts and remaining requirements are documented in
[topic-workspace-gaps.md](docs/topic-workspace-gaps.md). This change adds no reactors
or database migrations.

Legacy For you and Tasks/Work root links redirect to the selected topic or topic
directory. Waiting/done query bookmarks retain their status view and applicable
filters. Work topic aliases remain supported. `/room` and onboarding completion
return to Home.

## Chat and connected sources

New conversations start from the landing composer. Settings and Files open an
inline workbench beneath that composer without navigating away or replacing the
draft. Opening chat files may allocate a room; first send reuses that room.
Attachments, agent selection, and settings otherwise stay local until send.
New and saved chats share the same `RoomSession` owner.

The chat workbench places Emails and Calendar beside Files in a 300px browser.
Each viewer switches between Microsoft and Google, retaining each provider's
filters, loaded results, selection, and scroll position. Mail starts in Inbox and
loads further 25-message pages on demand. Folder selection, full-width search,
and a Filters menu keep the browser compact. Calendar starts with the current
week's date-grouped agenda.

Emails and Calendar expose Refresh through their workbench header controls,
with the same action in the viewer's toolbar in compact layouts. Calendar also
links to the Outlook or Google Calendar homepage. Open in Outlook/Gmail belongs
to an opened email's controls and uses that message's URL; compact email details
keep their inline link. External links open in a new browser tab using the
browser's signed-in account. Calendar's separate Open calendar action still
opens its main workbench tab.

Emails, threads, and events open retained main-area tabs, reused by provider and
item identity within the chat. Returning to the browser restores the originating
provider and row focus. Open calendar opens one full-calendar tab per provider
and collapses the desktop browser. Its dates stay synchronized with that
provider's agenda. Workbench containers below 768px use the compact panel picker;
calendar main panels below 640px use an agenda and restore the chosen grid when
widened. Playground retains the shared viewers' existing default presentation.
The top-left File menu includes a downward chevron. The bounded Brain source
reads below remain separate.

Browsing a new chat's email or calendar does not create a room or start the
assistant. Save to Chat Files and Add to Context prepare that chat's file space
before writing. Added items appear as removable attachments for the next message;
navigation and in-flight sends retain items that have not yet been submitted.

Landing first send submits once and pushes the canonical saved-room route,
consuming the landing draft so Back returns to a fresh overview composer.
A bounded in-memory cache associates unsent drafts with stable history entries,
so Back/Forward restores content. Failures retain drafts, attachments, and
upload receipts; uncertain submissions require reconciliation before another
send. Preparation that finishes after navigation cannot redirect over the
current page. Editable-prompt navigation remains supported.

Source-thread links in topic workspaces and Brain import the selected thread into
a new room. Saved-room links open the exact existing room. Calendar rows open source
details; failed reads retain their error and retry action.

Search (⌘/Ctrl K) combines server-side Collaboration chat-name/message searches
with loaded Work/Brain records, the upcoming calendar week, independent Outlook
sender and subject queries, and stored pinned apps. Results are deduplicated; stale
responses are ignored and category failures are isolated. Source-less tasks open
their detail sheet. Global Work/Brain read limits and calendar/Outlook bounds remain
visible when applicable; topic task reads are independently scoped.

## State and backend boundaries

Work and Brain share a session backed by the existing `Brain*` and `Work*`
reactors. Connected profile edits, topics, review decisions, notes, thread exclusions,
and Work status changes are synchronized to the backend. Sample records remain local.

The account-scoped sidebar reads saved topics independently of room history. Room
reads use `GetPlaygroundRooms(pinned=true)` before pagination; `PinRoom` persists
changes. Metadata checks resolve explicit source links and legacy Brain associations
without opening transcripts. Each pinned room appears once; **Show 25 more** reveals
the next page. Empty active/dormant topics remain navigable. Hover details never load
conversation messages.

The existing room API provides creation dates but no saved-activity timestamp.
The browser therefore remembers saved activity per account and deployment and
uses creation dates for rooms with no known activity. Historical activity from
other browsers is unavailable until the API supplies it. Renaming a room does
not move it upward. Rooms with unreadable associations remain reachable with an
unavailable-topic indicator and a retry message. Large histories can take longer
to resolve because metadata is read through the existing per-room API.

Saved room activity and completed topic changes refresh the list while retaining
loaded depth; route changes do not reload it. Failed refreshes retain visible
rooms and expose retry controls. No backend changes, deployment, or database
migration are required.

A small blue dot marks unread room activity observed by this browser. Read markers
are stored locally per account and deployment and shared across tabs. The first
history load treats existing rooms as read. New activity stays unread until the
loaded conversation is visible; a hidden browser
tab or a mobile workbench covering the conversation does not mark it read. Opening
a room consumes its known activity without another request. Renames do not create
unread activity. This is frontend-only state; it does not sync across devices or
recover activity the existing room API cannot report.

- [ ] **Room list cleanup (`room-tree-cleanup`):** Replace repeated full-history
  scans and per-room metadata reads with incremental loading and cache
  invalidation. Remove browser recency when existing APIs provide saved activity.
  Preserve account isolation, source-link precedence, unique room rows, linked-topic
  dots, 25-room pagination, unread markers, and navigation state. Keep the current
  work frontend-only.

Every conversation uses one `RoomSession` and the existing Playground agent
harness: collaboration rooms, `RunAgent`, streamed events, approvals,
cancellation, and reconnect. Each room owns an isolated insight for files and
retains its composer state. Before a new chat's first send, agent selection and
saved settings remain local; first send creates its room. Saved chats restore
their room directly.

Opening a source thread reads its permitted history, creates a fresh room, and
uploads one Markdown snapshot into that room's files. Concurrent openings of the
same source share the pending import; subsequent openings create new rooms.
Brain history follows all existing 100-message continuation pages. Connected
Outlook, Teams, and calendar snapshots retain the bounds of their current APIs.
Exclusions and ingestion rules apply before export; display-only HTML is never
assistant context. Attachment names are included without downloading file bytes.
The saved source file is queued for the first user request. Importing never starts
an assistant request. Room options store only the source identity, saved file
reference, and included message envelope metadata. No backend changes are needed.

The room's standard transcript, composer, settings, and workbench replace the
separate thread session and rich Emails/Context workspace. Chat settings use
existing room options and apply to future turns. Failed imports retain allocated
rooms and confirmed upload receipts for retry; abandoned imports cannot navigate
over another page.

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

Email-source rooms open the existing email reader in their workbench. Reply opens
the existing editable draft form; choosing Reply again resumes that room's edits.
The composer’s + menu includes View email to reopen the reader. Source selection
is included in the next assistant message. Opening a room only reads permitted
source messages and does not create a draft, send email, or request an assistant
response. Brain reads preserve current exclusions; Outlook reads verify the saved
message identities. Assistant email tools also produce room-owned editable drafts.
Every shared draft editor separates Save draft from explicit Send, including new
emails. Sending first saves the reviewed envelope, then sends that exact draft
identity. Uncertain delivery requires an Outlook check before retrying the same
draft. Delete confirms moving the selected message to Outlook Deleted Items.
Teams sending is unavailable.

## Source context and new sessions

Work and Brain retain their source summaries, participant rules, topics, and
action items independently of assistant rooms. A source import captures the
permitted messages at that moment. Its file identifies missing or bounded
history and does not silently replace unavailable messages with sample content.

The landing composer starts a source-free draft with an initially closed workbench.
Files and tool results use the same panels as saved and imported rooms. Email
actions remain available through explicit prompts and tool results; restored
draft proposals never open editor panels automatically.

Thread readers opt in to `includeDisplayBody`; older callers default to plain
text. Display bodies are session-only and excluded from assistant context. HTML
emails use DOMPurify and a script-free sandboxed iframe with an independent CSP;
remote images require per-message consent. Teams uses sanitized app typography,
quotes/code/mentions, and media placeholders. Display bodies cap at 128 Ki
characters, falling back to plain text with a notice rather than cutting markup.

**Backend compatibility:** the current SEMOSS backend already supports the
opt-in HTML readers, formatted reply/forward drafts,
`MicrosoftOutlookGetMail(includeReplyRecipients=true)`, and
`MicrosoftOutlookReplyMail(overrideRecipients=true, to=[...], cc=[...])` used here.
These contracts were checked against both the backend source and the deployed
Tomcat classes on October 6, 2026 (Semoss `c92b5cd2c553`, Monolith
`5aa478598af7`). This frontend requires no backend code changes,
database migration, or authentication-configuration changes on that baseline.
Existing Microsoft permission errors flow through the current UI. Live Microsoft
permissions and delivery still depend on the connected account.

Source readers retain explicit attachment downloads through the existing
Microsoft APIs. Source snapshot imports include attachment names only. Files
chosen for a room's composer use the room's ordinary upload and submission flow.

## Routes and ownership

| Routes | Feature |
| --- | --- |
| `/` | Global landing overview and compact chat composer |
| `/for-you` | Compatible redirect to the selected topic or topic directory |
| `/tasks`, `/tasks/all`, `/work`, `/work/all` | Redirect to the selected topic or topic directory; waiting/done query bookmarks retain their status view |
| `/tasks/waiting`, `/tasks/done` | Waiting and handled action views |
| `/tasks/topics` | Topic directory |
| `/tasks/topic/:topicId` | Topic overview, context, source-linked rooms, and capability states |
| `/work/waiting`, `/work/done`, `/work/topics`, `/work/topic/:topicId` | Compatible status and topic workspace aliases |
| `/thread/:id` | Source import bridge, or saved room when the identity starts with `room:` |
| `/brain`, `/brain/sources` | Review and source readers/imports |
| `/settings/about-you`, `/settings/appearance`, `/settings/rules`, `/settings/data` | Profile/VIPs, theme, context rules, and data reset |
| `/brain/people`, `/brain/people/:personId` | People directory and detail |
| `/brain/threads`, `/brain/threads/:threadId`, `/brain/topics/:topicId` | Context directories and detail |

`/room` redirects to Home; `/agents/*` redirects to Brain;
`/settings` and the legacy `/brain/profile` and `/settings/dashboard` links open Settings → About you.
Settings categories support direct links and browser history. Unsaved profile and
rule form entries survive category changes and are discarded when leaving Settings.
Profile and filing preferences keep their explicit save actions. Appearance applies
immediately using the existing browser preference (Light, Dark, or System; Light
remains the default). Microsoft sign-in, source readers, drafting, and imports
remain under Brain → Sources, with a link to Settings → Rules.

Thin route pages live in `src/pages`. Shared session state and Work/Brain UI live
in `src/features/collaboration`; Microsoft adapters and forms live in
`src/features/connectors`; Home, saved preferences, and search contracts live in
`src/features/dashboard`; the shared pending collection and review UI live in
`src/features/attention`; topic landing composition lives in `src/features/topics`; settings composition lives in `src/features/settings`;
conversation ownership and source imports live in `src/features/rooms`;
room-local email editing lives in `src/features/room-email`. Existing message,
tool, delegation, and agent-run infrastructure is shared by every room.

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
pnpm dlx knip --workspace @semoss/collaboration
pnpm --filter @semoss/collaboration type-check
pnpm --filter @semoss/collaboration test
pnpm --filter @semoss/collaboration build
```

The October 7, 2026 landing/topic Work implementation passed all 921 tests across
125 files, package type checking, the production build, and Biome checks on all
42 touched TypeScript files using Node 24.4.0. Existing React test warnings and
large-bundle build warnings remain. The real-layout preview was inspected at
320, 360, 720, and 1440 CSS pixels in light/dark themes, including long content,
keyboard composer and tab navigation, topic sessions, and the mobile Settings
workbench. No horizontal page overflow was observed. Native 200% zoom is not
available in the preview browser; the equivalent 720-pixel reflow was checked.
Live backend sends/uploads and real-device screen-reader behavior were not
exercised by this preview pass; lifecycle and recovery checks use test fixtures.

The October 6, 2026 backend-compatibility pass used Node 24.4.0: all 1,055 tests
across 138 files passed, along with package type-check, production build, and
Biome checks on changed source/configuration files. Regression coverage includes
queued server IDs, priority clearing, topic calendar series,
native source identities, empty versus omitted email fields, and HTTPS development
configuration. Existing React test warnings and large-bundle build warnings remain.
The isolated browser reached sign-in; authenticated Microsoft operations and
delivery were not exercised. No backend files were changed.

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

The coordinated header update passed 123 focused tests across navigation, account
menus, search, settings, room controls, and conversation/workbench state. Package
type-check, production build, and touched-file Biome checks passed using Node
24.4.0; the build retains the existing large-chunk warnings. The preview was checked
at 320, 360, and 1440 CSS pixels in light/dark themes, including long names/titles,
loading/error states, keyboard focus, account navigation, and retained chat drafts
across pane changes. The unified room header remains 56px tall without horizontal page
overflow; route transitions clear the room controls without remounting global controls.
Logout success/failure/pending cases were mocked; no live session was ended. Native
200% browser zoom and real-device touch/screen-reader behavior were not exercised.
The preview's Files panel lacked an AccessStoreProvider, so file operations were not
validated by this shell pass.
