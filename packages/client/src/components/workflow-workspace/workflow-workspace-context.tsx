import { createContext, useContext } from "react";
import type {
	EngineOption,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";

export interface WorkflowWorkspaceContextValue {
	enginesByType: Record<string, EngineOption[]>;
	getWfNode: (id: string) => WorkflowNode | undefined;
	onNodeUpdate: (node: WorkflowNode) => void;
	deleteNode: (id: string) => void;
	openSettings: (id: string) => void;
	nodeOutputs: Record<string, string>;
	setNodeOutput: (outputVar: string, value: string) => void;
	testOutputs: Record<string, string | null>;
	setTestOutput: (nodeId: string, output: string | null) => void;
	/** outputVar → value map built from all tested nodes + actual run outputs.
	 *  Used to substitute ${vars} when testing a node in isolation. */
	testScope: Record<string, string>;
}

export const WorkflowWorkspaceContext =
	createContext<WorkflowWorkspaceContextValue>({
		enginesByType: {},
		getWfNode: () => undefined,
		onNodeUpdate: () => {},
		deleteNode: () => {},
		openSettings: () => {},
		nodeOutputs: {},
		setNodeOutput: () => {},
		testOutputs: {},
		setTestOutput: () => {},
		testScope: {},
	});

export function useWorkflowWorkspaceContext(): WorkflowWorkspaceContextValue {
	return useContext(WorkflowWorkspaceContext);
}
