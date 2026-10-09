# Topic workspace: contracts and remaining gaps

The topic workspace uses existing frontend and backend contracts. This change adds
no reactors, backend schema, or synthetic work records. The supplied image is a
layout reference; its people, tasks, dates, messages, and approval history are not
application data.

Source contracts below were checked on 2026-10-09 against this frontend checkout
and the `Semoss/src` and `Monolith/src` backend checkouts. This establishes source
support, not the version deployed by a particular server. Backend paths below are
relative to `Semoss/src`; frontend links are relative to this document.

## Existing contracts used

| Capability | Verified contract and frontend behavior | Source references |
| --- | --- | --- |
| Topic directory and creation | `BrainListTopics` returns `{ items, total }`. `BrainSaveTopic(topic={ name, description? })` with no ID creates a topic, defaults it to `active`, and returns its canonical ID and full details. Creation waits for that result before adding it to shared state and navigating. Active and dormant topics remain in the sidebar even with no rooms or tasks. | [Topic API](../src/features/topics/api/topic-api.ts), [creation dialog](../src/features/topics/create-topic-dialog.tsx), [navigation](../src/features/collaboration/components/collaboration-topics-navigation.tsx); backend B1. |
| Topic details and goals | `BrainGetTopic(topicId)` returns description, goals, people, and stats. `BrainSaveTopicNote(topicId, noteId?, kind="goal", text, state="open"\|"done")` creates or edits one goal. Goals are separate records, not a field accepted by `BrainSaveTopic`. | [Goal API](../src/features/topics/api/save-topic-goal.ts), [goal presentation](../src/features/topics/topic-goals.tsx); backend B1–B2. |
| Related tasks | `WorkListItems(view="all", topicId, sort="priority", limit, offset)` matches either the item's `LINK_TOPIC_ID` or its source thread's `BRAIN_THREAD_TOPIC` link. `topicIds` contains thread-derived links, so `linkTopicId` must also be retained and matched. The response includes `roomId` and `assignee`; these must survive mapping and refreshes. | [Topic API](../src/features/topics/api/topic-api.ts), [live mapping](../src/features/collaboration/live/live-state.ts), [task selection](../src/features/topics/topic-task-selectors.ts); backend B3. |
| Task updates | `WorkUpdateItem(itemId, ...)` accepts status, priority, title, due time, suggestion acceptance, snooze time, and closure reason. It operates by item ID and does not require opening a source thread. The landing uses confirmed status/priority updates and retains errors for retry. | [Task API](../src/features/topics/api/update-topic-task.ts), [task action](../src/features/topics/use-topic-task-action.ts); backend B4. |
| Source context and existing rooms | `BrainListThreads(topicId, detail=true, limit, offset)` supplies topic source metadata. Existing rooms are associated through `GetRoomOptions` source metadata, with verified legacy Brain thread-room links as a fallback only when no explicit source exists. Selecting a saved room opens that exact room. | [Topic read](../src/features/topics/use-topic-work.ts), [topic sessions](../src/features/dashboard/use-topic-sessions.ts), [room associations](../src/features/room-tree/api/list-room-tree.ts); backend B5. |
| Sidebar room pins | `GetPlaygroundRooms(mode="collaboration", pinned=true, limit, offset, includeUnnamedRooms=true)` applies the pin predicate before pagination. `PinRoom(roomId, pinned)` writes the saved conversation's `ROOM.PINNED` and returns a boolean; the frontend requires `true`. Search and the topic Rooms tab omit the pin predicate and continue reading all eligible rooms. | [Room list API](../src/features/rooms/api/list-rooms.ts), [pin API](../src/features/rooms/api/pin-room.ts), [pin control](../src/features/rooms/components/room-pin-button.tsx), [sidebar read](../src/features/room-tree/api/list-room-tree.ts); backend B6. |

Task grouping includes related suggestions, FYIs, and assigned work with their
labels. It preserves existing muted/automated-source exclusions and separates
review requests, open tasks, waiting, completed, and snoozed work; dismissed tasks
are not presented as next actions. The order is priority (`P0` through `P3`, then
unset), descending score, descending received time, and stable item identity.
Completing a review task is not permission to execute a paused agent tool. Actual
run approvals use the existing [attention actions](../src/features/attention/attention-card.tsx).

## Features that remain unavailable

