# Topic and All work UI review

Implemented locally on 2026-10-14 on `feat-collaboration-calm-assistant`, following the daily assistant simplification. The objective is to let the owner work immediately, with topic upkeep available when useful.

## Product decisions

The Teamwork menu reduction plan and topic decisions D14/D15 were checked against the current source and populated Chrome UI. This pass keeps the accepted typography, colors, plain context sections, shared work commands, and combined status/order/source filter. It changes when context is presented and reduces repeated row details.

1. **Topic actions — improved.** A topic without goals opens with its work list across the available width. Empty goals, suggested people, keywords, and account configuration no longer dominate the initial view. Context is one explicit disclosure. Topics with saved goals retain visible context by default, so an existing outcome is not hidden.
2. **Topic context — improved.** Context remains mounted while collapsed, preserving its local state. Goals stay first, then People and Assistant. Status and kind/account controls move into Topic settings within Context. Sample and non-active status badges remain visible in the header. Existing descriptions remain directly editable; a topic without a description no longer starts with an Add a description chore.
3. **Source threads — improved.** Opening a conversation remains the main action. Removing its topic link moves into the existing thread menu. This uses the same command and does not delete the source thread. Open action replaces the vague For you label; waiting, suggested, ignored, automated, and sample states remain visible. Summaries are bounded to two lines with the full conversation available on opening.
4. **Topic chats — clearer.** The tab explains that chats may start here or from the topic's threads. Its empty state describes the history loaded so far and points to Ask assistant. The checked-history count, pagination, loading, and errors remain available; an empty loaded page is not treated as proof that no linked chat exists anywhere.
5. **All work — improved.** Find work searches the current status and source by title, subject, sender, topic, and summary. Multiple words narrow results together; matching is case-insensitive. The selected source is retained while searching. Clear search and Escape restore the full current view and keep focus in the field. Empty results offer Clear search locally.
6. **Work rows — quieter.** Sender, source, genuine urgency, due date, urgent status, suggestions, and excluded-participant count stay visible. Repeated classification explanations and message count move under Show details in the existing menu. Source summaries remain the preview. The conversation link says Open or Review follow-up because it opens the room; it does not claim that a reply or nudge is already prepared. Done, recovery, snooze, no-response, and ignore commands keep their existing behavior.
7. **Small screens — improved.** Dates and overflow controls wrap rather than squeeze a work title into a narrow column. Open and Done stay visible below the medium breakpoint, as well as on coarse pointers. When Context is below the viewport, opening it moves focus and scroll directly there. Its narrow-layout close control returns focus to the header and work.

All work continues to default to Needs you. Open includes FYIs, while Waiting, Handled, and Snoozed remain in the existing filter. Status and source menu counts describe the full available view; the trigger count describes the rows matching the active search. Search stays local and does not fetch more mail or change classification.

## Verification

- 57 focused Vitest tests pass across Work composition, topic routes, goals, topic thread rows, thread menus, and topic chat associations. Coverage includes multi-topic scope, source/status preservation, search recovery and focus, context disclosure and focus return, goal outcomes, topic unlinking, loading/pagination, and classification details. A stale goal presentation assertion was aligned with the current readable, non-struck-through goal design.
- The test run still emits React/Radix act warnings in a search interaction and the existing route hydration warning. Assertions pass; these warnings are not represented as a clean, warning-free test run. Chrome independently verifies the affected focus behavior.
- Production Collaboration build passes and the generated dist is served by the existing local Tomcat URL. Large-chunk warnings remain.
- Source-only TypeScript checking passes. The complete package check has 13 pre-existing missing-messageId errors in five untouched test files: source-mapping, sources-view, use-sources, dashboard-selectors, and use-workspace-search. Touched test files introduce no additional TypeScript errors.
- Focused Biome and whitespace checks pass.
- Populated Chrome checks cover Topic actions, context open/close, Threads, Chats, All work, text search, no-match recovery, Escape, classification details, and focus return. Screenshots compare the same 1382-by-724 desktop viewport. Reflow checks cover 360 and 320 CSS pixels; no page-level horizontal overflow was observed. The session zoom requires larger viewport override dimensions to produce those CSS widths. The override is reset afterward.
- A 288 CSS-pixel check first exposed the date/title squeeze and below-list context problem; both were fixed. A malformed narrow screenshot after scrolling was rejected, and a valid 360 CSS-pixel capture replaced it in the report.
- This is local frontend verification with the supplied fake data. No email was sent, topic deleted, membership changed, or routine enabled through Chrome. Browser verification does not establish real-device touch or screen-reader compliance, generated-answer quality, or successful proactive mailbox processing.

Detailed before/after captures and observations are saved in the workspace under `AGENTS_TASKS/collaboration-design-2026-10-14/topics-and-work/`.

## Next product priorities

- Populate useful source summaries and action titles. Several fake records have duplicated subjects or no summary; opening them is still needed to learn the actual ask. UI trimming cannot create missing evidence.
- Group related asks carefully while preserving each source and independent completion state. Similar subjects alone are insufficient to merge work.
- Reduce suggested filing questions through confidence and remembered corrections. The current suggested-topic Yes/No controls are retained per D14; moving them into a quiet correction flow needs agreed product and backend behavior.
- Make nudges depend on an actual deadline, unanswered commitment, fresh source, or upcoming meeting, with a reason, one action, Later, and quiet hours. Classification urgency labels alone are insufficient to prove a timely nudge.
- Keep saved goals visible as meaningful outcomes, and let the assistant maintain context from work with explicit source evidence. Manual membership and keyword setup should remain optional assistance, not an onboarding checklist.
