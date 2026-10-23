import { beforeAll, describe, expect, it } from "vitest";
import { setAutomationNodeDefinitions } from "../../domain/automation-node-catalog";
import type { AutomationNodeDefinition } from "../../domain/automation-workflow.types";
import { bpmnXmlToAutomationDocument } from "./bpmn-import-adapter";

function testDefinition(
	type: AutomationNodeDefinition["type"],
	category: AutomationNodeDefinition["category"],
	label: string,
	defaultConfig: AutomationNodeDefinition["defaultConfig"] = {},
): AutomationNodeDefinition {
	return {
		type,
		category,
		label,
		description: label,
		defaultConfig,
		configSchema: {},
		outputSchema: {},
		inputs: [],
		outputs: [],
		defaultCodeMode: type === "developer.python" ? "custom" : "generated",
		requiredPermission: "EDIT",
		supportsOutput: category !== "trigger" && category !== "control",
		supportsCustomCode: type === "developer.python",
	};
}

beforeAll(() => {
	setAutomationNodeDefinitions([
		testDefinition("trigger.start", "trigger", "Start"),
		testDefinition("control.if", "control", "Decision", {
			clauses: [{ id: "initial", condition: "" }],
		}),
		testDefinition("developer.python", "developer", "Python"),
	]);
});

const BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
	 xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
	 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	 targetNamespace="https://example.com/workflows">
	<bpmn:process id="review" name="Review process" isExecutable="false">
		<bpmn:startEvent id="start" name="Start" />
		<bpmn:exclusiveGateway id="decision" name="Approval decision" default="fallback" />
		<bpmn:task id="approved" name="Approved task" />
		<bpmn:task id="rejected" name="Fallback task" />
		<bpmn:endEvent id="end" name="End" />
		<bpmn:sequenceFlow id="start-to-decision" sourceRef="start" targetRef="decision" />
		<bpmn:sequenceFlow id="approval-route" sourceRef="decision" targetRef="approved">
			<bpmn:conditionExpression xsi:type="bpmn:tFormalExpression" language="feel">= status = "approved"</bpmn:conditionExpression>
		</bpmn:sequenceFlow>
		<bpmn:sequenceFlow id="fallback" sourceRef="decision" targetRef="rejected" />
		<bpmn:sequenceFlow id="approved-to-end" sourceRef="approved" targetRef="end" />
		<bpmn:sequenceFlow id="rejected-to-end" sourceRef="rejected" targetRef="end" />
	</bpmn:process>
</bpmn:definitions>`;

describe("bpmnXmlToAutomationDocument", () => {
	it("converts supported control flow and keeps unmapped tasks as warned placeholders", async () => {
		const result = await bpmnXmlToAutomationDocument(
			BPMN_XML,
			"review.bpmn",
		);
		const nodes = result.document.graph.nodes;
		const edges = result.document.graph.edges;
		const gateway = nodes.find((node) => node.id === "bpmn-decision");
		const clauses = gateway?.config.clauses;

		expect(result.document.description).toBe("Review process");
		expect(
			nodes.filter((node) => node.type === "trigger.start"),
		).toHaveLength(1);
		expect(
			nodes.filter((node) => node.type === "developer.python"),
		).toHaveLength(2);
		expect(result.nodeSources["bpmn-approved"]).toContain(
			"NotImplementedError",
		);
		expect(result.nodeSources["bpmn-rejected"]).toContain(
			"NotImplementedError",
		);
		expect(clauses).toEqual([
			{
				id: "bpmn-approval-route",
				condition: '${status} == "approved"',
			},
		]);
		expect(
			edges.some(
				(edge) =>
					edge.source === "bpmn-decision" &&
					edge.target === "bpmn-rejected" &&
					edge.sourcePort === "else",
			),
		).toBe(true);
		expect(result.warnings).toHaveLength(2);
	});

	it("reports unsupported FEEL expressions instead of silently rewriting them", async () => {
		const xml = BPMN_XML.replace(
			'= status = "approved"',
			"= some complicated FEEL expression",
		);
		const result = await bpmnXmlToAutomationDocument(xml, "review.bpmn");

		expect(
			result.warnings.some((warning) =>
				warning.includes("FEEL expression"),
			),
		).toBe(true);
		expect(
			result.document.graph.nodes.find(
				(node) => node.id === "bpmn-decision",
			)?.config.clauses,
		).toEqual([
			{
				id: "bpmn-approval-route",
				condition: "= some complicated FEEL expression",
			},
		]);
	});
});
