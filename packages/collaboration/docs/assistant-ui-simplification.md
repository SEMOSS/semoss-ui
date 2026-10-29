# Collaboration: a calmer daily assistant

Reviewed and implemented locally on 2026-10-14. The product goal is to help the owner focus, prepare work, and receive timely nudges with little upkeep.

## Starting point and design constraints

The checkout already contained the recent simplification work on `feat-collaboration-today`, at `982e0ad26`. This pass starts there on `feat-collaboration-calm-assistant`, preserving that work. It does not reset the checkout to the older local `dev` branch.

The Teamwork wiki's menu reduction plan (2026-10-12) and decisions D14/D15 (2026-10-13) establish the accepted direction: centered Today, an ask box first, a maximum of five tasks, plain topic context, quieter management, and Petrona/Hanken typography. The initialized SEMOSS knowledge wiki was consulted through OpenKnowledge MCP. Its architectural claims were treated as documentation, with current source and Chrome used to verify behavior.

The implementation uses existing shared UI primitives and tokens. Centering, typography, topic colors, source readers, permissions, transport, and scheduler contracts retain their existing owners.

## Audited flow and implemented changes

1. **Arrive on Today.** The composer displayed both assistant and model selectors, plus a disabled prompt optimization action before anything was typed. The model name and configuration compete with the owner's question. The compact composer now shows one Assistant options control; assistant and model selection remain inside its popover. Optimization appears after typing. Attachments, dictation, sending, and busy-state protections remain available.
2. **Scan the next work.** Today previously revealed three tasks, then required Show two more to reach the already bounded five-task list. All five now render immediately. The full queue remains under See everything. A row keeps its primary action, Done, and overflow. Real summaries or draft text get a one-line preview; longer context and classification reasons stay under Show details. Generic classifier labels are not used as a summary. Review reply appears only when a draft exists; otherwise the conversation action is Open.
3. **Find an existing chat.** The sidebar previously rendered the loaded archive and automatically fetched additional pages. It now starts with five recent chats and also retains an older active chat. All chats reveals the archive and enables pagination; Show recent chats restores the short view. Collapse, current selection, scroll retention, loading, and retry behavior remain intact.
4. **Open a source conversation.** An imported email opened beside an assistant pane claiming a fresh start with no previous conversation included, even though the source file was attached. That empty state now identifies the email or chat, shows existing thread context when available, and names the saved source file. It explains how the assistant can help without claiming an analysis has already run. The source reader remains accessible beside the assistant.
5. **Set up repeat assistance.** Routines previously opened with all schedule fields and repeated explanatory content. The default view now summarizes days, time, time zone, and inbox limit. Change schedule reveals the complete form. Fields stay registered while hidden, and validation errors reveal and focus the relevant field. Enable plus Save still provides deliberate opt-in. Duplicate explanation was removed, while next-run status and the routine's read-only email scope stay visible. Service guidance using the former Brain navigation label now says Settings.
6. **Understand calendar availability.** Your day previously displayed 0 meetings alongside a Microsoft sign-in requirement. It now shows counts, events, and the free-day message only when the calendar is enabled and a successful snapshot is available. An unavailable calendar is not represented as an empty day.

Topic pages, work filters, and Settings were inspected alongside this flow. Recent topic simplification already moves filing and rules away from ordinary work. This pass concentrates on daily use and avoids adding another navigation structure.

## Next priorities for an assistant that earns attention

These are follow-up product and integration work, not implemented or proven by this frontend pass.

| Priority | Product behavior | Acceptance boundary |
| --- | --- | --- |
| 1 | Put the latest prepared brief on Today, with what changed, a few next actions, and source links. | Only show a brief after a successful run; preserve timestamp and partial-source availability. Reuse the Routines result rather than inventing a second inbox. |
| 2 | Editable source starting points are now implemented in the desktop conversation pass. Continue toward useful generated results. | Source and typed drafts are retained; selecting a starting point does not submit. A prepared reply still requires an actual generated result and review. |
| 3 | Nudge for a real deadline, unanswered commitment, or upcoming meeting. | Include why now, the source, one action, Later, and quiet hours. Test duplicate suppression and stale-source recovery. Measure useful actions and dismissals. |
| 4 | Reduce filing upkeep through suggested topic links and remembered preferences. | Learn from confirmed choices; request correction only for uncertain, consequential changes. Keep explanations and undo close to the action. |
| 5 | Keep recovery local to the affected source. | An unavailable connection should explain what is missing and offer one recovery link. General Settings badges should not turn every visit into a maintenance task. |

The fake inbox currently includes repeated subjects and sparse summaries. Meaningful previews depend on populated summary/draft data. UI changes alone do not establish proactive background processing, briefing quality, or real mailbox operation.

## Validation and practical limits

- Six focused Vitest suites passed: 95 tests across Today interactions, chat history, draft chat sessions, routines, thread menus, and transcript behavior. They cover completion, drafts and busy states, recent/archive access, older active chats, unavailable calendar states, and routine validation/save failures.
- The routine suite passed again after the final service-copy adjustment: 21 tests.
- Collaboration's production build passed and its built `dist` was loaded at the existing Tomcat URL. Vite still reports large bundle chunks; this pass does not address bundle performance.
- Source-only TypeScript checking passed. The full package type check is blocked by 13 existing missing-`messageId` errors in five unrelated test files: source-mapping, sources-view, use-sources, dashboard-selectors, and use-workspace-search. Those fixtures were left untouched.
- Focused Biome checks and `git diff --check` passed.
- Chrome verification covered Today, topic context, task details, the imported email reader and source-aware empty state, Settings, recent/all chats, populated model selection, typing-dependent optimization, and schedule disclosure. Keyboard activation and Escape dismissal were checked.
- Narrow viewport testing used a 360-by-800 override; this Chrome session's zoom produced a 288 CSS-pixel layout. Today and the collapsed/expanded routine form had no page-level horizontal overflow. Temporary viewport changes were reset.
- No email was sent, routine enabled, or live connection changed. Source navigation exercised the existing room import path, which can create a blank source chat. Browser checks establish local UI behavior; they do not establish generated-answer quality or a successful scheduled brief.

Screenshots and the visual audit are saved in the workspace task folder `AGENTS_TASKS/collaboration-design-2026-10-14/`. The Today before/after comparison uses the same 1382-by-724 viewport. Build and test logs are under `/private/tmp/collaboration-calm-*` for this local session.

The subsequent [Topic and All work review](topic-and-work-ui-review.md) implements optional topic context, work search, quieter rows, and narrow-screen fixes.

The [Desktop source conversation review](source-conversation-ui-review.md) implements editable starting points, readable queued source labels, and typing-dependent room optimization. Desktop is the owner's current priority.
