import { describe, expect, it } from "vitest";
import {
	type AutomationScopeEntry,
	declaredAutomationScopeEntries,
	getAutomationScopeExpression,
	inferNestedAutomationScopeEntries,
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

describe("declaredAutomationScopeEntries", () => {
	it("uses the server-owned result contract before a node has run", () => {
		const [files, filePath] = declaredAutomationScopeEntries(entry, {
			files: {
				type: "string[]",
				label: "Files",
				description: "Files under the destination.",
				required: true,
			},
			filePath: {
				type: "string",
				label: "Single file path",
				description: "Available for a single file.",
				required: false,
			},
		});

		expect(files.name).toBe("prior_output.files");
		expect(files.pythonExpression).toBe('scope["prior_output"]["files"]');
		expect(files.valueType).toBe("string[]");
		expect(filePath.availability).toBe("conditional");
		expect(filePath.pythonExpression).toBe(
			'scope.get("prior_output", {}).get("filePath")',
		);
	});
});

describe("inferNestedAutomationScopeEntries", () => {
	it("uses normal chained dictionary access for observed JSON fields", () => {
		const [downloaded, metadata, pageCount] =
			inferNestedAutomationScopeEntries(
				entry,
				JSON.stringify({
					downloaded: true,
					metadata: { pageCount: 3 },
				}),
			);

		expect(downloaded.requiredPythonExpression).toBe(
			'scope["prior_output"]["downloaded"]',
		);
		expect(metadata.optionalPythonExpression).toBe(
			'scope.get("prior_output", {}).get("metadata")',
		);
		expect(pageCount.optionalPythonExpression).toBe(
			'scope.get("prior_output", {}).get("metadata", {}).get("pageCount")',
		);
		expect(pageCount.availability).toBe("conditional");
		expect(pageCount.pythonExpression).toBe(
			'scope.get("prior_output", {}).get("metadata", {}).get("pageCount")',
		);
		expect(pageCount.templateExpression).toBe(
			"$" + "{prior_output.metadata.pageCount}",
		);
	});

	it("does not invent fields for plain-text output", () => {
		expect(inferNestedAutomationScopeEntries(entry, "plain text")).toEqual(
			[],
		);
	});
});
