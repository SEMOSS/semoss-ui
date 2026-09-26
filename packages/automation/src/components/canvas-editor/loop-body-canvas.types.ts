import type { AutomationNode } from "../../domain/automation.types";

/** Interaction data shared by nodes rendered inside a loop's nested canvas. */
export interface LoopBodyCanvasNodeData extends Record<string, unknown> {
	node: AutomationNode;
	connectedSourceHandles: string[];
	readOnly: boolean;
	selected: boolean;
	onAddAfter: (nodeId: string, sourceHandle: string) => void;
	onSelect: (nodeId: string) => void;
}
