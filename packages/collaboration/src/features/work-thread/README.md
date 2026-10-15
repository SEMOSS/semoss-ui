# Work sources and room conversations

Source threads are inputs to ordinary rooms. Opening a source reads its permitted content, creates a fresh collaboration room, writes a Markdown file into that room's insight, and navigates to the standard room conversation. Concurrent clicks on the same source share the pending import. A later click creates a new room; opening saved chat history always opens the saved room directly.

`features/rooms/room-session.ts` owns the room's isolated insight, settings, composer draft, uploads, message history, and agent-run observer. New chats and imported source threads use this same owner. No separate thread assistant session or source-to-room association lookup remains.

## Source snapshots

`features/rooms/source-import` reads Brain history in 100-message pages until its continuation ends, deduplicates by source message ID, and writes messages oldest first. Participant exclusions, ingestion rules, and quoted-reply cleanup apply before export. Display-only HTML never enters the file. Attachment names are included without automatically downloading attachment bytes.

Connected Outlook selections contain the selected email; calendar selections contain one event. Connected Teams selections contain the latest available 30 messages because that existing endpoint has no continuation. The file states known limits, unavailable messages, exclusions, and truncated bodies. No backend APIs or persistence schemas are changed.

The importer creates and binds the room before uploading into its isolated insight. It keeps an allocated room and confirmed upload receipt through retries, and prevents abandoned routes from continuing file work or navigating later. Room options retain a validated `source` descriptor containing source identity, the saved file path/name, and included message envelope metadata. Message bodies live in the Markdown file.

## Conversation and email tools

The standard room transcript, composer, settings, file panels, and tool workbench handle all conversations. The source file is queued for the first submitted request; opening a source itself does not send an assistant request. Saved room history is independent of the original source route.

`features/room-email` owns retained email editors and proposal reconciliation within the room. ComposeEmail and SendEmail retain the existing tool protocol, source-identity validation, approval flow, and explicit save/send actions. Editor updates and restored proposals do not automatically open panels. The old Emails/Context workspace, reply-generation session, and separate thread transport are removed.

This directory retains only the shared agent selector and the background Brain thread-insight hook used by source lists. Pure request formatting, settings, proposal validation, model resolution, and existing attachment/compaction APIs remain in `features/thread-assistant`; they own no session or room association.

## Validation

Run `pnpm --filter @semoss/collaboration test`, `pnpm --filter @semoss/collaboration type-check`, and `pnpm --filter @semoss/collaboration build` with the repository's supported Node version. Check touched TypeScript with Biome. Import tests cover pagination, exclusions, serialization, root-level upload, partial-failure retry, concurrent activation, navigation cancellation, and later fresh-room creation. Room and email tests cover retained input, run recovery, proposals, and explicit approvals without sending live messages.
