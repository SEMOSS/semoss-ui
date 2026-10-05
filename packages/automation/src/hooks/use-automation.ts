import { useContext } from "react";
import { AutomationContext } from "../contexts/automation.context";

/** Accesses the state and actions owned by the enclosing automation canvas. */
export function useAutomation() {
	const context = useContext(AutomationContext);
	if (!context) {
		throw new Error(
			"useAutomation must be used within an AutomationContext.",
		);
	}
	return context;
}

/** Accesses one automation node and actions scoped to its identifier. */
export function useAutomationNode(nodeId: string) {
	const automation = useAutomation();
	return {
		node: automation.nodes.find((node) => node.id === nodeId),
		readOnly: automation.readOnly,
		open: () => automation.openNode(nodeId),
		delete: () => automation.deleteNode(nodeId),
		deleteDownstream: () => automation.deleteNodeAndDownstream(nodeId),
		addAfter: (sourceHandle?: string) =>
			automation.addNodeAfter(nodeId, sourceHandle),
		viewAgentRun: automation.viewAgentRun,
	};
}
