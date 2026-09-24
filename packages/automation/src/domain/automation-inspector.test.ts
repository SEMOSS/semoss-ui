import { describe, expect, it } from "vitest";
import {
	type AutomationScopeEntry,
	getAutomationScopeExpression,
} from "./automation-inspector";

const entry: AutomationScopeEntry = {
	name: "prior_output",
	source: "node",
	label: "Prior output",
	description: "Output from an earlier step.",
	availability: "guaranteed",
	pythonExpression: 'scope["prior_output"]',
	templateExpression: "$" + "{prior_output}",
};

describe("getAutomationScopeExpression", () => {
	it("returns required and optional Python access without inventing aliases", () => {
		expect(getAutomationScopeExpression(entry, "required")).toBe(
			'scope["prior_output"]',
		);
		expect(getAutomationScopeExpression(entry, "optional")).toBe(
			'scope.get("prior_output")',
		);
	});

	it("uses server-provided expressions when available", () => {
		const described = {
			...entry,
			requiredPythonExpression: 'scope["server_name"]',
			optionalPythonExpression: 'scope.get("server_name", {})',
		};
		expect(getAutomationScopeExpression(described, "required")).toBe(
			'scope["server_name"]',
		);
		expect(getAutomationScopeExpression(described, "optional")).toBe(
			'scope.get("server_name", {})',
		);
	});
});
