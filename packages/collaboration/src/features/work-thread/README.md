# Unified Work threads

New task opens a source-free chat at `/new`, with the Brief's greeting, suggested
questions, and a centered Playground composer. Suggestions populate an editable
draft without submitting. New and saved chats offer an agent dropdown and a
Settings menu for Chat settings and Advanced. Chat settings configure the agent,
model, additional instructions, temperature, knowledge, and tools; Advanced keeps
the existing context, usage, and compaction controls.
The first accepted send opens its saved thread route. Brief/Chat switching retains
the local session identity, draft and attachments. The daily context rail sits
beside chat on wide screens and opens through Your day on smaller screens; opening
the workbench replaces the rail. Source-free chats start with a closed, generic
workspace for settings, files, and tool results. Email readers and editors remain
available when explicitly opened through prompts or tool results. Topic scope,
model selection and send remain in the bottom toolbar. Loading, failed restoration,
and uncertain requests keep their existing recovery controls.

Source-backed Work threads host one `ThreadSession`, an assistant-only chat on the left, and an initially open workbench. Desktop starts at 30% chat / 70% workbench; the workbench starts with Emails (75%) beside Context (25%). Sources never interleave with assistant turns. Full formatted emails appear oldest-to-newest with a single compact subject/sender header. Reply, Forward, Outlook, More, and Collapse share one action group. Bodies and recipient details hide without unmounting, and Expand all / Collapse all also controls read-only draft previews. Thread gutters and gaps are 8px, with 16px message padding. Other source channels keep their native rendering in the source panel.

Emails and Context have independent find controls. The email pane combines search, oldest/newest ordering, and bulk disclosure in one compact toolbar. Counts live in the sort menu; read-only drafts stay after source messages in arrival order. Search preserves all items, navigates matching messages or context sections, and expands matched content. Email search includes formatted body text and is labeled Search loaded emails while older pages remain. Brain thread history uses 100-message pages and Load older emails; older pages preserve reading position, deduplicate by source ID, and retain access/ingestion rules. Older servers without continuation show an explicit limitation. This does not discover unlinked Outlook messages.

A compact thread header sits above chat only. It offers a chat collapse icon; the workbench toolbar keeps navigation and chat restore controls reachable when chat is concealed. Emails and Context close into their workbench rails with icon buttons and tooltips; the File menu restores either pane to its dock. Workbench panels collapse into border rails and retain their content state and column proportions. Available thread width below 1024px uses full-width Emails/Context tabs and Back to chat. Resizing restores the desktop arrangement. Readers, drafts, and other working tabs open in the main dock beside Context.

The composer is visible immediately. Fresh threads show the assistant composer; Outlook sources retain **Draft reply** after history restoration settles. Draft reply opens the retained reply editor and immediately generates a reply using the exact selected email, included thread context, and retained instructions. If the draft already has text, the same action revises its latest body. Thread/email menus use this workflow too. Generation awaits assistant initialization; progress, cancellation, clarification, and failures use the conversation. The draft editor contains only email fields, formatting, Save draft, and Send controls. **Reply** makes no assistant request, and **Open draft** only reopens the editor. Repeated clicks during generation do not submit again, and navigation requests are consumed once.

Thread rows, sidebar threads, and email cards share the action definitions used by their context menus. Thread rows retain their hover popover and visible actions button. Email readers use a click/keyboard dropdown containing Ask assistant, Draft reply, Delete email, and Copy email link when available. Reply, Forward, and Outlook stay in the header as icons with tooltips; the reader menu omits those duplicates and Open email. Thread actions apply to the owning thread; email-card actions carry that exact message identity and omit thread organization commands. Work-item commands require an associated item. “Reply” opens the manual editor. Navigation actions use validated, single-use requests, consumed only when source context and the assistant session are ready.

Thread visuals reuse the Work feed’s tinted person avatars and topic chips. The source header and Assistant identity use the theme’s primary color; draft and tool states pair semantic color with their existing labels. Direct-room message styling retains its existing defaults.

