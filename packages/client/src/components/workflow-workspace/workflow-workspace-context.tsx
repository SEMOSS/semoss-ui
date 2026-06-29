import { createContext, useContext } from "react";
import type { EngineOption, WorkflowNode } from "./workflow.types";

interface WorkflowWorkspaceContextValue {
	/** Engines indexed by type string (e.g. "MODEL", "DATABASE") */
	enginesByType: Record<string, EngineOption[]>;
	/** ID of the node currently expanded inline on the canvas (or null) */
	expandedNodeId: string | null;
	/** Look up a workflow node by its id */
	getWfNode: (id: string) => WorkflowNode | undefined;
	/** Persist an updated node's config/label without toggling expansion */
	onNodeUpdate: (updated: WorkflowNode) => void;
	/** Toggle inline expansion for a node */
	toggleExpand: (id: string) => void;
	/** Remove a node from the canvas */
	deleteNode: (id: string) => void;
	/** Open the full settings panel for a node */
	openSettings: (id: string) => void;
}

export const WorkflowWorkspaceContext =
	createContext<WorkflowWorkspaceContextValue | null>(null);

export function useWorkflowWorkspaceContext(): WorkflowWorkspaceContextValue {
	const ctx = useContext(WorkflowWorkspaceContext);
	if (!ctx) {
		throw new Error(
			"useWorkflowWorkspaceContext must be used inside WorkflowWorkspaceContext.Provider",
		);
	}
	return ctx;
}
