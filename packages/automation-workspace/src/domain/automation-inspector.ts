import type { AutomationNode, StepRunStatus } from "./automation.types";

export interface AutomationInspectorSnapshot {
	description: string;
	devMode: boolean;
	editingStep: AutomationNode | null;
	upstreamVars: string[];
	stepRunStatus?: StepRunStatus;
	stepRunError?: string;
	stepRunOutput?: string | null;
}

export type AutomationInspectorAction =
	| { type: "update-step"; step: AutomationNode }
	| { type: "delete-step"; stepId: string }
	| { type: "update-description"; description: string }
	| { type: "update-dev-mode"; devMode: boolean }
	| { type: "close" };
