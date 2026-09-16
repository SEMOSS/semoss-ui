// Public surface for hosts that import this package directly instead of iframing it (e.g.
// `@semoss/client`'s automation workbench). The MCP/playground sidebar UI still loads this
// package as a standalone iframed app — see `src/App.tsx` and `src/main.tsx`.

export { AgentRunDialog } from "./components/agent-run";
export type { AutomationCanvasHandle } from "./components/canvas-editor/automation-canvas";
export { AutomationCanvas } from "./components/canvas-editor/automation-canvas";
export { InspectorTab } from "./components/canvas-editor/tabs/inspector-tab";
export type { AutomationTraceSnapshot } from "./components/canvas-editor/tabs/runs-tab";
export { RunsTab } from "./components/canvas-editor/tabs/runs-tab";
export type {
	AutomationNode,
	AutomationNodeTrace,
	AutomationRunDetail,
	AutomationToolContext,
} from "./domain/automation.types";
export type {
	AutomationInspectorAction,
	AutomationInspectorSnapshot,
} from "./domain/automation-inspector";
