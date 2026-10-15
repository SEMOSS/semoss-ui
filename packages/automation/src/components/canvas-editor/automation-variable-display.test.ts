import { describe, expect, it } from "vitest";
import type { AutomationScopeEntry } from "../../domain/automation-inspector";
import { getAutomationVariableDisplay } from "./automation-variable-display";

const entry: AutomationScopeEntry = {
	name: "download.files",
	source: "node",
	label: "Download file / Files",
	description: "Files downloaded into the run workspace.",
	availability: "guaranteed",
	pythonExpression: 'scope["download"]["files"]',
	// biome-ignore lint/suspicious/noTemplateCurlyInString: verifies the literal Automation template expression.
	templateExpression: "${download.files}",
	valueType: "string[]",
};

describe("getAutomationVariableDisplay", () => {
	it("uses server-owned scope metadata when it is available", () => {
		expect(getAutomationVariableDisplay(entry.name, [entry])).toEqual({
			label: "Download file / Files",
			description: "Files downloaded into the run workspace.",
			valueType: "string[]",
		});
	});

	it("uses friendly loop labels when metadata is unavailable", () => {
		expect(getAutomationVariableDisplay("control_loop_3.item", [])).toEqual(
			{ label: "Current item" },
		);
	});

	it("humanizes ordinary nested paths", () => {
		expect(
			getAutomationVariableDisplay("database_results.rows", []),
		).toEqual({ label: "Database results → Rows" });
	});
});
