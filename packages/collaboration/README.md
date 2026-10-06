# Collaboration

Standalone SEMOSS Work and Brain workspace based on the [collaboration
mockups](../../mockups). Work organizes threads, next steps, waiting items, and
completed work. Brain holds the profile, people, topics, thread context, review
queue, and source rules used alongside that work.

## State and backend boundaries

Work and Brain share a session backed by the existing `Brain*` and `Work*`
reactors. Connected profile edits, topics, review decisions, notes, thread exclusions,
and Work status changes are synchronized to the backend. Sample records remain local.

The thread assistant uses the existing Playground agent harness: collaboration
rooms, `RunAgent`, streamed events, approvals, cancellation, and reconnect. Each
thread owns a separate insight for file staging. The first submitted request or
settings save creates a room; subsequent requests reuse its saved association.
Work assembles current source context for each request and saves it with the
backend transcript. Earlier requests remain in that conversation's history.
Chat settings use existing room options and the selected agent configuration.
Existing direct room links
retain their original room configuration and chat behavior.

## Microsoft sources and drafts

Sources are initially loaded through explicit actions under Brain → Sources and rules.
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

`/new` starts a source-free session. Email this conversation opens an editable
new email containing visible conversation text before any explicit sending.

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
| `/work`, `/work/waiting`, `/work/done`, `/work/topic/:topicId` | Work lists and topic views |
| `/work/thread/:threadId` | Thread workspace and assistant |
| `/brain`, `/brain/profile`, `/brain/sources` | Review, profile, and source configuration |
| `/brain/people`, `/brain/people/:personId` | People directory and detail |
| `/brain/threads`, `/brain/threads/:threadId`, `/brain/topics/:topicId` | Context directories and detail |
| `/room/:roomId` | Existing direct conversation links |
| `/new` | New source-free chat session |

The root and `/room` redirect to Work; `/agents/*` redirects to Brain;
`/settings` redirects to Sources and rules. The obsolete home, agents, sessions,
settings, and sidebar screens have been removed.

Thin route pages live in `src/pages`. Shared session state and Work/Brain UI live
in `src/features/collaboration`; Microsoft adapters and forms live in
`src/features/connectors`; the thread assistant lives in
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

The Work/Brain interface was checked against the supplied mockup source and
previewed at 320–1440 CSS pixels in light and dark themes. Checks covered keyboard
navigation, focus return, review/undo, collapsed navigation and contextual panels,
empty lists, source failures, and draft validation. An isolated preview was used
because the configured backend at `localhost:9090` was unavailable; live Microsoft
and agent requests were not exercised. Reflow was checked at a 640-pixel viewport;
native 200% browser zoom was not available in the preview browser.
