# Collaboration

Standalone SEMOSS Work and Brain workspace based on the [collaboration
mockups](../../mockups). Work organizes threads, next steps, waiting items, and
completed work. Brain holds the profile, people, topics, thread context, review
queue, and source rules used alongside that work.

## State and backend boundaries

Work and Brain share an in-memory session with undo. Sample scenarios are labeled;
explicitly imported Microsoft items appear as connected items. Profile edits,
topics, review decisions, notes, thread exclusions, and Work status changes reset
when the application reloads. They do not call the proposed `Brain*` or `Work*`
reactors in [reactor-contract.md](../../mockups/reactor-contract.md), which are not
implemented by the current backend.

The thread assistant uses the existing Playground agent harness: collaboration
rooms, `RunAgent`, streamed events, approvals, cancellation, and reconnect. Each
thread owns a separate insight for file staging. The first submitted request
creates a room; subsequent requests reuse its saved association when its context
and model still match. Changed context or model starts a separate conversation.
Selected context submitted to the assistant is saved with the backend transcript,
so the session-only state boundary does not apply to material already submitted.
Work assistants are created without mailbox tools. Existing direct room links
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

Outlook supports new drafts, native reply/reply-all drafts, and forward drafts.
Reply and forward always use `asDraft=true`; there are no send, move, delete, or
mark-read controls. Replies keep the original recipients and subject through
Outlook. New drafts may be incomplete, while supplied addresses are validated.
The backend creates drafts but cannot update them: further saves create a new
copy, and saved drafts can be opened in Outlook. An uncertain save requires the
user to check Outlook before choosing another save.

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
