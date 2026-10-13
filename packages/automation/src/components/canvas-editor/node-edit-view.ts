import type { AutomationNode } from "../../domain/automation.types";
import type { AutomationJsonValue } from "../../domain/automation-workflow.types";

export type NodeEditorMode = "form" | "python";

export interface NodePythonViewState {
	isCustomSource: boolean;
	isDeveloperPython: boolean;
	isJavaOwnedControl: boolean;
	showConversionPrompt: boolean;
	showPythonEditor: boolean;
}

/** Derives whether a node exposes editable Python or requires explicit conversion first. */
export function getNodePythonViewState(
	step: AutomationNode,
	devMode: boolean,
	editorMode: NodeEditorMode,
): NodePythonViewState {
	const isCustomSource = step.workflowCodeMode === "custom";
	const isDeveloperPython = step.workflowType === "developer.python";
	const isJavaOwnedControl =
		step.workflowType === "control.if" ||
		step.workflowType === "control.jev" ||
		step.workflowType === "control.loop";
	const showPythonEditor =
		isDeveloperPython && devMode && editorMode === "python";

	return {
		isCustomSource,
		isDeveloperPython,
		isJavaOwnedControl,
		showConversionPrompt:
			!showPythonEditor &&
			!isDeveloperPython &&
			!isJavaOwnedControl &&
			devMode &&
			editorMode === "python",
		showPythonEditor,
	};
}

/** Converts a generated direct node into an explicitly owned Python node. */
export function convertNodeToCustomPython(
	step: AutomationNode,
): AutomationNode {
	const source = `# This node was explicitly converted to Python.
# Implement run(scope) and return the value published under this node's output alias.
def run(scope):
    return {}
`;
	return {
		...step,
		workflowType: "developer.python",
		workflowCodeMode: "custom",
		workflowConfig: {
			convertedFromType: step.workflowType ?? null,
			convertedFromConfig: JSON.parse(
				JSON.stringify(step.workflowConfig ?? {}),
			) as AutomationJsonValue,
			pythonSource: source,
		},
	};
}
