import { describe, expect, it } from "vitest";
import type { AutomationNode } from "../../domain/automation.types";
import {
	convertNodeToCustomPython,
	getNodePythonViewState,
} from "./node-edit-view";

function node(
	workflowType: AutomationNode["workflowType"] = "control.wait",
	workflowCodeMode: AutomationNode["workflowCodeMode"] = "generated",
): AutomationNode {
	return {
		id: "node-1",
		type: "wait",
		label: "Wait",
		position: { x: 0, y: 0 },
		outputVar: "wait_output",
		config: { seconds: "1" },
		workflowType,
		workflowConfig: {},
		workflowCodeMode,
	};
}

describe("node Python view", () => {
	it("requires an explicit conversion before generated direct nodes show an editor", () => {
		const state = getNodePythonViewState(node(), true, "python");

		expect(state).toMatchObject({
			isCustomSource: false,
			showConversionPrompt: true,
			showPythonEditor: false,
		});
	});

	it("never exposes Python attached to a typed node", () => {
		const state = getNodePythonViewState(
			node("control.wait", "custom"),
			true,
			"python",
		);

		expect(state.showConversionPrompt).toBe(true);
		expect(state.showPythonEditor).toBe(false);
	});

	it("keeps developer Python editable without a conversion step", () => {
		const state = getNodePythonViewState(
			node("developer.python", "custom"),
			true,
			"python",
		);

		expect(state.isDeveloperPython).toBe(true);
		expect(state.showPythonEditor).toBe(true);
	});

	it("converts generated code without mutating the original node", () => {
		const generated = node();
		const converted = convertNodeToCustomPython(generated);

		expect(generated.workflowCodeMode).toBe("generated");
		expect(converted.workflowCodeMode).toBe("custom");
		expect(converted.workflowType).toBe("developer.python");
		expect(converted.workflowConfig?.pythonSource).toContain(
			"def run(scope):",
		);
		expect(converted.workflowConfig?.convertedFromType).toBe(
			"control.wait",
		);
	});
});
