# Workflow Engine — Frontend Build Plan

Ordered implementation steps for building the Workflow Canvas Editor into the SEMOSS UI.

---

## Phase 1: Foundation & Routing

### Step 1 — Create the Workflow Page Shell & Routes

- Create `packages/client/src/pages/workflow/` directory
- Add `WorkflowRouter.tsx` with sub-routes:
  - `/workflow` → `WorkflowListPage` (catalog of all workflows)
  - `/workflow/new` → redirect after `CreateProject`
  - `/workflow/:workflowId` → `WorkflowEditorPage` (canvas editor)
- Register `<WorkflowRouter />` in `packages/client/src/pages/Router.tsx` under `<PageLayout>`
- Add a "Workflows" entry to the app sidebar in `components/shared/Sidebar.tsx`

### Step 2 — Define TypeScript Types & Constants

- Create `packages/client/src/types/workflow.ts` with interfaces:
  - `Workflow` (workflowId, name, version, variables, settings, steps)
  - `WorkflowStep` (stepId, type, name, description, position, config, inputs, next, ifTrue, ifFalse)
  - `WorkflowSettings` (maxSteps, timeoutMs, onError)
  - `WorkflowExecution` (executionId, status, durationMs, triggeredBy, startTimeMs, endTimeMs, error)
  - `WorkflowStatusResponse` (projectId, projectName, projectType, workflow, executions)
  - `RunWorkflowResponse` (executionId, workflowId, status, durationMs, finalOutput, error)
- Define `StepType` enum: `STATIC`, `LLM_ASK`, `LLM_AGENT`, `RUN_TOOL`, `RUN_PIXEL`, `CONDITION`, `OUTPUT`
- Define `StepCategory` grouping for the palette (AI, Data, Logic, I/O, Future)
- Define per-step-type config interfaces (`StaticConfig`, `LLMAsKConfig`, `LLMAgentConfig`, `RunToolConfig`, `RunPixelConfig`, `ConditionConfig`, `OutputConfig`)

### Step 3 — Build Pixel API Helpers

- Create `packages/client/src/api/workflow.ts` with typed wrapper functions:
  - `createWorkflow(name: string)` → calls `CreateProject(project=["..."], type=["WORKFLOW"])`
  - `getWorkflowStatus(projectId: string)` → calls `GetWorkflowStatus(project=["..."])`
  - `saveWorkflow(projectId: string, json: Workflow, comment?: string)` → calls `SaveWorkflow(...)`
  - `runWorkflow(projectId: string, variables?: Record<string, unknown>, trigger?: string)` → calls `RunWorkflow(...)`
  - `deleteWorkflow(projectId: string)` → calls existing `DeleteProject` Pixel
  - `scheduleWorkflow(...)` → calls `ScheduleJob(...)` with the RunWorkflow recipe
- Use the `runPixel()` utility from `@semoss/sdk` for imperative calls
- Use `usePixel()` hook pattern for declarative data fetching where appropriate

---

## Phase 2: Workflow List View

### Step 4 — Build the Workflow List Page

- Create `WorkflowListPage.tsx` in `pages/workflow/`
- Fetch all WORKFLOW-type projects using existing project listing APIs (e.g., `MyProjects` with type filter)
- For each workflow, call `GetWorkflowStatus` to get latest execution info (or batch if possible)
- Render a table/card grid using `@semoss/ui/next` components (`Table`, `Card`, `Button`, `Badge`)
- Columns: Name, Last Run Status (badge), Last Run Time, Triggered By, Actions
- Status badges: green = SUCCESS, red = ERROR, yellow = TIMEOUT

### Step 5 — Workflow List Actions

- **Create**: "New Workflow" button → name input dialog → `createWorkflow()` → navigate to `/workflow/:id`
- **Edit**: Click row or "Edit" button → navigate to `/workflow/:id`
- **Run**: "Run" button → `runWorkflow()` → show result toast (success/error/timeout)
- **Delete**: "Delete" button → confirmation dialog → `deleteWorkflow()` → refresh list
- **Share**: Reuse existing project permission sharing UI/dialog

---

## Phase 3: Canvas Editor — Core Layout

### Step 6 — Build Editor Page Layout

- Create `WorkflowEditorPage.tsx` in `pages/workflow/`
- Use `react-resizable-panels` (`Resizable` from `@semoss/ui/next`) for the 3-panel layout:
  - Left panel: Step Palette (~200px, collapsible)
  - Center panel: React Flow canvas (flex fill)
  - Right panel: Config Panel (~350px, shows/hides on node selection)
- Bottom: collapsible Execution History drawer
- Top toolbar: Save, Run, Schedule, Undo, Redo, Zoom controls

### Step 7 — Create the Workflow Store

