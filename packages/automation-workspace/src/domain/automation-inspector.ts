import type {
	AutomationNode,
	AutomationNodeTrace,
	StepRunStatus,
} from "./automation.types";

export interface AutomationInspectorSnapshot {
	description: string;
	devMode: boolean;
	/** Whether the owning canvas is read-only — mirrors `AutomationCanvas`'s `readOnly` prop so a
	 * host rendering the inspector as a sibling panel can disable its forms even if its own
	 * `readOnly` prop were ever out of sync with the canvas. */
	readOnly: boolean;
	editingStep: AutomationNode | null;
	upstreamVars: string[];
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
