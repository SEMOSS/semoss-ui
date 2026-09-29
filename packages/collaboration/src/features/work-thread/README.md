# Unified Work threads

Work threads host one `ThreadSession` and one conversation scrollbar with separate, independently collapsible Email (or Teams) and Assistant conversation sections. Only consecutive entries of the same kind share a section: email → assistant → email stays in that order. Each section starts expanded, retains its collapse state as new messages append, and keeps its contents mounted while hidden.
Fresh threads show **Ask Assistant** and, for an Outlook source, **Draft** below the original conversation after history restoration settles. The editor and assistant empty-state prompt remain concealed until a destination is selected. Actions only reveal and focus the editor; submitting or saving remains explicit. Existing assistant history and active runs resume automatically, and loading failures retain their recovery controls.

The selected mode, rich document, queued local files, and selected source attachments are retained per thread in memory above the routes. Returning within the same app session restores unfinished work without stealing focus. Refreshing the browser or changing the owning application insight clears this local state; persisted assistant history still loads normally. This state is independent of idle chat-session eviction. Pending and uncertain Outlook draft saves retain their locks across navigation. Successful operations clear only their originating composer; failures preserve content and recovery information.

The page uses Work’s grey background with tinted source sections and neutral assistant sections, all at the same level in the timeline. Assistant prose, prompts, and reasoning use compact typography while native email formatting is preserved. Each assistant response has a quiet, always-visible **Copy** action below its content. The action stays in the document flow, so hovering or focusing a response never covers another message. Copy combines visible response text, preserving Markdown and excluding reasoning and tool data; code blocks retain their own utilities. Keyboard users reach Copy in the natural tab order after response links and controls; touch users can copy with one tap. Successful copying briefly shows **Copied** and announces confirmation. Tool rows retain the existing inline/workbench destinations, using a **Details** label for the workbench and a vertical chevron for inline expansion. The composer’s destination dropdown switches between Ask Assistant and Draft without losing text or queued files.
Its adjacent model picker changes the model for future assistant turns. The assistant composer and workbench stay
mounted while the dock is concealed. The dock opens beside the conversation when
space permits, starting at 60% chat / 40% panel. The resizable split persists while switching
panels and closing/reopening the dock within a thread. Below 768px of available content
width, the panel uses the full width. File, View, and Close workbench stay visible in the
top workbench border on desktop and mobile; there is no explicit Expand action.
The composer’s + menu opens Settings, Context, Files, Tools, and Activity directly;
the compact View menu opens or selects those fixed panels first, then lists open
files, followed by tool results and runs. The selected panel is marked, and Commands
opens the existing command palette from the end of View. The separate File menu
offers Browse files, New file/folder, Upload, Save, Download, and Refresh. Creation starts in the active folder or file’s parent
directory, otherwise the thread’s root. Downloads use the saved server version;
refreshing a modified file requires confirmation. Close workbench conceals the
dock without discarding open panels or drafts.

## Backend integration

Sources, participant exclusions, goals, steps, and facts use the existing Brain and
Work reactors. Assistant conversations use collaboration rooms, persisted room options,
`RunAgent`, approvals, cancellation, and reconnect.

Work assembles source context from the loaded thread and its participant/source
settings. Each assistant request includes that context in a `SEMOSS_WORK_CONTEXT_V1`
envelope. The context panel displays the next request's source material and the last
saved request snapshot. Earlier requests remain in the room history. Usage and compaction reuse existing room
operations. Compaction requires a settled run and a persisted assistant leaf, and locks
sending/settings until refreshed history is available. Settings drafts stay mounted
across panel changes and saved settings apply to future turns.

The composer shares a retained rich editor across modes and saves HTML reply drafts through the native reply reactor.
Enter adds a line in draft mode; Ctrl/Cmd+Enter saves. Unconfirmed saves require checking Outlook before retrying.
The composer saves to Outlook drafts; it does not send email. Its compact formatting toolbar groups history, styles, text formatting, alignment, lists, and insertion controls. Icon buttons have tooltips and accessible names, with table editing available from a contextual menu.
Queued attachments are retained across modes and must be removed before saving a draft; they can be added in Outlook.
The context panel retains the full reply, forward, and new-email draft dialogs. Saved drafts can be opened in Outlook. Assistant attachments and isolated
file downloads use the existing source attachment workflow.

## Validation

Run `pnpm --filter @semoss/collaboration test`,
`pnpm --filter @semoss/collaboration type-check`, and
`pnpm --filter @semoss/collaboration build` with the repository's supported Node version.
Format/check changed TypeScript files with Biome. Verify the composer, context panel,
and workbench at desktop and narrow widths without sending live messages.
