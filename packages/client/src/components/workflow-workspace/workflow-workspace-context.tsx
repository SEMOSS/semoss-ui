import { createContext, useContext } from "react";
import type {
	EngineOption,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";

export interface WorkflowWorkspaceContextValue {
	expandedNodeId: string | null;
	setExpandedNodeId: (id: string | null) => void;
	enginesByType: Record<string, EngineOption[]>;
	getWfNode: (id: string) => WorkflowNode | undefined;
	onNodeUpdate: (node: WorkflowNode) => void;
	deleteNode: (id: string) => void;
	openSettings: (id: string) => void;
	nodeOutputs: Record<string, string>;
	setNodeOutput: (outputVar: string, value: string) => void;
}

export const WorkflowWorkspaceContext =
	createContext<WorkflowWorkspaceContextValue>({
		expandedNodeId: null,
		setExpandedNodeId: () => {},
		enginesByType: {},
		getWfNode: () => undefined,
		onNodeUpdate: () => {},
		deleteNode: () => {},
		openSettings: () => {},
		nodeOutputs: {},
		setNodeOutput: () => {},
	});

export function useWorkflowWorkspaceContext(): WorkflowWorkspaceContextValue {
	return useContext(WorkflowWorkspaceContext);
}