The assistant composer owns its rich document, queued files, and source attachment selection independently from email editors. `WorkComposerSession` retains each email editor by stable origin identity above the routes. Draft fields, formatting, attachments, errors, saved receipts, and pending or uncertain save locks survive panel closure and thread navigation during the app session. Reopening an origin or receiving source updates never reseeds local edits. Refreshing the browser or changing the owning application insight clears local state. Pending saves retain their originating thread session until completion and never clear another editor.

Source cards and locally authored draft cards are not tool executions. Manual local drafts and structured assistant proposals appear as full read-only email previews after the loaded source messages, in local arrival order. Workspace drafts use the same thread presentation and are deduplicated once opened locally. Each preview shows its draft state, participates in thread search and collapse, and opens its retained editor in a separate panel through **Open draft**. Editing updates the preview without replacing the editor or saving to Outlook. Completed proposals validate their body, included source identity, and any explicitly selected source. Ordinary response prose never creates an editor. One proposal identity survives live-to-durable response reconciliation without overwriting edits. Only a newly completed run observed in the current thread opens the editor automatically; restored history and background completions do not open panels. Older tool-created draft cards retain their tool status and approval controls. Reader and editor panels store only source/tool/draft identities and resolve content through live Work context. Opening a panel does not change source exclusions or assistant context.

The shared Work/Brain shell keeps its original dark top navigation bar in both themes. The main surface follows the selected theme, with subdued sidebar navigation, primary-tinted selection, and simple separators for overview sections. The thread uses a lightly muted canvas with background-colored heading and workbench surfaces. Its compact heading, transcript, and composer stay within the chat pane; the workbench uses the full workspace height. Full source emails and draft cards use the existing semantic surfaces and independent message actions.

Assistant conversation turns use opposing chat bubbles: user prompts align right with a primary-tinted background and foreground text, and Assistant replies align left with a neutral card background and subtle border. Work bubbles use readable body typography and contain wide Markdown, attachments, and tool content within the conversation pane. Tinted identities and Assistant author labels remain visible without chat timestamps. Each assistant response has a quiet, always-visible **Copy** action below its bubble. Copy combines visible response text, preserving Markdown and excluding reasoning and tool data. Keyboard and touch users can reach the action without hover. Ordinary tool rows retain their existing inline/workbench destinations. Direct-room message layouts retain their default presentation.

The composer is assistant-only, with a rounded container, restrained shadow, primary focus ring, selected-email strip, attachment selection, and existing footer actions.
Its adjacent model picker changes the model for future assistant turns. The assistant composer and workbench stay
mounted while the dock is concealed. The dock opens beside the conversation when
space permits, starting at 30% chat / 70% workbench. The resizable split persists while switching
panels and closing/reopening the dock within a thread. Below 1024px of available content
width, the panel uses the full width. One File dropdown stays at the left of the workbench’s top border, with Close workbench at the right. The bar is 32px high on desktop with 28px controls, and 48px on mobile with 44px touch targets. These controls belong to the thread’s workbench and stay in the same positions when switching panels. The conversation keeps its own title and navigation. The full-width layout keeps the menu visible and provides a labeled Back to chat action in that same workbench border. Closing returns focus to the invoking card or control.
The composer’s + menu opens Settings, Context, Files, Tools, and Activity directly.
The File menu lists Browse files, New file, New folder, Upload files;
Context, Tools, Activity, Settings; then Commands. Source-backed threads also list
Emails. It opens or selects existing panels
and opens the existing command palette. Creation and upload always start at the
thread’s root directory. File actions stay visible but disabled while thread files
are connecting. The menu does not list open items or offer selected-file actions.
Close workbench conceals the dock without discarding open panels or drafts.

## Backend integration

Sources, participant exclusions, goals, steps, and facts use the existing Brain and
Work reactors. Assistant conversations use collaboration rooms, persisted room options,
`RunAgent` as their only execution path, approvals, cancellation, and reconnect.