- Create `packages/client/src/stores/workflow-editor.store.ts`
- State:
  - `workflow: Workflow | null` — the loaded workflow document
  - `selectedStepId: string | null` — currently selected node
  - `isDirty: boolean` — unsaved changes flag
  - `historyStack: Workflow[]` — undo stack (JSON snapshots)
  - `redoStack: Workflow[]` — redo stack
  - `executionStatus: 'idle' | 'running' | 'complete'`
  - `lastExecutionResult: RunWorkflowResponse | null`
- Actions:
  - `loadWorkflow(projectId)` — fetch via `getWorkflowStatus()` and populate state
  - `addStep(type, position)` — create step with `crypto.randomUUID()`, push to steps array
  - `deleteStep(stepId)` — remove step, clean all references in other steps' next/ifTrue/ifFalse
  - `updateStep(stepId, updates)` — merge partial updates into a step
  - `connectSteps(sourceId, targetId, handleType)` — add edge (next, ifTrue, or ifFalse)
  - `disconnectSteps(sourceId, targetId, handleType)` — remove edge
  - `moveStep(stepId, position)` — update position
  - `saveWorkflow()` — call `saveWorkflow()` API with full JSON
  - `runWorkflow(variables?)` — call `runWorkflow()` API
  - `undo()` / `redo()` — pop/push history stack
  - `pushHistory()` — snapshot current state before mutations
- Use React context or Zustand for state management (follow existing patterns)

---

## Phase 4: Canvas Editor — React Flow Integration

### Step 8 — Configure React Flow Canvas

- Create `components/workflow/WorkflowCanvas.tsx`
- Initialize `<ReactFlow>` from `@xyflow/react` with:
  - Custom node types registry (map each `StepType` to a custom node component)
  - Custom edge types (default edge + conditional edges with labels)
  - `onNodesChange` → sync position changes back to store
  - `onEdgesChange` → sync edge deletions back to store
  - `onConnect` → wire `connectSteps()` from store
  - `onDrop` / `onDragOver` → handle palette drag-to-create
  - `<MiniMap />` and `<Controls />` from `@xyflow/react`
- Reference the existing `components/metamodel/meta-model.tsx` for patterns

### Step 9 — Build Custom Node Components

- Create `components/workflow/nodes/` directory
- Create a base `WorkflowNode.tsx` with shared structure: icon, name label, type badge, connection handles
- Create specialized node renderers:
  - `LLMNode` — for `LLM_ASK` / `LLM_AGENT` (AI icon, model indicator)
  - `ToolNode` — for `RUN_TOOL` (wrench icon, tool name display)
  - `PixelNode` — for `RUN_PIXEL` (code icon, recipe preview)
  - `ConditionNode` — for `CONDITION` (diamond shape, two output handles: true/false)
  - `StaticNode` — for `STATIC` (constant icon, value preview)
  - `OutputNode` — for `OUTPUT` (terminal icon, double-border "END" style)
- Entry steps (no incoming edges) get a distinct visual style (e.g., "START" label, rounded border)
- Each node shows: step name, type icon/badge, and connection handles (source/target)

### Step 10 — Build Custom Edge Components

- Create `components/workflow/edges/` directory
- `DefaultEdge` — standard animated edge for `next` connections
- `ConditionalEdge` — edge with label and color:
  - Green + "True" label for `ifTrue` edges
  - Red + "False" label for `ifFalse` edges
- Support edge deletion on click or via delete key

### Step 11 — Implement Drag-to-Create from Palette

- Build `StepPalette.tsx` for the left sidebar
- Group step types by category:
  - **AI**: LLM_ASK, LLM_AGENT
  - **Data**: RUN_TOOL, RUN_PIXEL
  - **Logic**: CONDITION
  - **I/O**: STATIC, OUTPUT
  - **Future** (disabled): LOOP, TRANSFORM, HUMAN_INPUT, GUARDRAIL, RUN_PYTHON
- Each palette item is draggable (`draggable`, `onDragStart` sets transfer data with step type)
- Canvas `onDrop` handler:
  1. Read step type from drag data
  2. Convert screen coords to flow coords via `screenToFlowPosition()`
  3. Call `store.addStep(type, position)` to create the step
  4. New step appears as an unconnected node with default name (e.g., "LLM Ask 1")

---

## Phase 5: Step Configuration Panel

### Step 12 — Build the Config Panel Shell

- Create `components/workflow/ConfigPanel.tsx`
- Shows when `selectedStepId` is non-null in the store
- Common fields at top: Name (text input), Description (optional textarea)
- Below: type-specific config form (switch on `step.type`)
- All changes update the store via `updateStep()` and mark `isDirty`

### Step 13 — Build Type-Specific Config Forms

Create form components in `components/workflow/config/`:

