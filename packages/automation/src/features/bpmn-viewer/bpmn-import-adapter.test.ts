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
		testDefinition("control.wait", "control", "Wait", {
			durationSeconds: 1,
		}),
		testDefinition("database.query", "database", "Database query"),
		testDefinition("database.insert", "database", "Database insert"),
		testDefinition("storage.read", "storage", "Storage read"),
		testDefinition("storage.upload", "storage", "Storage upload"),
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
		expect(result.warnings).toHaveLength(3);
		expect(
			result.warnings.some((warning) =>
				warning.includes('Variables "status" are used'),
			),
		).toBe(true);
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

	describe("data stores", () => {
		const STORE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="https://example.com/workflows">
	<bpmn:process id="p" name="Orders" isExecutable="false">
		<bpmn:startEvent id="start" />
		<bpmn:serviceTask id="load" name="Load orders">
			<bpmn:dataInputAssociation id="in1"><bpmn:sourceRef>ordersDb</bpmn:sourceRef></bpmn:dataInputAssociation>
		</bpmn:serviceTask>
		<bpmn:serviceTask id="save" name="Save archive">
			<bpmn:dataOutputAssociation id="out1"><bpmn:targetRef>archive</bpmn:targetRef></bpmn:dataOutputAssociation>
		</bpmn:serviceTask>
		<bpmn:dataStoreReference id="ordersDb" name="Orders DB" />
		<bpmn:dataStoreReference id="archive" name="Cold Archive" />
		<bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="load" />
		<bpmn:sequenceFlow id="f2" sourceRef="load" targetRef="save" />
	</bpmn:process>
</bpmn:definitions>`;
		const engines = [
			{ id: "db-1", names: ["Orders DB"], type: "DATABASE" as const },
			{ id: "st-1", names: ["Cold Archive"], type: "STORAGE" as const },
		];

		it("turns a task wired to a matching data store into that engine's node", async () => {
			const result = await bpmnXmlToAutomationDocument(
				STORE_XML,
				"orders.bpmn",
				{ engines },
			);
			const nodes = result.document.graph.nodes;
			const load = nodes.find((node) => node.id === "bpmn-load");
			const save = nodes.find((node) => node.id === "bpmn-save");

			expect(load?.type).toBe("database.query");
			expect(load?.config.engineId).toBe("db-1");
			expect(save?.type).toBe("storage.upload");
			expect(save?.config.engineId).toBe("st-1");
			expect(result.warnings).toEqual([]);
		});

		it("keeps the task as a database node and warns when no engine matches", async () => {
			const result = await bpmnXmlToAutomationDocument(
				STORE_XML,
				"orders.bpmn",
			);
			const load = result.document.graph.nodes.find(
				(node) => node.id === "bpmn-load",
			);

			expect(load?.type).toBe("database.query");
			expect(load?.config.engineId ?? "").toBe("");
			expect(
				result.warnings.filter((warning) =>
					warning.includes("did not match an engine"),
				),
			).toHaveLength(2);
		});

		it("warns about a data store that no task uses", async () => {
			const xml = STORE_XML.replace(
				'<bpmn:dataStoreReference id="archive" name="Cold Archive" />',
				'<bpmn:dataStoreReference id="archive" name="Cold Archive" /><bpmn:dataStoreReference id="spare" name="Spare" />',
			);
			const result = await bpmnXmlToAutomationDocument(
				xml,
				"orders.bpmn",
				{
					engines,
				},
			);

			expect(
				result.warnings.some((warning) => warning.includes('"Spare"')),
			).toBe(true);
		});
	});

	it("imports parallel gateways as one path after another with no gateway nodes", async () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="https://example.com/workflows">
	<bpmn:process id="p" name="Parallel" isExecutable="false">
		<bpmn:startEvent id="start" />
		<bpmn:parallelGateway id="Gateway_ParSplit" />
		<bpmn:task id="a" name="A" />
		<bpmn:task id="b" name="B" />
		<bpmn:parallelGateway id="Gateway_ParJoin" />
		<bpmn:task id="after" name="After" />
		<bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="Gateway_ParSplit" />
		<bpmn:sequenceFlow id="f2" sourceRef="Gateway_ParSplit" targetRef="a" />
		<bpmn:sequenceFlow id="f3" sourceRef="Gateway_ParSplit" targetRef="b" />
		<bpmn:sequenceFlow id="f4" sourceRef="a" targetRef="Gateway_ParJoin" />
		<bpmn:sequenceFlow id="f5" sourceRef="b" targetRef="Gateway_ParJoin" />
		<bpmn:sequenceFlow id="f6" sourceRef="Gateway_ParJoin" targetRef="after" />
	</bpmn:process>
</bpmn:definitions>`;
		const result = await bpmnXmlToAutomationDocument(xml, "parallel.bpmn");
		const nodes = result.document.graph.nodes;
		const edges = result.document.graph.edges;

		expect(nodes.map((item) => item.id).sort()).toEqual([
			"bpmn-a",
			"bpmn-after",
			"bpmn-b",
			"bpmn-start",
		]);
		for (const item of nodes) {
			expect(
				edges.filter((edge) => edge.source === item.id).length,
			).toBeLessThanOrEqual(1);
		}
		expect(
			edges.some(
				(edge) => edge.source === "bpmn-a" && edge.target === "bpmn-b",
			),
		).toBe(true);
		expect(
			result.warnings.some((warning) =>
				warning.includes("run one after another"),
			),
		).toBe(true);
	});

	it("imports Camunda 8 script tasks, timers and decision calls", async () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" targetNamespace="http://bpmn.io/schema/bpmn">
	<bpmn:process id="p" name="Launch" isExecutable="true">
		<bpmn:startEvent id="start" />
		<bpmn:scriptTask id="check" name="Pre-flight check">
			<bpmn:extensionElements>
				<zeebe:script expression="=if fuelLevel &#62;= 50 then &#34;GO&#34; else &#34;ABORT&#34;" resultVariable="systemStatus" />
			</bpmn:extensionElements>
		</bpmn:scriptTask>
		<bpmn:intermediateCatchEvent id="timer" name="Countdown">
			<bpmn:timerEventDefinition><bpmn:timeDuration xsi:type="bpmn:tFormalExpression">PT10S</bpmn:timeDuration></bpmn:timerEventDefinition>
		</bpmn:intermediateCatchEvent>
		<bpmn:businessRuleTask id="rule" name="Plot destination">
			<bpmn:extensionElements>
				<zeebe:calledDecision decisionId="plot-destination" resultVariable="destination" />
			</bpmn:extensionElements>
		</bpmn:businessRuleTask>
		<bpmn:scriptTask id="odd" name="Odd script">
			<bpmn:extensionElements>
				<zeebe:script expression="=for i in list return i" resultVariable="odd result" />
			</bpmn:extensionElements>
		</bpmn:scriptTask>
		<bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="check" />
		<bpmn:sequenceFlow id="f2" sourceRef="check" targetRef="timer" />
		<bpmn:sequenceFlow id="f3" sourceRef="timer" targetRef="rule" />
		<bpmn:sequenceFlow id="f4" sourceRef="rule" targetRef="odd" />
	</bpmn:process>
</bpmn:definitions>`;
		const result = await bpmnXmlToAutomationDocument(xml, "launch.bpmn");
		const nodes = result.document.graph.nodes;
		const byId = (id: string) => nodes.find((node) => node.id === id);

		expect(result.nodeSources["bpmn-check"]).toContain(
			'return ("GO") if (_num(scope["fuelLevel"]) >= 50) else ("ABORT")',
		);
		expect(result.nodeSources["bpmn-check"]).not.toContain(
			"NotImplementedError",
		);
		expect(byId("bpmn-check")?.outputVar).toBe("systemStatus");
		expect(byId("bpmn-timer")?.type).toBe("control.wait");
		expect(byId("bpmn-timer")?.config.durationSeconds).toBe(10);
		expect(byId("bpmn-rule")?.outputVar).toBe("destination");
		expect(result.nodeSources["bpmn-rule"]).toContain(
			'Calls DMN decision "plot-destination"',
		);
		expect(byId("bpmn-odd")?.outputVar).toBe("odd_result");
		expect(result.nodeSources["bpmn-odd"]).toContain(
			"FEEL: =for i in list",
		);
		expect(
			result.warnings.some((warning) => warning.includes('"fuelLevel"')),
		).toBe(true);
	});

	it("converts interrupting boundary events to an error-check decision node", async () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" targetNamespace="http://bpmn.io/schema/bpmn">
	<bpmn:process id="p" name="Order" isExecutable="true">
		<bpmn:startEvent id="start" name="Order received" />
		<bpmn:serviceTask id="check" name="Check inventory">
			<bpmn:extensionElements><zeebe:taskDefinition type="check-inventory" /></bpmn:extensionElements>
		</bpmn:serviceTask>
		<bpmn:endEvent id="shipped" name="Order shipped" />
		<bpmn:boundaryEvent id="noStock" name="Item not in stock" attachedToRef="check">
			<bpmn:errorEventDefinition />
		</bpmn:boundaryEvent>
		<bpmn:endEvent id="notShipped" name="Order not shipped" />
		<bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="check" />
		<bpmn:sequenceFlow id="f2" sourceRef="check" targetRef="shipped" />
		<bpmn:sequenceFlow id="f3" sourceRef="noStock" targetRef="notShipped" />
	</bpmn:process>
</bpmn:definitions>`;
		const result = await bpmnXmlToAutomationDocument(xml, "order.bpmn");
		const nodes = result.document.graph.nodes;
		const edges = result.document.graph.edges;

		// start + task + injected decision node + terminal end-event placeholder
		expect(nodes.map((n) => n.id).sort()).toEqual([
			"bpmn-check",
			"bpmn-check-boundary-check",
			"bpmn-notShipped",
			"bpmn-start",
		]);

		// task is wrapped with try/except
		expect(result.nodeSources["bpmn-check"]).toContain("return True");
		expect(result.nodeSources["bpmn-check"]).toContain("return False");
		expect(result.nodeSources["bpmn-check"]).toContain(
			'Camunda job type "check-inventory"',
		);

		// terminal placeholder carries the end event's name
		const terminalNode = nodes.find((n) => n.id === "bpmn-notShipped");
		expect(terminalNode?.label).toBe("Order not shipped");
		expect(result.nodeSources["bpmn-notShipped"]).toContain(
			'end event "Order not shipped"',
		);

		// decision node has a clause checking the success variable
		const ifNode = nodes.find((n) => n.id === "bpmn-check-boundary-check");
		const clauses = (
			ifNode?.config as { clauses?: { id: string; condition: string }[] }
		)?.clauses;
		expect(clauses).toHaveLength(1);
		expect(clauses?.[0].condition).toContain("== False");

		// task → if-node edge exists
		expect(
			edges.some(
				(e) =>
					e.source === "bpmn-check" &&
					e.target === "bpmn-check-boundary-check",
			),
		).toBe(true);

		// case edge connects if-node → terminal placeholder
		expect(
			edges.some(
				(e) =>
					e.source === "bpmn-check-boundary-check" &&
					e.target === "bpmn-notShipped" &&
					e.sourcePort === "case:bpmn-check-error",
			),
		).toBe(true);

		// boundary event conversion warning is present
		expect(
			result.warnings.some(
				(w) =>
					w.includes("boundary event") &&
					w.includes('"Check inventory"') &&
					w.includes("error-check decision"),
			),
		).toBe(true);
	});

	it("skips non-interrupting boundary events with a warning", async () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="http://bpmn.io/schema/bpmn">
	<bpmn:process id="p" name="Order" isExecutable="true">
		<bpmn:startEvent id="start" name="Order received" />
		<bpmn:serviceTask id="check" name="Check inventory" />
		<bpmn:boundaryEvent id="notify" cancelActivity="false" attachedToRef="check">
			<bpmn:errorEventDefinition />
		</bpmn:boundaryEvent>
		<bpmn:endEvent id="notified" name="Notified" />
		<bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="check" />
		<bpmn:sequenceFlow id="f2" sourceRef="notify" targetRef="notified" />
	</bpmn:process>
</bpmn:definitions>`;
		const result = await bpmnXmlToAutomationDocument(xml, "order.bpmn");
		const nodes = result.document.graph.nodes;

		// no decision node injected for non-interrupting events
		expect(nodes.map((n) => n.id).sort()).toEqual([
			"bpmn-check",
			"bpmn-start",
		]);
		expect(result.warnings.some((w) => w.includes("boundary event"))).toBe(
			true,
		);
	});

	it("imports a BPMN with two error boundary events each leading to a shared end", async () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" targetNamespace="http://bpmn.io/schema/bpmn">
	<bpmn:process id="p" name="Order process" isExecutable="true">
		<bpmn:startEvent id="start" name="Order received" />
		<bpmn:serviceTask id="check" name="Check inventory">
			<bpmn:extensionElements><zeebe:taskDefinition type="check-inventory" /></bpmn:extensionElements>
		</bpmn:serviceTask>
		<bpmn:serviceTask id="charge" name="Charge payment">
			<bpmn:extensionElements><zeebe:taskDefinition type="charge-payment" /></bpmn:extensionElements>
		</bpmn:serviceTask>
		<bpmn:serviceTask id="ship" name="Ship items">
			<bpmn:extensionElements><zeebe:taskDefinition type="ship-items" /></bpmn:extensionElements>
		</bpmn:serviceTask>
		<bpmn:endEvent id="shipped" name="Order shipped" />
		<bpmn:boundaryEvent id="noStock" name="Item not in stock" attachedToRef="check">
			<bpmn:errorEventDefinition />
		</bpmn:boundaryEvent>
		<bpmn:boundaryEvent id="chargeFailed" attachedToRef="charge">
			<bpmn:errorEventDefinition />
		</bpmn:boundaryEvent>
		<bpmn:endEvent id="notShipped" name="Order not shipped" />
		<bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="check" />
		<bpmn:sequenceFlow id="f2" sourceRef="check" targetRef="charge" />
		<bpmn:sequenceFlow id="f3" sourceRef="charge" targetRef="ship" />
		<bpmn:sequenceFlow id="f4" sourceRef="ship" targetRef="shipped" />
		<bpmn:sequenceFlow id="f5" sourceRef="noStock" targetRef="notShipped" />
		<bpmn:sequenceFlow id="f6" name="Charge failed" sourceRef="chargeFailed" targetRef="notShipped" />
	</bpmn:process>
</bpmn:definitions>`;
		const result = await bpmnXmlToAutomationDocument(xml, "order.bpmn");
		const nodes = result.document.graph.nodes;
		const edges = result.document.graph.edges;
		const nodeIds = nodes.map((n) => n.id).sort();

		expect(nodeIds).toContain("bpmn-check");
		expect(nodeIds).toContain("bpmn-check-boundary-check");
		expect(nodeIds).toContain("bpmn-charge");
		expect(nodeIds).toContain("bpmn-charge-boundary-check");
		expect(nodeIds).toContain("bpmn-ship");
		expect(nodeIds).toContain("bpmn-start");

		// both error paths share one terminal placeholder for "Order not shipped"
		expect(nodeIds).toContain("bpmn-notShipped");
		expect(nodeIds.filter((id) => id === "bpmn-notShipped")).toHaveLength(
			1,
		);

		// happy path: start → check → check-if → charge → charge-if → ship
		expect(
			edges.some(
				(e) =>
					e.source === "bpmn-check-boundary-check" &&
					e.target === "bpmn-charge" &&
					e.sourcePort === "else",
			),
		).toBe(true);
		expect(
			edges.some(
				(e) =>
					e.source === "bpmn-charge-boundary-check" &&
					e.target === "bpmn-ship" &&
					e.sourcePort === "else",
			),
		).toBe(true);

		// both case edges connect to the shared terminal node
		expect(
			edges.some(
				(e) =>
					e.source === "bpmn-check-boundary-check" &&
					e.target === "bpmn-notShipped" &&
					e.sourcePort?.startsWith("case:"),
			),
		).toBe(true);
		expect(
			edges.some(
				(e) =>
					e.source === "bpmn-charge-boundary-check" &&
					e.target === "bpmn-notShipped" &&
					e.sourcePort?.startsWith("case:"),
			),
		).toBe(true);
	});
});
