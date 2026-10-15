import { describe, expect, it } from "vitest";
import { automationDocumentToN8nWorkflow } from "./automation-to-n8n-adapter";
import type { AutomationWorkflowDocument } from "./automation-workflow.types";

describe("automationDocumentToN8nWorkflow", () => {
	it("never turns an unsupported typed node or stray source into Python", () => {
		const document: AutomationWorkflowDocument = {
			formatVersion: 2,
			triggerBindings: [],
			graph: {
				nodes: [
					{
						id: "storage",
						type: "storage.list",
						label: "List storage",
						position: { x: 0, y: 0 },
						config: {
							pythonSource:
								"raise RuntimeError('must not export')",
						},
						codeMode: "generated",
					},
				],
				edges: [],
			},
		};

		const result = automationDocumentToN8nWorkflow(
			document,
			{ storage: "raise RuntimeError('must not export')" },
			"typed",
		);
		const nodes = result.workflow.nodes as Array<{ type: string }>;

		expect(nodes[0]?.type).toBe("n8n-nodes-base.noOp");
		expect(JSON.stringify(result.workflow)).not.toContain("RuntimeError");
		expect(result.warnings[0]).toContain("no-op placeholder");
	});
});
