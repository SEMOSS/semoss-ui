import { BpmnModdle, type ModdleElement } from "bpmn-moddle";
import { describe, expect, it } from "vitest";
import type {
	AutomationEdge,
	AutomationNode,
} from "../../domain/automation.types";
import { automationToBpmnXml } from "./automation-to-bpmn";

describe("automationToBpmnXml", () => {
	it("projects decisions, fallback routes, data links, and terminal paths", async () => {
		const nodes: AutomationNode[] = [
			{
				id: "start",
				type: "trigger",
				position: { x: 0, y: 0 },
				label: "Start",
				outputVar: "",
				config: { mode: "manual" },
			},
			{
				id: "decision",
				type: "branch",
				position: { x: 0, y: 180 },
				label: "Decision",
				outputVar: "",
				config: {
					clauses: [
						{
							id: "approved",
							condition: '${status} == "approved"',
						},
					],
				},
				workflowConfig: {
					clauses: [
						{
							id: "approved",
							condition: '${status} == "approved"',
						},
					],
				},
			},
			{
				id: "approve",
				type: "function-engine",
				position: { x: -180, y: 360 },
				label: "Approve",
				outputVar: "approved",
				config: { engineId: "", operation: "execute", params: "" },
			},
			{
				id: "reject",
				type: "function-engine",
				position: { x: 180, y: 360 },
				label: "Reject",
				outputVar: "rejected",
				config: { engineId: "", operation: "execute", params: "" },
			},
		];
		const edges: AutomationEdge[] = [
			{ id: "start-decision", source: "start", target: "decision" },
			{
				id: "approved-flow",
				source: "decision",
				target: "approve",
				sourceHandle: "case-decision-approved",
			},
			{
				id: "else-flow",
				source: "decision",
				target: "reject",
				sourceHandle: "else-decision",
			},
			{
				id: "data-flow",
				source: "approve",
				target: "reject",
				kind: "data",
			},
		];

		const xml = await automationToBpmnXml(nodes, edges, "Review process");
		const { rootElement } = await new BpmnModdle().fromXML(
			xml,
			"bpmn:Definitions",
		);
		const process = (rootElement.get("rootElements") as ModdleElement[])[0];
		const flowElements = process.get("flowElements") as ModdleElement[];
		const artifacts = process.get("artifacts") as ModdleElement[];
		const diagrams = rootElement.get("diagrams") as ModdleElement[];
		const plane = diagrams[0].get("plane") as ModdleElement;
		const planeElements = plane.get("planeElement") as ModdleElement[];
		const gateway = flowElements.find(
			(element) => element.$type === "bpmn:ExclusiveGateway",
		);
		const defaultFlow = gateway?.get("default") as
			| ModdleElement
			| undefined;
		const conditionFlow = flowElements.find(
			(element) => element.get("name") === "Condition 1",
		);
		const conditionDocumentation = (
			conditionFlow?.get("documentation") as ModdleElement[] | undefined
		)?.[0];
		const conditionDiagramEdge = planeElements.find(
			(element) =>
				element.$type === "bpmndi:BPMNEdge" &&
				(element.get("bpmnElement") as ModdleElement | undefined)?.get(
					"name",
				) === "Condition 1",
		);

		expect(
			flowElements.filter(
				(element) => element.$type === "bpmn:StartEvent",
			),
		).toHaveLength(1);
		expect(
			flowElements.filter((element) => element.$type === "bpmn:Task"),
		).toHaveLength(2);
		expect(
			artifacts.filter((element) => element.$type === "bpmn:Association"),
		).toHaveLength(1);
		expect(
			flowElements.filter((element) => element.$type === "bpmn:EndEvent"),
		).toHaveLength(2);
		expect(defaultFlow?.get("name")).toBe("Else");
		expect(conditionFlow).toBeDefined();
		expect(conditionDocumentation?.get("text")).toBe(
			'${status} == "approved"',
		);
		expect(
			conditionDiagramEdge?.get("waypoint") as ModdleElement[],
		).toHaveLength(4);
		expect(xml).toContain("BPMNDiagram");
	});
});