| Reference feature | Current boundary | Requirement before enabling it |
| --- | --- | --- |
| Attach a chat directly to a topic; start a topic chat | Frontend wrappers named `BrainListRoomTopics` and `BrainLinkRoomTopic` exist, but no matching implementation or registration was found in either checked backend source tree. The landing's Rooms tab uses source-thread associations and explains that limitation. New chat and the Chat tab expose an unavailable state. | A verified owner-scoped room-topic read/write contract, association persistence, and refresh/invalidation behavior. Do not infer a durable association from a topic title or silently rewrite room options. |
| Add a standalone topic action item | `WorkCreateItem` requires `threadId`, and `WorkItemUtils.createItem` validates that thread. It has no topic-only create argument. Existing directly linked or source-less items can be read and updated, but that does not establish a create contract. | A supported topic-owned task creation contract and canonical saved item response. Until then, tasks can be added from a source thread; do not fabricate a thread or a local-only task to make the landing button appear functional. |
| Drag tasks, move them up/down, or save arbitrary order | The task API exposes priority/received/closed sorting and a manual priority override. It has no saved position or topic-specific rank field. | A durable ordering model with mutation and concurrency behavior. Priority changes are available now; arbitrary reorder stays unavailable. |
| Order tasks around the goal or adjust focus automatically | Goals store text and open/done state. There is no primary-goal field, goal-to-task relevance score, or goal-ranking endpoint in these contracts. The page leads with the first open goal, falling back to the first returned goal, and keeps additional goals accessible. | An explicit primary-goal contract if needed, plus supported goal-to-task relevance and ranking semantics. Do not describe ordinary priority/score ordering as goal-aware ranking. |
| Topic activity timeline, change suggestions, and per-event undo | A topic has a last-activity statistic, but it is not an activity feed. `BrainUndoTopicChange` handles delete/merge change IDs (B8); Work items have their own change history. Neither provides the illustrated unified topic timeline. | A paginated topic event source carrying stable IDs, actor/time/source attribution, and each event's valid review/undo action. The rail explicitly says activity history is unavailable; no illustrative events are inserted. |

The existing [room-topic wrappers](../src/features/rooms/api/room-topics.ts) and
[header topic control](../src/features/rooms/components/room-topics.tsx) are an
unresolved integration boundary: their failed read currently hides the header
chips. Their presence does not demonstrate backend support. The topic landing and
sidebar association reads do not depend on those wrappers. Reconcile or retire
that adapter when direct room-topic support is addressed.

`WorkOpenRoom` is also distinct from pinning a saved conversation. It creates or
updates a row in `WORK_OPEN_ROOM`, records `LAST_ACTIVE_AT`, and initializes that
table's separate `PINNED` column to false. It does not write `ROOM.PINNED` and must
not be used to populate or toggle the sidebar's pinned rooms (backend B7).

## Completeness and persistence boundaries

- Topic tasks and source threads have independent scoped, paginated reads. The
  reader requests pages of 100, with a safety bound of 100 pages. Duplicate or
  overlapping pages, changing totals, premature empty pages, malformed responses,
  or that bound produce an incomplete/error state. Successfully read task pages
  remain visible, and retry does not turn a failed read into an empty topic.
- Topic directory rows and full topic details are loaded independently of room
  history. Initial loading follows pages of 1,000 topics (up to 100 pages), with
  detail requests batched in groups of 50. Confirmed topic creation updates shared
  state using the server ID. Empty topics created in another session appear after
  reloading the app; periodic global refresh currently expands referenced topics.
  Refresh reconciliation must retain empty topics, scoped task pages, direct
  topic links, and edits made while an older read was pending. See the
  [shared reducer](../src/features/collaboration/state/collaboration.reducer.ts)
  and [refresh owner](../src/features/collaboration/live/work-updates-provider.tsx).
- Global Work/Brain data and agent-attention scans retain their own limits and
  failure states. An incomplete review scan does not establish “nothing needs
  your input.” The landing uses partial-count and incomplete-result wording.
  Topic reads do not make unrelated global searches complete.
- Rooms are inspected in user-requested history batches. Unreadable or malformed
  source metadata does not invent a link or fall through to an unrelated legacy
  room. The Rooms tab reports checked coverage and errors and offers more/retry.
- `GetPlaygroundRooms` returns eligible active conversations with message data,
  excludes child rooms by default, and orders its pages by creation date. A saved
  but empty room may therefore be absent even if pinned. The frontend preserves
  room pin identities beyond its first 25 visible sidebar rows.
