# Collaboration gaps

This is the sole gap list for the current topic-oriented frontend integration.
Contracts were checked against the local backend source on 2026-10-09. No backend
changes, dependencies, SDK APIs, or replacement screens are included.

## Backend capability boundaries

- [ ] Topic-filtered review questions: `BrainListReview` has no topic filter.
  The global Brain review page loads it on demand. Topic pages can show relevant
  already-loaded records without treating them as complete topic coverage.
- [ ] Topic-filtered delegations: the assigned-delegation read has no topic
  filter. Do not scan every agent or every room to fill a topic’s attention panel;
  existing run approvals remain owned by the conversation.
- [ ] Topic-room pin status: `BrainListTopicRooms` does not return a pin flag.
  Use confirmed pin writes, explicit room metadata, or complete pinned-directory
  coverage. With only a partial pinned page, an unobserved room’s pin state stays
  unknown and its pin control stays disabled.
- [ ] Standalone topic tasks: `WorkCreateItem` requires a valid source thread.
  Keep topic-only creation disabled; existing direct/source-less tasks can still
  be read and updated by ID.
- [ ] Saved manual ordering and goal ranking: no durable position, primary goal,
  goal relevance, or goal-based ranking contract exists. Keep arbitrary reorder
  disabled and retain supported priority updates.
- [ ] Topic activity history: last-activity timestamps are not a paginated event
  feed. Existing delete/merge undo does not supply unified actor/event history;
  keep the timeline unavailable.
- [ ] Thread-goal persistence: `WorkSetThreadGoal` does not exist. The call is
  removed and the existing goal editor remains disabled; do not imply a local
  edit was persisted.
- [ ] Individual source-thread metadata: `BrainListThreads` has topic filtering
  but no `threadId` argument. A cold source deep link uses a known task’s topic
  where available, otherwise the on-demand cached thread directory before import.
- [ ] Saved onboarding chat history: `BrainTopicReviewChat` accepts the current
  conversation and returns proposals but does not persist its transcript. The
  assistant conversation lasts for the open review; accepted edits are saved.
- [ ] Background room classification completion: the backend classifies topics
  after a chat run without a completion event for the association read. Use
  **Refresh room topics** to see delayed classifications; do not poll collections.
- [ ] Reach previews are limited to 60 selected people by the backend. Larger
  selections remain editable and saveable; the preview explains its limit without
  showing an invented or truncated total.

## Verification

- [ ] Verify the new contracts on the intended deployed server. The local Tomcat
  `webapps/Monolith/WEB-INF/classes` now contains the room association, area,
  reach-preview, and review-chat reactor classes after the Monolith update.
  Class presence does not confirm deployed registration or authenticated response
  shapes. The available browser session reaches sign-in.
- [ ] Inspect affected users’ actual `BrainListTopics` responses. No individual
  user’s response was inspected; the frontend status filtering and indirect
  discovery defects are independently verified in source and regression tests.
- [ ] Complete authenticated visual checks at narrow and desktop widths,
  200% text size, 400% zoom, both themes, and long content, plus real-device
  screen-reader checks. The current development preview reaches
  sign-in; changed topic/room controls could not be inspected in that session.
  Component tests cover keyboard tab/link activation, room-picker dismissal/focus
  return, area-control and review-chat focus recovery, and sidebar pagination focus. Responsive classes and loading/error
  layouts were reviewed in source; visual checks are not claimed as passed.

Automated validation completed with Node 24.4.0 and pnpm 10.13.1: all 1,314 tests
across 162 package test files pass, package type-check and production build pass,
and focused Biome checks pass on all 87 changed TypeScript files. The production
build retains its large-chunk warnings. Regression coverage
includes suggested-only and multi-page directories, partial/failing reads,
concurrent edits, scoped cached revisits, targeted invalidation, no idle timer/focus
network refresh, room pagination and unknown pin state, direct association changes
and directory misses, topic-chat retries, pending topic-map recovery, area changes,
people searches and limits, reach previews, review-chat proposals, grouping and
impact previews, undo, staged fields, revision conflicts, failed-write recovery,
and skipped-area receipts. Tests use contract fixtures; no live messages,
approvals, or backend deployments were performed for verification.
