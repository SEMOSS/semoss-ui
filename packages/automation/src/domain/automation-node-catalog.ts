import type {
	AutomationNodeDefinition,
	AutomationWorkflowNodeType,
} from "./automation-workflow.types";

let nodeDefinitions: readonly AutomationNodeDefinition[] | null = null;

/** Replaces the in-memory catalog with the validated backend definitions. */
export function setAutomationNodeDefinitions(
	definitions: readonly AutomationNodeDefinition[],
): void {
	nodeDefinitions = Object.freeze([...definitions]);
}

/** Returns whether the backend node catalog is ready for synchronous consumers. */
export function hasAutomationNodeDefinitions(): boolean {
	return nodeDefinitions !== null;
}

/** Returns all backend-provided node definitions. */
export function getAutomationNodeDefinitions(): readonly AutomationNodeDefinition[] {
	if (!nodeDefinitions) {
		throw new Error("Automation node definitions have not been loaded.");
	}
	return nodeDefinitions;
}

/** Returns one backend-provided node definition by its stable type identifier. */
export function getAutomationNodeDefinition(
	type: AutomationWorkflowNodeType,
): AutomationNodeDefinition | undefined {
	return getAutomationNodeDefinitions().find(
		(definition) => definition.type === type,
	);
}
