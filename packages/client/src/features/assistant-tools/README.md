# Workbench assistant additions

Assistant settings attach existing accessible toolboxes and skill projects to the
current room. `mcp` is the only persisted toolbox list: it combines the room's selections
with required workbench tools and deduplicates them. On resume, entries outside the
current workbench defaults become editable room selections. Required tools stay out of
the removable list and are retained on every save. A saved tool that is no longer a
current default becomes an editable selection; separate user-selection provenance is
not tracked. Native skill references are stored in `skills` as `{ skill_id, name? }`.
Agent resources remain owned by the selected agent.
Each settings list shows removable custom additions first, followed by the selected
agent's read-only resources. Agent tools start hidden by default. An eye toggle
beside each add button hides or shows only
that section's agent-provided entries; custom additions remain visible and the toggle
does not change the resources available to the agent. Lists show up to five rows before
scrolling. Agent resources load through `GetWorkspace` and refresh on agent changes.
`AssistantSettingTools` and `AssistantSettingSkills` own their respective pickers and
drafts; `AssistantSettings` loads the agent resources once for both sections.

Every save and run submission reads the latest room options before merging these
fields. New rooms copy the open room's selections within the mounted workbench;
resuming a room restores its own selections. A fresh workbench starts without custom
additions. Failed picker saves retain their draft, and room transitions invalidate
late results. Selection changes are locked during loading, saves, submissions, and
active or paused runs.

`SMSS_MCP_UI` controls inline, sidebar, and hidden presentation. Metadata-defined
views default to sidebar placement without auto-open. Pending approvals always load
their supported UI: inline pages stay expanded, and sidebar pages open once per action,
regardless of `autoOpen`, including after a refresh or room resume. Pending actions
supply metadata, arguments, and message identity before streamed or saved tool entries
arrive. Sidebar approval batches load every page, including background tabs, and retain
frame state across tab switches. Repeated polls respect manually closed panels; the
conversation's Open tool button reopens them. Ordinary live ready calls still follow
`autoOpen`; completed history does not open automatically.
Sidebar panels identify the root conversation, owning run, and tool call, and close
on conversation changes. Unsupported component resources and unresolved pages use
an arguments/result view. UI-owned actions are excluded from generic approvals and
Approve all. Page-resolution/load failures expose standard approval controls in the
tool view, and an explicit recovery button handles unresponsive pages. Reconciliation
continues even when all approvals use authored UIs. Hidden tools and RequestUserInput
retain their existing presentation. Portal approvals retain the backend's resolved
`uiUrl` and action context; system pages and Blocks retain their existing routing.

Embedded pages receive `SMSS_INIT_TOOL` with the owning run's room and message.
Responses must match the frame, origin, and invocation identity. Completed UI work
uses the existing `RunMCPTool` respond decision with success/error status; cancellation
uses reject. Decisions are deduplicated across frames and approval controls. A failed
result submission can retry its existing result without executing the tool again.
After a page submits, its URL and initialization context remain fixed for that
invocation so reconciliation preserves the page's inputs, focus, and displayed result.
Submitting or retrying a result does not reload or reinitialize the embedded page.
Legacy pages may omit `roomId` and return a JSON value instead of a string; the frame,
origin, message, tool ID, and name still have to match, and any supplied room ID is
validated. Executed parameters are retained when the page supplies them.
When a user runs a tool again from a completed call's view, its new result starts a
follow-up assistant turn in the open conversation. The original tool result stays in
history. Duplicate deliveries are ignored, including approval responses delivered
again after reconciliation. A busy assistant or failed submission leaves the result
available for retry in the tool view.

Native skills are copied into the run's working folder. Project rooms share that
folder, and removing a selection does not remove previously staged files. The
implementation intentionally preserves this behavior without cleanup or working-folder
changes. A live read-only check verified the staged PDF skill remained available in
a second project room after removing its selection.

Focused tests live beside these components, in `stores/assistant/assistant-resources.test.ts`
and `assistant-tool-panels.test.ts`, and in `api/assistant-tools.test.ts`. The shared
skill selector is reused unchanged. No backend endpoint or SDK public API changes are required.
