import { describe, expect, it } from "vitest";
import {
	buildAutomationImportSaveAggregate,
	parseAutomationImportFile,
} from "./automation-import-export";

describe("native Automation legacy import", () => {
	it("routes the untouched aggregate to SaveAutomation without canvas normalization", () => {
		const triggerSource =
			'def run(scope):\r\n    return {"snowman": "☃", "cutoff": 7}\r\n';
		const typedSource =
			'def run(scope):\n\tvalue = scope.get("input")\n\treturn value  \n';
		const raw = JSON.stringify({
			formatVersion: 2,
			triggerBindings: [{ id: "manual", type: "manual" }],
			graph: {
				nodes: [
					{
						id: "start",
						type: "trigger.start",
						label: "Start",
						position: { x: 0, y: 0 },
						config: { pythonSource: triggerSource },
						codeMode: "custom",
					},
					{
						id: "wait",
						type: "control.wait",
						label: "Wait",
						outputVar: "wait_result",
						position: { x: 0, y: 160 },
						config: { durationSeconds: 1 },
						codeMode: "custom",
					},
				],
				edges: [
					{
						id: "start-to-wait",
						kind: "control",
						source: "start",
						sourcePort: "out",
						target: "wait",
						targetPort: "in",
					},
				],
			},
			nodeSources: { wait: typedSource },
		});

		const imported = parseAutomationImportFile(raw);
		const aggregate = buildAutomationImportSaveAggregate(imported);
		const savedDefinition = JSON.parse(aggregate.definitionJson) as {
			graph: { nodes: Array<{ config: Record<string, unknown> }> };
		};
		const savedSources = JSON.parse(aggregate.nodeSourcesJson) as Record<
			string,
			string
		>;

		expect(savedDefinition.graph.nodes[0]?.config.pythonSource).toBe(
			triggerSource,
		);
		expect(savedSources.wait).toBe(typedSource);
		expect(imported.document.graph.edges).toEqual([
			expect.objectContaining({
				id: "start-to-wait",
				source: "start",
				target: "wait",
			}),
		]);
	});
});
