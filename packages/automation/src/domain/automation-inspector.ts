import type {
	AutomationNode,
	AutomationNodeTrace,
	StepRunStatus,
} from "./automation.types";

/** Server-derived description of one value visible to a node at runtime. */
export interface AutomationScopeEntry {
	name: string;
	source: "runtime" | "global" | "node";
	label: string;
	description: string;
	availability: "guaranteed" | "conditional";
	pythonExpression: string;
	requiredPythonExpression?: string;
	optionalPythonExpression?: string;
	templateExpression: string;
	sourceNodeId?: string;
	defaultValue?: unknown;
}

export type AutomationScopeAccess = "required" | "optional";

/** Returns real Python syntax for reading one run-scope value. */
export function getAutomationScopeExpression(
	entry: AutomationScopeEntry,
	access: AutomationScopeAccess,
): string {
	if (access === "optional") {
		return (
			entry.optionalPythonExpression ??
			`scope.get(${JSON.stringify(entry.name)})`
		);
	}
	return (
		entry.requiredPythonExpression ?? `scope[${JSON.stringify(entry.name)}]`
	);
}

export interface AutomationInspectorSnapshot {
	description: string;
	devMode: boolean;
	/** Whether the owning canvas is read-only — mirrors `AutomationCanvas`'s `readOnly` prop so a
	 * host rendering the inspector as a sibling panel can disable its forms even if its own
	 * `readOnly` prop were ever out of sync with the canvas. */
	readOnly: boolean;
	editingStep: AutomationNode | null;
	upstreamVars: string[];
	scopeEntries: AutomationScopeEntry[];
	stepRunStatus?: StepRunStatus;
	stepRunError?: string;
	stepRunOutput?: string | null;
	stepRunTrace?: AutomationNodeTrace;
}

export type AutomationInspectorAction =
	| { type: "update-step"; step: AutomationNode }
	| { type: "delete-step"; stepId: string }
	| { type: "update-description"; description: string }
	| { type: "update-dev-mode"; devMode: boolean }
	| { type: "close" };
