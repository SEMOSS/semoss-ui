# Unified Work threads

Work threads host one `ThreadSession` and one chronological conversation scrollbar. Outlook messages are compact email cards; clicking a card opens the full formatted message in a dedicated reader tab. Assistant messages remain ordinary chat messages with their existing tools and response actions. Email → assistant → email remains in that order. Other source channels retain their native message rendering.
Fresh threads show **Ask Assistant** and, for an Outlook source, **Draft with assistant** after history restoration settles. Draft with assistant opens the retained reply editor and immediately generates a reply using the exact selected email, included thread context, and retained instructions. If the draft already has text, the same action revises its latest body. Thread/email menus use this workflow too. Generation awaits assistant initialization; progress, cancellation, clarification, and failures use the conversation. The draft editor contains only email fields, formatting, and saving controls—no assistant section or revision options. **Write reply yourself** makes no assistant request, and **Open draft** only reopens the editor. Repeated clicks during generation do not submit again, and navigation requests are consumed once.

Thread rows, sidebar threads, and email cards share the action definitions used by their context menus. A hover popover and visible actions button support pointer, keyboard, and touch. Thread actions apply to the owning thread; email-card actions carry that exact message identity, offer message-specific reading/reply/forward actions, and omit thread organization commands. Work-item commands require an associated item. “Write reply yourself” opens the manual editor. Navigation actions use validated, single-use requests, consumed only when source context and the assistant session are ready.

Thread visuals reuse the Work feed’s tinted person avatars and topic chips. The source header and Assistant identity use the theme’s primary color; draft and tool states pair semantic color with their existing labels. A small decorative welcome illustration appears only after history confirms an idle, fresh thread and disappears when Assistant opens or activity resumes. Direct-room message styling retains its existing defaults.

The assistant composer owns its rich document, queued files, and source attachment selection independently from email editors. `WorkComposerSession` retains each email editor by stable origin identity above the routes. Draft fields, formatting, attachments, errors, saved receipts, and pending or uncertain save locks survive panel closure and thread navigation during the app session. Reopening an origin or receiving source updates never reseeds local edits. Refreshing the browser or changing the owning application insight clears local state. Pending saves retain their originating thread session until completion and never clear another editor.

Source cards and locally authored draft cards are not tool executions. Manual local drafts appear above the assistant composer. Structured assistant proposals create retained editors and an **Open draft** card beside the originating response. Completed proposals validate their body, included source identity, and any explicitly selected source. Ordinary response prose never creates an editor. One proposal identity survives live-to-durable response reconciliation without overwriting edits. Only a newly completed run observed in the current thread opens the editor automatically; restored history and background completions do not open panels. Older tool-created draft cards retain their tool status and approval controls. Reader and editor panels store only source/tool/draft identities and resolve content through live Work context. Opening a panel does not change source exclusions or assistant context.

The shared Work/Brain shell keeps its original dark top navigation bar in both themes. The main surface follows the selected theme, with subdued sidebar navigation, primary-tinted selection, and simple separators for overview sections. The thread uses a lightly muted canvas with background-colored heading and workbench surfaces. Its heading, transcript, local draft tray, and composer share a centered `max-w-3xl` column with padding that responds to the conversation pane’s width. Source emails and draft cards share rounded borders, spacing, and hover/focus treatment; email-card actions remain independently accessible beside the opening action.

Assistant conversation turns use opposing chat bubbles: user prompts align right with a primary-tinted background and foreground text, and Assistant replies align left with a neutral card background and subtle border. Work bubbles use readable body typography and contain wide Markdown, attachments, and tool content within the conversation pane. Tinted identities and Assistant author labels remain visible without chat timestamps. Each assistant response has a quiet, always-visible **Copy** action below its bubble. Copy combines visible response text, preserving Markdown and excluding reasoning and tool data. Keyboard and touch users can reach the action without hover. Ordinary tool rows retain their existing inline/workbench destinations. Direct-room message layouts retain their default presentation.

The composer is assistant-only, with a rounded container, restrained shadow, primary focus ring, selected-email strip, attachment selection, and existing footer actions.
Its adjacent model picker changes the model for future assistant turns. The assistant composer and workbench stay
mounted while the dock is concealed. The dock opens beside the conversation when
space permits, starting at 60% chat / 40% panel. The resizable split persists while switching
panels and closing/reopening the dock within a thread. Below 768px of available content
width, the panel uses the full width. One Workspace dropdown stays at the left of the workbench’s top border, with Close workbench at the right. The bar is 32px high on desktop with 28px controls, and 48px on mobile with 44px touch targets. These controls belong to the thread’s workbench and stay in the same positions when switching panels. The conversation keeps its own title and navigation. The full-width layout keeps the menu visible and provides a labeled Back to conversation action in that same workbench border. Closing returns focus to the invoking card or control.
The composer’s + menu opens Settings, Context, Files, Tools, and Activity directly.
The Workspace menu always lists Browse files, New file, New folder, Upload files;
Context, Tools, Activity, Settings; then Commands. It opens or selects existing panels
and opens the existing command palette. Creation and upload always start at the
thread’s root directory. File actions stay visible but disabled while thread files
are connecting. The menu does not list open items or offer selected-file actions.
Close workbench conceals the dock without discarding open panels or drafts.

## Backend integration