Before the first send, saving chat settings or selecting an agent updates the local
`ThreadSession` without creating a room or history entry. The first send persists
the selected configuration while preparing its room. Later settings changes update
that room's existing options and apply to future turns. Agent changes preserve
manual model, instruction, temperature, knowledge, and tool overrides.

Work uses the standard SEMOSS agent-run parameters and existing tool approval settings. Assistant instructions request local draft proposals for editor review; there is no Work-specific backend restriction on email tools or capability check before submission. Explicit editor saves remain normal connector requests outside assistant execution.

Presentation actions use completed, room-local tool results and the existing insight file APIs. PPTX workflow results must report an available, structurally validated artifact before file actions appear. The panel does not require additional run snapshot fields or backend changes; tools from child rooms retain their activity links without opening their files in the current room.

The assistant writes emails with the ComposeEmail tool (Semoss `WorkComposeEmailReactor`, tool component `email-compose`): `message` is the plain-text body, `replyTo` names the email a reply answers, and `openEmailId` names the open editor to update instead of opening a new one. Each chat request carries the open editor's current email as `openEmail`, edits included. A revision that arrives after the owner edited the email keeps their edits. A change to the open email passes only the fields that change; a reply's `to`/`cc` replace its native lists. `openEmail.status` is editing, saved, waiting, or sent.

The assistant sends with SendEmail (Semoss `WorkSendEmailReactor`, ask, component `email-send`), passing only `openEmailId`. The call pauses the run; `use-email-send-approvals.ts` binds it to that editor. The chat card shows Send and Don't send, and the editor's Send becomes the approval: the editor saves its email as a draft, then approves with `draftId`, so the server sends exactly that draft through the owner's mailbox (`prerna.collaboration.email`, Outlook today). Don't send rejects the call. Work rooms do not get the Microsoft SaveDraft, SendDraft or SendMail tools, so the model never picks a provider. Failed or cancelled current responses do not create editors, and mismatched replies show recovery guidance without saving.

Work assembles source context from the loaded thread and its participant/source
settings. Each assistant request includes that context in a `SEMOSS_WORK_CONTEXT_V1`
envelope. Settings → Advanced displays the next request's source material and the last
saved request snapshot. Context contains Summary, editable Action items, relevant
Presentation results, Key facts, and collapsed Sources controls.