- `PinRoom` reports whether its update flow succeeded, not an affected-row count
  or a versioned room record. The frontend requires its confirmed boolean and
  then refreshes history. If stronger write reconciliation is needed, the backend
  contract must expose it; the UI must not invent success after a failure.
- The room summary does not supply a saved-activity timestamp. Room recency and
  unread markers supplement creation dates with browser-observed saved activity,
  scoped to account and deployment. Pins and renames do not create activity.
  This is not cross-device unread synchronization or a topic activity timeline.
- A task without a usable source remains actionable by item ID. Navigation uses
  a verified saved room or loaded source thread when available; it must not build
  an empty/fabricated thread route. Search provides task details for such items.

## Backend source index

Paths are relative to `Semoss/src`. No code changes were made in either backend
checkout for this workspace update.

- **B1 — Topics:** `prerna/reactor/collaboration/BrainListTopicsReactor.java`,
  `BrainGetTopicReactor.java`, `BrainSaveTopicReactor.java`; implementations in
  `prerna/collaboration/BrainTopicUtils.java` (`listTopics`, `getTopic`,
  `saveTopic`). The list query reads `BRAIN_TOPIC` directly; it does not require
  an associated room or task.
- **B2 — Goals:** `prerna/reactor/collaboration/BrainSaveTopicNoteReactor.java`;
  `prerna/collaboration/BrainTopicUtils.java` (`saveTopicNote`, `getGoals`). Goals
  are read from `BRAIN_TOPIC_NOTE` in creation-time/ID order.
- **B3 — Task selection and order:**
  `prerna/reactor/collaboration/WorkListItemsReactor.java`;
  `prerna/collaboration/WorkItemUtils.java` (`listView`, `listItems`, `where`,
  `addTopicIds`, `mapItem`).
- **B4 — Task writes and creation boundary:**
  `prerna/reactor/collaboration/WorkUpdateItemReactor.java`,
  `WorkCreateItemReactor.java`; `prerna/collaboration/WorkItemUtils.java`
  (`updateItem`, `createItem`).
- **B5 — Source links:**
  `prerna/reactor/collaboration/BrainListThreadsReactor.java`,
  `BrainLinkThreadTopicReactor.java`; `prerna/collaboration/BrainThreadUtils.java`.
  Room source options are read by
  `prerna/engine/impl/model/inferencetracking/reactors/GetRoomOptionsReactor.java`.
- **B6 — Saved-room pins and paging:**
  `prerna/playground/reactors/GetPlaygroundRoomsReactor.java` delegates to
  `prerna/engine/impl/model/inferencetracking/reactors/GetUserConversationRoomsReactor.java`.
  `PinRoomReactor.java` is in that same inferencetracking reactors directory.
  `prerna/engine/impl/model/inferencetracking/ModelInferenceLogsUtils.java`
  implements `getUserConversations` (pin filter before limit/offset) and
  `doSetRoomToPinned` (`UPDATE ROOM SET PINNED ...`).
- **B7 — Open workspaces, not sidebar pins:**
  `prerna/reactor/collaboration/WorkOpenRoomReactor.java`;
  `prerna/collaboration/WorkRoomUtils.java` (`openRoom`, `listOpenRooms`).
- **B8 — Limited topic undo:**
  `prerna/reactor/collaboration/BrainUndoTopicChangeReactor.java`;
  `prerna/collaboration/BrainTopicChangeUtils.java`.

The missing direct room-topic APIs were checked by exact name across Java source
in both `Semoss/src` and `Monolith/src`, and against the deployed classes under
`apache-tomcat-11.0.24/webapps/Monolith/WEB-INF/classes`. Topic save/note classes
are present there; no matching room-topic classes were found. Future availability
must be verified against the server being integrated, including its reactor registry.

## Validation

- The collaboration package's 1,317 tests pass, including scoped pagination,
  canonical creation, save failure/retry, direct and multi-topic associations,
  source-less task actions, ranking, stale-read protection, pin paging and
  isolation, approvals, partial reads, and legacy redirects.
- Package type-check and production build pass. Biome checks pass on all 107
  touched TypeScript/TSX/JSON files. The build retains its large-chunk warnings.
- Browser checks used the real page and navigation components with sample state:
  desktop light mode, narrow dark mode with long names, 720-pixel reflow,
  navigation drawer, dialog initial/return focus, and keyboard tab operation.
  The temporary preview harness was removed after verification.
- An authenticated server smoke test for topic/goal/task saves, room pins, and
  persistence after reload was not run: the local application required sign-in.
  Automated persistence coverage uses validated mocked responses and reload reads.
