# Topic workspace contracts

Checked against the current `Semoss/src` and `Monolith/src` sources on 2026-10-09.
No backend code, schema, SDK API, or dependency changes are included.
[../TODO.md](../TODO.md) is the sole gap and outstanding-verification list.

| Existing capability | Contract used |
| --- | --- |
| Saved topic directory | `BrainListTopics(limit, offset)` reads saved topics directly and returns `{ items, total }`. Navigation and My topics share one complete paginated read. Suggested, active, and dormant rows remain visible; archived rows are excluded by presentation. |
| Selected topic detail | `BrainListTopics(topicId)` returns one topic with description, goals, people, stats, and backend memory context. Only the selected topic receives this detail read. |
| Topic creation and edits | `BrainSaveTopic` returns a canonical persisted identity. Existing goal writes use `BrainSaveTopicNote`; ordinary notes use topic-linked memories. Confirmed creation and edits reconcile the directory without recreating or accepting suggestions. |
| Topic tasks | `WorkListItems(view="all", topicId, sort="priority", limit, offset)` includes direct `linkTopicId` and source-derived `topicIds`. `WorkUpdateItem` writes by item ID, including tasks without a source. |
| Topic context | `BrainListPeople(topicId)`, `BrainListThreads(topicId, detail=true)`, and `BrainListMemories(refType="topic", refId, state=["active","suggested"])` load when Context opens. |
| Topic rooms | `BrainListTopicRooms(topicId, limit=25, offset)` returns `{ topicId, items, total }` and saved `lastAt` timestamps. No global history scan or source inference is needed. |
| Room associations | `BrainListRoomTopics(roomId)` and `BrainLinkRoomTopic(roomId, topicId, remove)` distinguish linked, suggested, and dismissed associations. Only linked associations count as membership. Owner writes patch room chips, loaded sidebar rows, and affected topic-room caches. Returned names remain usable without directory rows; explicit refresh retrieves delayed classifications. |
| Sidebar pins | `GetPlaygroundRooms(mode="collaboration", pinned=true, limit=25, offset, includeUnnamedRooms=true)` filters before pagination. Only loaded rows receive association reads. `PinRoom` requires a confirmed success before changing local state. |
| Topic chat | The existing landing composer receives `topicId`; room allocation precedes `BrainLinkRoomTopic`, which precedes submission. Retry reuses the room and draft. |
| Topic review | `BrainStartTopicReview` returns a saved review or `{ exists:false, pending:true, job }`. `BrainGetJob(kind="topic_map", jobId)` follows the job; `BrainGetTopicReview` retrieves its saved result. Existing revision checks, profile conflicts, apply receipts, and exact filing-job ownership remain enforced. |
| Staged areas | `BrainSetTopicArea(reviewId, revision, area, split)` returns the saved review. Structural changes flush profile edits first, serialize writes, preserve server-owned metadata, and disable area controls for accepted topics. |
| Added people and clues | `BrainListPeople(query, limit=25, offset)` powers on-demand search. Original-person corrections and added-person selections share the draft; suggested terms require explicit acceptance. |
| People reach | `BrainPreviewTopicReach(reach={people})` returns `{ threads, together, samples }`. The expanded editor debounces changes, shares account-scoped results, retains failures for retry, and checks the 60-person limit. |
| Grouping and review chat | `BrainSuggestTopicOrganization` retains coverage of every kept topic and editable groups/target selection. `BrainTopicReviewChat(reviewId, revision, chat={messages})` proposes conversational changes. Accepted profiles use existing draft saving; combinations share `BrainPreviewTopicOrganization` and `BrainChangeTopicReview`, revision checks, recovery, and structural undo. |

Directory replacement requires all pages with a stable total and unique canonical IDs.
Failures preserve loaded rows, and reconciliation preserves edits and deletions made
while a request was pending. Partial task and room pages retain explicit coverage.
No idle collection polling or window-focus reload runs. Input debounce and active
job/run observation remain. Global routes and search load their own resources when
used; explicit Refresh and confirmed writes refresh only applicable caches.

Source ownership and run approval remain separate: completing a Work review task
does not approve or execute an agent tool. Run approvals retain their owning room.

Backend implementation references: `prerna/collaboration/BrainTopicUtils.java`,
`BrainTopicRoomUtils.java`, `WorkItemUtils.java`, `BrainTopicReviewUtils.java`,
`BrainTopicReviewAreas.java`, `BrainTopicReviewChat.java`, and their reactors under
`prerna/reactor/collaboration`. Pinned-room paging is implemented by
`GetPlaygroundRoomsReactor`, `GetUserConversationRoomsReactor`, and
`ModelInferenceLogsUtils.getUserConversations`.
