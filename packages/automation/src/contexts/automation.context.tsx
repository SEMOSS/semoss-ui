import { createContext } from "react";
import type {
	AutomationNode,
	AutomationNodeTrace,
} from "../domain/automation.types";

export interface AutomationContextValue {
	nodes: AutomationNode[];
	readOnly: boolean;
	viewingHistory: boolean;
	running: boolean;
	openNode: (nodeId: string) => void;
	deleteNode: (nodeId: string) => void;
	deleteNodeAndDownstream: (nodeId: string) => void;
	addNodeAfter: (nodeId: string, sourceHandle?: string) => void;
	viewAgentRun: (trace: AutomationNodeTrace) => void;
}

export const AutomationContext = createContext<AutomationContextValue | null>(
	null,
);
