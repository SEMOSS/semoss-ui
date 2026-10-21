# Desktop source conversation review

Implemented locally on 2026-10-14 on `feat-collaboration-calm-assistant`. The owner clarified that desktop is the current priority. This pass follows the Today, Topic, and All work improvements and concentrates on getting from reading a source to asking for useful help.

## Decisions and behavior

The populated Chrome email flow already has a useful resizable reader beside the assistant. Preserve that workbench rather than adding another page or a wizard. The remaining friction was an empty assistant pane requiring the owner to compose a request, a repeated technical source filename, and a disabled optimization control before any text existed. Teamwork's menu reduction plan and decisions D14/D15 support keeping work primary and presenting setup only when useful.

1. **Start working — improved.** A newly opened email or Teams conversation offers Summarize, Next steps, and Draft reply directly above the editor. Each fills an editable request and focuses the editor. It never submits a model request or sends an email. The reply request asks for a reviewable draft and flags missing decisions; next steps asks for explicit deadlines and unclear information.
2. **Keep the owner's words — protected.** Starting points appear only while the editor is empty, source history has loaded, no turn exists yet, and the saved source file is still queued. They disappear during typing, stay disabled during submission or an active run, and never replace an existing draft. Calendar/task sources do not get a reply shortcut intended for communication threads. Existing rich editor, attachment, failure, and session-owned draft lifecycles remain in place.
3. **Show useful source context — quieter.** The queued source is labelled Email thread or Teams conversation. Its exact filename remains available in the title and accessible removal control; additional files retain their filenames. Removal still only changes the next-message queue and does not delete the saved source. The redundant filename paragraph is removed from the welcome area; existing summary text remains when available.
4. **Reveal controls when relevant — quieter.** Room prompt optimization appears once text exists. Revert and in-progress optimization remain available. Model choice, dictation, upload/panel access, cancellation, and Send keep their existing behavior. Other composer consumers retain their current defaults.
5. **Read and work side by side — retained.** The existing desktop split, source readers, topic links, and resizable dock remain. Closing/reopening the reader retains the editable request and queued source. No persisted pane proportions are reset.

## Verification and limits

- 82 focused tests pass across the real composer, context-file queue, workspace, transcript, and conversation shell. New coverage verifies explicit Send, editable text and focus, draft preservation, attachment preservation, blocked starting points, readable labels with exact removal paths, and source/history/queue gating.
- The 12 workspace tests pass again after adding the calendar-source restriction.
- Source-only TypeScript checking passes. The full package check still reports the same 13 missing-messageId errors in five unrelated test files; touched files add no errors.
- Production Collaboration build passes and is served from the existing local Tomcat URL. The existing large-bundle warnings remain.
- Focused Biome and whitespace checks pass. Touched UI files were reviewed against the repository React, accessibility, SDK chat, and design guidance.
- User Chrome verifies email and Teams empty source states, keyboard activation of Draft reply, editable text, focus transfer, starting-point dismissal while typing, optimization visibility, and draft preservation across reader closure/reopening. Actual measured desktop widths are 1382 and 1440 CSS pixels. A brief 360 CSS-pixel regression check confirms no page-level horizontal overflow and reachable starting points after Back to conversation. The temporary viewport override is reset. The existing resizable layout clamped to 50/50 during that check; keyboard resizing restored the captured desktop 35/65 proportions before handoff.
- This is light-theme local frontend verification with the supplied fake data. Dark theme and 200% zoom were not manually exercised in this pass. Submission/failure/busy behavior is covered by tests, not a new live assistant run. No model request, email send, source deletion, routine opt-in, or connection change was performed through Chrome. Opening the source uses the existing import flow and can create an empty source chat.

## Next desktop priorities

The next substantial gain is better information, not more controls. Today and All work should show a concise action summary when one actually exists, with source and freshness. A prepared brief belongs on Today only after a successful routine run, with partial-source availability visible. Deadline and commitment nudges should explain why now, offer one useful action and Later, and suppress duplicates. Current sample subjects and sparse summaries cannot establish those behaviors. Generated replies still need actual generation and review; this pass provides the editable starting request.

The source reader's long quoted email chain and the narrow conversation title are further desktop review candidates. Preserve a route to the full source and user-resized pane proportions when refining those. Topic suggestions should learn from confirmed corrections before asking the owner to perform repeated filing work.

The visual comparison and flow captures are in `AGENTS_TASKS/collaboration-design-2026-10-14/desktop-flow/` in the enclosing SEMOSS workspace.