Sources, participant exclusions, goals, steps, and facts use the existing Brain and
Work reactors. Assistant conversations use collaboration rooms, persisted room options,
`RunAgent`, approvals, cancellation, and reconnect.

Deploy the backend review-policy support before enabling assistant runs. Work verifies `GetWorkDraftCapabilities` (`draftReviewVersion: 1`) before submission and fails closed on older servers. Each Work run passes the optional `requireEmailDraftReview` parameter; the SEMOSS harness enforces it for tool execution, direct Outlook write reactors, and inherited child runs. It is stripped before model-provider requests. Protected runs cannot use an unsupported harness. The explicit editor save remains a normal connector request outside assistant execution. Other run callers retain their defaults.

Work instructions request exactly one fenced `semoss-email-draft` JSON proposal with `sourceMessageId` and a plain-text `body`. Serialized proposal markup is hidden from the conversation display, including during streaming. Failed or cancelled current responses do not create editors. Malformed or mismatched proposals show recovery guidance without saving.

Work assembles source context from the loaded thread and its participant/source
settings. Each assistant request includes that context in a `SEMOSS_WORK_CONTEXT_V1`
envelope. The context panel displays the next request's source material and the last
saved request snapshot. Earlier requests remain in the room history. Usage and compaction reuse existing room
operations. Compaction requires a settled run and a persisted assistant leaf, and locks
sending/settings until refreshed history is available. Settings drafts stay mounted
across panel changes and saved settings apply to future turns.

Work’s reply, forward, new-email, and local Open draft actions use the dedicated editor panel. The shared `EmailDraftForm` also serves existing dialog callers outside Work. It preserves mode-specific fields, validation, reply-all disclosure, new-email attachments, and the existing formatting toolbar. Enter adds a line. Assistant proposals require activating **Save to Outlook**; typing shortcuts do not accept them. Existing non-Work/manual callers retain Ctrl/Cmd+Enter saving. Assistant attachments remain independent.
Generating, editing, closing, and reopening a proposal make no Outlook writes. Choosing **Save to Outlook** saves the current edited values through the existing connector API and never sends email.
Saving creates an Outlook draft through the existing APIs. Work disables **Save to Outlook** for an unchanged saved draft and labels subsequent edited submissions **Save new copy to Outlook**. Success offers **Open in Outlook**; persistent failures and uncertain-save recovery remain in the editor. Existing dialog callers retain their current toast feedback. No email sending behavior changes.

The reader reuses sanitized, sandboxed email rendering without the inline height clamp. Original formatting, blocked remote images, plain-text fallback, recipient details, attachment references, missing-content recovery, and Open in Outlook remain available. Repeated card clicks select the existing tab. Reader panels open in response to user actions. New, completed general-chat draft proposals also reveal their retained editor once. Editor-targeted revisions stay in their originating editor.

Email readers, Outlook source previews, and draft previews share a subject and sender header with expandable To/Cc details. HTML keeps its light canvas and sender-authored styling; remote images still require consent for each message. Compose forms use a single scrolling area and a separate save footer. Address rows share a compact envelope layout: From identifies the Outlook account, recipients are editable/removable chips, and native replies use a Reply / Reply all selector with source-sender context. Every recipient keystroke remains in the retained form, including text not yet committed to a chip. New drafts reveal Cc/Bcc on demand, automatically showing populated or invalid fields. Essential formatting stays visible; **More formatting** reveals advanced controls without replacing the editor or its undo history. Attachments use consistent file rows and an **Attach files** action.

In short windows, the whole compose form scrolls together so the editor and save action remain reachable. The normal-height layout keeps the single-action save footer visible beside the scrolling work area.

## Validation

Run `pnpm --filter @semoss/collaboration test`,
`pnpm --filter @semoss/collaboration type-check`, and
`pnpm --filter @semoss/collaboration build` with the repository's supported Node version.
Format/check changed TypeScript files with Biome. Verify the composer, context panel,
and workbench using isolated fixtures without sending live messages. Cover both themes at 360px, 1440px, wider desktop, and 200% zoom; inspect fresh threads, streaming, excluded sources, long content, proposal review, saved/failed drafts, and full-width workbench navigation.

## Reply assistant

Each retained reply has independent generation state and a pending suggestion. Existing retained instructions still accompany requests. Work submits the latest plain-text body (including line boundaries and link destinations), source identity, local draft identity, request identity, and body revision in the existing Work context envelope. The selected model and backend review policy remain authoritative. Unsent chat text, files, and source attachments are preserved.

A draft-owned observer retains the thread session until completion, even after navigation. Only the matching request's completed, validated proposal can update the body; recipients and Reply/Reply all are untouched. **Draft with assistant** revises the current edited body, defaulting to clearer, more concise wording when no retained instruction is present. Clarification questions, failures, Stop, and reconnect use the conversation. Choose **Draft with assistant** again to retry. This does not introduce another run transport or Outlook write path.

AI replacements are individual editor history transactions. The normal editor **Undo** restores prior content. Newer edits or a pending save prevent replacement and show recovery guidance in the conversation; another **Draft with assistant** action can retry using the current body. Background results never open a panel or move focus. General-chat proposals keep their existing cards and history restoration, while editor-targeted revisions never create extra draft tabs or cards. Draft and instruction retention remains application-session-only.
