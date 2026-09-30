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

Sources are loaded through explicit actions under Brain → Sources and rules.
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

Outlook-linked Work threads also offer Send reply. This explicitly labeled button
saves a native reply to the original sender (`replyAll=false`), then calls the
existing `MicrosoftOutlookSendDraft` endpoint. A verified receipt must match the
exact draft ID. Enter never sends in this mode. Failed or uncertain sends retain
the content and saved draft; an explicitly acknowledged retry reuses that draft
and cannot create another copy. New-mail sending and Teams sending are unavailable.

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

Native file attachments can be downloaded or explicitly attached to an assistant
request. Downloads use `MicrosoftOutlookDownloadAttachment` and
`DownloadInsightAsset` in the same isolated insight with a unique filename. This
download area is never bound to an assistant room. Assistant
attachments are staged in that thread's insight and submitted only with the
user's next message.

## Routes and ownership

| Routes | Feature |
| --- | --- |
| `/work`, `/work/waiting`, `/work/done`, `/work/topic/:topicId` | Work lists and topic views |
| `/work/thread/:threadId` | Thread workspace and assistant |
| `/brain`, `/brain/profile`, `/brain/sources` | Review, profile, and source configuration |
| `/brain/people`, `/brain/people/:personId` | People directory and detail |
| `/brain/threads`, `/brain/threads/:threadId`, `/brain/topics/:topicId` | Context directories and detail |
| `/room/:roomId` | Existing direct conversation links |

The root, `/room`, and `/new` redirect to Work; `/agents/*` redirects to Brain;
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