Brain writes the Summary and generated Action items in the background
(`WorkSummarizeThread` / `WorkGetThreadInsights`, Semoss `WorkThreadInsights`,
Brain's text model `COLLAB_LLM_ENGINE_ID`). It never sends a chat turn, so the
assistant's room, conversation, and running task are untouched. A mail sync
queues every thread with new mail; opening a thread whose summary does not
cover its newest message runs it at once; Summarize and Regenerate force a new
one. Each run sees the tracked items, so generated ones are updated in place or
closed when a reply finishes them, and reading the same mail again adds nothing.
Untouched generated items it leaves out are removed. The owner's own items,
edited text, completions, and deleted generated items (kept as dismissed on the
server) are never rewritten or added back. Including or excluding a participant,
or changing a rule, makes the summary stale so the next open runs it again. The empty action row accepts
Enter and stays focused for another item. Topic editing and mute controls live
in Settings → Thread. Earlier requests remain in the room history. Usage and compaction in Settings → Advanced reuse existing room
operations; `/compact` opens this section. Compaction requires a settled run and a persisted assistant leaf, and locks
sending/settings until refreshed history is available. Settings drafts stay mounted
across panel changes and saved settings apply to future turns.

Work’s reply, forward, new-email, and local Open draft actions use the dedicated editor panel. The shared `EmailDraftForm` also serves existing dialog callers outside Work. Its compact envelope rows use 16px horizontal gutters, a lightly tinted formatting toolbar, a 192px minimum writing area, and a reachable save footer; desktop controls retain larger touch targets on coarse pointers. It preserves mode-specific fields, validation, reply-all disclosure, new-email attachments, and the existing formatting toolbar. Enter adds a line. Assistant proposals require activating **Save to Outlook**; typing shortcuts do not accept them. Existing non-Work/manual callers retain Ctrl/Cmd+Enter saving. Assistant attachments remain independent.
Receiving, editing, closing, and reopening a local proposal make no Outlook writes. Assistant tool execution follows the configured tool approval settings. Choosing **Save to Outlook** saves the current edited values through the existing connector API and never sends email.
Saving creates an Outlook draft through the existing APIs. Work disables **Save to Outlook** for an unchanged saved draft and labels subsequent edited submissions **Save new copy to Outlook**. Success offers **Open in Outlook**; persistent failures and uncertain-save recovery remain in the editor. Existing dialog callers share the retained editor and inline failure recovery.
**Send** is a separate explicit action: it saves reviewed changes and sends the
returned draft identity. Uncertain sends lock editing until an Outlook check,
and retry the same identity. Keyboard submission saves only.

The reader reuses sanitized, sandboxed email rendering without the inline height clamp. Original formatting, blocked remote images, plain-text fallback, recipient details, attachment references, missing-content recovery, and Open in Outlook remain available. Repeated card clicks select the existing tab. Reader panels open in response to user actions. New, completed general-chat draft proposals also reveal their retained editor once. Editor-targeted revisions stay in their originating editor.

Email readers, Outlook source previews, and draft previews share a subject and sender header with expandable To/Cc details. HTML keeps its light canvas and sender-authored styling; remote images still require consent for each message. Compose forms use a single scrolling area and a separate save footer. Address rows share a compact envelope layout: From identifies the Outlook account, recipients are editable/removable chips, and native replies use a Reply / Reply all selector with source-sender context. Every recipient keystroke remains in the retained form, including text not yet committed to a chip. New drafts reveal Cc/Bcc on demand, automatically showing populated or invalid fields. Essential formatting stays visible; **More formatting** reveals advanced controls without replacing the editor or its undo history. Attachments use consistent file rows and an **Attach files** action.

In short windows, the whole compose form scrolls together so the editor and save action remain reachable. The normal-height layout keeps the Save draft / Send footer visible beside the scrolling work area.

## Validation

Run `pnpm --filter @semoss/collaboration test`,
`pnpm --filter @semoss/collaboration type-check`, and
`pnpm --filter @semoss/collaboration build` with the repository's supported Node version.
Format/check changed TypeScript files with Biome. Verify the composer, context panel,
and workbench using isolated fixtures without sending live messages. Cover both themes at 360px, 1440px, wider desktop, and 200% zoom; inspect fresh threads, streaming, excluded sources, long content, proposal review, saved/failed drafts, and full-width workbench navigation.

## Reply assistant

Each retained reply has independent generation state and a pending suggestion. Existing retained instructions still accompany requests. Work submits the latest plain-text body (including line boundaries and link destinations), source identity, local draft identity, request identity, and body revision in the existing Work context envelope. The selected model and existing tool approval settings remain authoritative. Unsent chat text, files, and source attachments are preserved.

A draft-owned observer retains the thread session until completion, even after navigation. Only the matching request's completed, validated proposal can update the body; recipients and Reply/Reply all are untouched. **Draft reply** revises the current edited body, defaulting to clearer, more concise wording when no retained instruction is present. Clarification questions, failures, Stop, and reconnect use the conversation. Choose **Draft reply** again to retry. This does not introduce another run transport or Outlook write path.

AI replacements are individual editor history transactions. The normal editor **Undo** restores prior content. Newer edits or a pending save prevent replacement and show recovery guidance in the conversation; another **Draft reply** action can retry using the current body. Background results never open a panel or move focus. General-chat proposals keep their existing cards and history restoration, while editor-targeted revisions never create extra draft tabs or cards. Draft and instruction retention remains application-session-only.