- **`StaticConfigForm.tsx`** — Value input (text/JSON editor)
- **`LLMAsKConfigForm.tsx`**:
  - Model engine dropdown (fetch models via existing engine listing APIs)
  - System prompt textarea
  - User prompt textarea (with `{{...}}` autocomplete)
  - Temperature slider, max_tokens input (optional params)
- **`LLMAgentConfigForm.tsx`**:
  - Model engine dropdown
  - System/User prompt textareas
  - Multi-select for tool engine IDs (fetch MCP engines)
  - Max iterations slider (1–20, default 10)
- **`RunToolConfigForm.tsx`**:
  - Engine dropdown (fetch MCP engines)
  - On engine select → fetch available tools via `GetMCPTools(engine=[...])`
  - Tool dropdown
  - On tool select → auto-generate param form from tool's `inputSchema`
  - Param inputs with `{{...}}` support
- **`RunPixelConfigForm.tsx`** — Monospace textarea / code editor for Pixel recipe
- **`ConditionConfigForm.tsx`**:
  - Left operand input (with `{{...}}` autocomplete)
  - Operator dropdown: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `empty`, `notEmpty`
  - Right operand input (with `{{...}}` autocomplete)
- **`OutputConfigForm.tsx`** — Value input with `{{...}}` autocomplete

### Step 14 — Implement Template Expression Autocomplete

- Create a reusable `TemplateInput` component (textarea with autocomplete overlay)
- When user types `{{`, show a dropdown of available step references:
  - Only show steps that are **upstream** of the current step (DAG traversal)
  - Display format: `stepId` → Step Name (`StepType`)
  - After selecting a step, auto-append `.output` (most common path)
  - Optionally offer `.metadata` for advanced users
- Implement upstream step resolution:
  - Traverse the DAG backwards from the current step
  - Collect all reachable ancestor steps
  - These are the valid template targets
- Also show `variables.*` entries from `workflow.variables`

---

## Phase 6: Variables & Settings

### Step 15 — Build the Variables Panel

- Create `components/workflow/VariablesPanel.tsx`
- Rendered as a collapsible section in the toolbar area or a dedicated tab
- Table/list of workflow-level variables:
  - Key (name) — text input
  - Default Value — text input
  - Description — optional text input
- Add / Remove variable buttons
- Changes update `workflow.variables` in the store

### Step 16 — Build the Settings Panel

- Create `components/workflow/SettingsPanel.tsx` (accessible from toolbar gear icon or tab)
- Fields:
  - Max Steps (number input, default 50)
  - Timeout (number input in seconds, convert to ms for JSON)
  - On Error behavior (select: "stop" or "skip")

---

## Phase 7: Toolbar Actions

### Step 17 — Implement Save

- "Save" button in toolbar
- Assembles the full `workflow.json` from store state
- Calls `saveWorkflow()` API
- On success: show success toast, clear `isDirty`, update version
- On validation error: show error toast with the backend's descriptive error message
- Optional: client-side pre-validation (check for dangling refs, orphans, cycles) for faster feedback

### Step 18 — Implement Run

- "Run" button in toolbar
- Optional: show a modal to override workflow variables before running
- Calls `runWorkflow()` API
- Show loading state (spinner with elapsed time since execution is synchronous)
- On completion: show result toast/modal:
  - SUCCESS → green toast, display `finalOutput`
  - ERROR → red toast, display error message
  - TIMEOUT → yellow toast, display timeout info
- Refresh execution history

### Step 19 — Implement Undo / Redo

- Maintain `historyStack` and `redoStack` of `Workflow` JSON snapshots in the store
- Before each mutation (add/delete/move/connect/update step), push a snapshot to `historyStack`
- "Undo" → pop `historyStack`, push current to `redoStack`, restore popped state
- "Redo" → pop `redoStack`, push current to `historyStack`, restore popped state
- Keyboard shortcuts: `Cmd+Z` (undo), `Cmd+Shift+Z` (redo)
- Clear `redoStack` on any new mutation

### Step 20 — Implement Schedule

- "Schedule" button in toolbar → open Schedule dialog
- Dialog contents:
  - Schedule name (text input)
  - Cron expression (cron builder with presets: daily, weekly, monthly, custom)
- On submit: call `ScheduleJob(...)` with the `RunWorkflow` pixel recipe baked in
- Show success confirmation

---

## Phase 8: Execution History

### Step 21 — Build the Execution History Drawer

- Create `components/workflow/ExecutionHistory.tsx`
- Collapsible bottom drawer (using `Resizable` vertical panel or `Drawer`)
- Populate from `GetWorkflowStatus` response's `executions` array
- Table columns:
  - Status — badge (green=SUCCESS, red=ERROR, yellow=TIMEOUT)
  - Duration — formatted ("4.5s" or "2m 30s")
  - Triggered By — text
  - Time — formatted timestamp (relative or absolute)
  - Error — tooltip or expandable row for error details
- Auto-refresh after each run

---

## Phase 9: Edge Cases & Polish

### Step 22 — Implement Step Deletion Logic

- On delete (keyboard Delete or context menu):
  1. Remove step from `workflow.steps`
  2. Scan ALL other steps and remove the deleted stepId from their `next`, `ifTrue`, `ifFalse` arrays
  3. Optional auto-rewire: if A→B→C and B is deleted, wire A→C
  4. Push history snapshot before mutation
  5. Mark `isDirty`

### Step 23 — Implement Insert-on-Edge

- Detect when a new step is dropped onto an existing edge (A→C)
- Create new step B
- Rewire: A.next removes C, adds B; B.next adds C
- Handle conditional edges: if dropped on an ifTrue/ifFalse edge, rewire accordingly

### Step 24 — Client-Side DAG Validation

- Before save, optionally validate:
  - No dangling step references (next/ifTrue/ifFalse point to existing stepIds)
  - No orphaned steps (all steps reachable from entry points)
  - No cycles (topological sort or DFS)
  - No duplicate step IDs
  - At least one entry point (steps with no incoming edges)
- Show inline warnings on the canvas (highlight problematic nodes/edges)
- This is supplementary — the backend is the authoritative validator

### Step 25 — Dirty State & Navigation Guards

- Track `isDirty` flag in the store
- Show unsaved changes indicator in the toolbar (dot or asterisk on Save button)
- Add a `beforeunload` event listener to warn on page close with unsaved changes
- Add a route navigation guard (React Router `useBlocker` or `Prompt`) to warn on navigation away

### Step 26 — Empty States & Loading States

- Workflow list: empty state when no workflows exist ("Create your first workflow")
- Canvas: empty state for a new workflow ("Drag steps from the palette to get started")
- Loading skeletons for list page, canvas load, config panel engine dropdowns
- Error states for failed API calls with retry options

---

## Phase 10: Testing

### Step 27 — Unit Tests

- Test workflow store actions (add/delete/update/connect steps, undo/redo) 
- Test DAG validation utilities (cycle detection, orphan detection, upstream step resolution)
- Test template expression parsing (extract `{{...}}` references)
- Test Pixel API helper functions
- Use `vitest` (already configured in the project)

### Step 28 — Integration Tests

- Test full create → edit → save → run flow
- Test edge cases: save validation errors, run errors, empty workflows
- Test drag-to-create and edge connection interactions

---

## Dependency Summary

| Dependency | Status | Notes |
|---|---|---|
| `@xyflow/react` | Already installed (v12.0.4+) | React Flow for the canvas |
| `@semoss/ui/next` | Already available | shadcn components (Button, Card, Dialog, Sheet, Table, Badge, etc.) |
| `react-resizable-panels` | Already available via `@semoss/ui/next` | Resizable panel layout |
| `react-router-dom` | Already installed | Routing |
| `@semoss/sdk` | Already available | `runPixel()`, `usePixel()` for API calls |

No new external dependencies required.

---

## File Structure (Proposed)

```
packages/client/src/
├── api/
│   └── workflow.ts                    # Pixel API helpers
├── types/
│   └── workflow.ts                    # TypeScript interfaces
├── stores/
│   └── workflow-editor.store.ts       # Editor state management
├── pages/
│   └── workflow/
│       ├── WorkflowRouter.tsx         # Sub-router
│       ├── WorkflowListPage.tsx       # List/catalog page
│       └── WorkflowEditorPage.tsx     # Canvas editor page
└── components/
    └── workflow/
        ├── WorkflowCanvas.tsx         # React Flow wrapper
        ├── StepPalette.tsx            # Left sidebar palette
        ├── ConfigPanel.tsx            # Right sidebar config
        ├── VariablesPanel.tsx         # Variables editor
        ├── SettingsPanel.tsx          # Workflow settings
        ├── ExecutionHistory.tsx       # Bottom drawer
        ├── TemplateInput.tsx          # {{...}} autocomplete input
        ├── nodes/
        │   ├── WorkflowNode.tsx       # Base node component
        │   ├── LLMNode.tsx
        │   ├── ToolNode.tsx
        │   ├── PixelNode.tsx
        │   ├── ConditionNode.tsx
        │   ├── StaticNode.tsx
        │   └── OutputNode.tsx
        ├── edges/
        │   ├── DefaultEdge.tsx
        │   └── ConditionalEdge.tsx
        └── config/
            ├── StaticConfigForm.tsx
            ├── LLMAskConfigForm.tsx
            ├── LLMAgentConfigForm.tsx
            ├── RunToolConfigForm.tsx
            ├── RunPixelConfigForm.tsx
            ├── ConditionConfigForm.tsx
            └── OutputConfigForm.tsx
```
