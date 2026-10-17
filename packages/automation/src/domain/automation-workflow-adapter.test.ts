import { beforeAll, describe, expect, it } from "vitest";
import type {
	AutomationNode,
	CleanConfig,
	DatabaseEngineConfig,
	DataExtractConfig,
	ModelEngineConfig,
	StorageEngineConfig,
	VectorEngineConfig,
} from "./automation.types";
import { CLEAN_OPERATIONS } from "./automation.types";
import { setAutomationNodeDefinitions } from "./automation-node-catalog";
import type {
	AutomationNodeCategory,
	AutomationNodeDefinition,
	AutomationWorkflowNodeConfig,
	AutomationWorkflowNodeType,
} from "./automation-workflow.types";
import {
	canvasDocumentFromWorkflow,
	canvasDocumentToWorkflow,
	createCanvasWorkflowNode,
	definesRunEntryPoint,
	getCanvasNodeSources,
	normalizeJevDecisionConfig,
	validateAutomationOutputVariable,
	validateCanvasWorkflowConnections,
	validateCanvasWorkflowNode,
} from "./automation-workflow-adapter";

/** Minimal catalog stand-in for the adapter's domain tests. */
function definition(
	type: AutomationWorkflowNodeType,
	category: AutomationNodeCategory,
	label: string,
	defaultConfig: AutomationWorkflowNodeConfig = {},
	supportsCustomCode = true,
): AutomationNodeDefinition {
	return {
		type,
		label,
		description: `${label} test definition`,
		category,
		defaultConfig,
		configSchema: {},
		outputSchema: {},
		inputs: [],
		outputs: [],
		defaultCodeMode: "generated",
		requiredPermission: "EDIT",
		supportsOutput: category !== "trigger",
		supportsCustomCode,
	};
}

/** Every node type the domain tests exercise. */
const TEST_NODE_DEFINITIONS: readonly AutomationNodeDefinition[] = [
	definition(
		"clean.process",
		"clean",
		"Clean data",
		{
			source: "",
			operation: "purge",
			columns: [],
			filters: [],
			column: "",
			newColumn: "",
			dataType: "STRING",
			value: "",
			newValue: "",
		},
		false,
	),
	definition("trigger.start", "trigger", "Start", {}, false),
	definition("database.query", "database", "Query database", {
		engineId: "",
		query: "",
		parameters: [],
		limit: 50,
	}),
	definition("database.insert", "database", "Insert database rows", {
		engineId: "",
		query: "",
	}),
	definition("database.update", "database", "Update database rows", {
		engineId: "",
		query: "",
	}),
	definition("database.delete", "database", "Delete database rows", {
		engineId: "",
		query: "",
	}),
	definition("vector.search", "vector", "Search documents", {
		engineId: "",
		value: "",
	}),
	definition("vector.add", "vector", "Add documents", {
		engineId: "",
		value: "",
	}),
	definition("vector.delete", "vector", "Remove documents", {
		engineId: "",
		value: "",
	}),
	definition("storage.list", "storage", "List files", {
		engineId: "",
		path: "",
	}),
	definition("storage.upload", "storage", "Upload file", {
		engineId: "",
		path: "",
		destination: "",
		metadata: {},
	}),
	definition(
		"data.extract",
		"data",
		"Extract value",
		{
			source: "",
			path: "",
			format: "auto",
			missingValue: null,
			nullValue: null,
		},
		false,
	),
	definition("model.chat", "model", "Chat model", {
		engineId: "",
		prompt: "",
	}),
	definition("model.vision", "model", "Analyze image", {
		engineId: "",
		prompt: "",
		image: "",
		urls: [],
		paramValues: {},
	}),
	definition("control.if", "control", "Decision", {
		clauses: [{ id: "initial", condition: "" }],
	}),
	definition(
		"control.loop",
		"control",
		"Repeat steps",
		{
			mode: "forEach",
			items: [],
			batchSize: 1,
			count: 1,
			condition: "",
			maxIterations: 100,
		},
		false,
	),
	definition(
		"control.jev",
		"control",
		"Jev decision",
		{
			engineId: "",
			state: "",
			questions: [
				{
					key: "route",
					type: "choice",
					instructions: "Choose a route.",
					criteria: { initial: "" },
				},
			],
			clauses: [
				{
					id: "initial",
					description: "",
					match: "all",
					conditions: [
						{
							questionKey: "route",
							field: "choice",
							operator: "equals",
							value: "initial",
						},
					],
				},
			],
			paramValues: { timeout: 30, max_retries: 2 },
		},
		false,
	),
	definition("developer.python", "developer", "Python", {}),
];

beforeAll(() => {
	setAutomationNodeDefinitions(TEST_NODE_DEFINITIONS);
});

function node(
	type: AutomationWorkflowNodeType,
	overrides: Partial<AutomationNode> = {},
): AutomationNode {
	return { ...createCanvasWorkflowNode(type, 1), ...overrides };
}

function documentOf(steps: AutomationNode[]) {
	return canvasDocumentToWorkflow({
		description: "",
		triggerBindings: [{ id: "manual", type: "manual" }],
		steps,
		edges: [],
	});
}

describe("Clean nodes", () => {
	it("round trips the selected operation on the generic Clean node", () => {
		const step = node("clean.process");
		const config: CleanConfig = {
			...(step.config as CleanConfig),
			operation: "changeType",
			source: `\${table}`,
			column: "AGE",
			dataType: "DOUBLE",
		};
		const saved = documentOf([{ ...step, config }]);
		const savedNode = saved.graph.nodes.find(
			(item) => item.type === "clean.process",
		);
		expect(savedNode?.config).toMatchObject({
			operation: "changeType",
			column: "AGE",
			dataType: "DOUBLE",
		});

		const reloaded = canvasDocumentFromWorkflow(saved, {}).steps.find(
			(candidate) => candidate.workflowType === "clean.process",
		);
		expect((reloaded?.config as CleanConfig).operation).toBe("changeType");
	});

	it("validates the generic Clean operation and its required fields", () => {
		const step = node("clean.process");
		expect(
			validateCanvasWorkflowNode({
				...step,
				config: {
					...(step.config as CleanConfig),
					source: `\${table}`,
					operation: "trim",
					columns: [],
				},
			}),
		).toContain("Select at least one nonblank column");
		expect(
			validateCanvasWorkflowNode({
				...step,
				config: {
					...(step.config as CleanConfig),
					source: `\${table}`,
					operation: "unknown" as CleanConfig["operation"],
				},
			}),
		).toContain("Select a supported Clean operation");
	});

	it("validates Change Type targets and Rename column names", () => {
		const changeType = node("clean.process");
		expect(
			validateCanvasWorkflowNode({
				...changeType,
				config: {
					...(changeType.config as CleanConfig),
					operation: "changeType",
					source: `\${table}`,
					column: "AGE",
					dataType: "INVALID",
				},
			}),
		).toContain("Select a supported target type");
		const rename = node("clean.process");
		expect(
			validateCanvasWorkflowNode({
				...rename,
				config: {
					...(rename.config as CleanConfig),
					operation: "renameColumn",
					source: `\${table}`,
					column: "AGE",
					newColumn: "bad name",
				},
			}),
		).toContain("Use a valid new column name");
	});

	it("accepts equality value lists but rejects lists for range comparisons", () => {
		const purge = node("clean.process");
		for (const operator of ["==", "!=", ">", "<="]) {
			const errors = validateCanvasWorkflowNode({
				...purge,
				config: {
					...(purge.config as CleanConfig),
					operation: "purge",
					source: `\${table}`,
					filters: JSON.stringify([
						{ column: "ID", operator, value: [1, 2, 3] },
					]),
				},
			});
			expect(errors.length).toBe(
				operator === "==" || operator === "!=" ? 0 : 1,
			);
		}
	});
	it.each(CLEAN_OPERATIONS)(
		"round trips %s without losing configuration or changing the node type",
		(operation) => {
			const step = node("clean.process");
			const config: CleanConfig = {
				operation,
				source: `\${table}`,
				columns: ["STATUS"],
				column: "STATUS",
				newColumn: "STATUS_NEW",
				dataType: "STRING",
				value: "old",
				newValue: "new",
				filters:
					'[{"column":"STATUS","operator":"==","value":"active"}]',
			};
			const saved = documentOf([{ ...step, config }]);
			const reloaded = canvasDocumentFromWorkflow(saved, {}).steps.find(
				(candidate) => candidate.workflowType === "clean.process",
			);
			expect(reloaded?.type).toBe("clean");
			expect(reloaded?.workflowType).toBe("clean.process");
			expect((reloaded?.config as CleanConfig).operation).toBe(operation);
			expect(reloaded?.config).toMatchObject({ source: `\${table}` });
			expect(
				documentOf(reloaded ? [reloaded] : []).graph.nodes[0]?.config,
			).toEqual(saved.graph.nodes[0]?.config);
			if (operation === "purge") {
				expect(saved.graph.nodes[0]?.config.filters).toEqual([
					{ column: "STATUS", operator: "==", value: "active" },
				]);
			}
			if (operation === "replace") {
				expect(reloaded?.config).toMatchObject({
					columns: ["STATUS"],
					value: "old",
					newValue: "new",
				});
			}
		},
	);

	it("rejects literal table names, empty columns, and malformed Purge filters", () => {
		const trim = node("clean.process");
		expect(
			validateCanvasWorkflowNode({
				...trim,
				config: { ...(trim.config as CleanConfig), operation: "trim" },
			}),
		).toContain("Input table must be an exact upstream table reference");
		expect(
			validateCanvasWorkflowNode({
				...trim,
				config: {
					...(trim.config as CleanConfig),
					source: `\${table}`,
					operation: "trim",
					columns: [],
				},
			}),
		).toContain("Select at least one nonblank column");
		const purge = node("clean.process");
		for (const filters of [
			"[]",
			"not JSON",
			'[{"column":"ID","operator":"execute","value":1}]',
		]) {
			expect(
				validateCanvasWorkflowNode({
					...purge,
					config: {
						...(purge.config as CleanConfig),
						operation: "purge",
						source: `\${table}`,
						filters,
					},
				}),
			).toContain(
				"Rows to remove must contain 1 to 100 valid JSON filters",
			);
		}
	});
});

describe("database query limit", () => {
	it("preserves the business user's result limit", () => {
		const step = node("database.query");
		const saved = documentOf([
			{
				...step,
				config: {
					...(step.config as DatabaseEngineConfig),
					engineId: "database-1",
					expression: "SELECT * FROM CLAIMS ORDER BY ID",
					limit: 100,
				},
			},
		]);

		expect(saved.graph.nodes[0]?.config).toMatchObject({
			engineId: "database-1",
			query: "SELECT * FROM CLAIMS ORDER BY ID",
			limit: 100,
		});

		const reloaded = canvasDocumentFromWorkflow(saved, {});
		const reloadedQuery = reloaded.steps.find(
			(candidate) => candidate.workflowType === "database.query",
		);
		expect(reloadedQuery?.config).toMatchObject({
			limit: 100,
		});
	});

	it("preserves bound positional parameters", () => {
		const step = node("database.query");
		const parameterReference =
			"$" + "{developer_python_8.appointmentBlockId}";
		const saved = documentOf([
			{
				...step,
				config: {
					...(step.config as DatabaseEngineConfig),
					engineId: "database-1",
					expression:
						"SELECT ExamSchedulingRequestId FROM ExampleSchedulingRequestId WHERE AppointmentBlockId = ?",
					parameters: JSON.stringify([parameterReference]),
				},
			},
		]);

		expect(saved.graph.nodes[0]?.config.parameters).toEqual([
			parameterReference,
		]);

		const reloaded = canvasDocumentFromWorkflow(saved, {});
		const reloadedQuery = reloaded.steps.find(
			(candidate) => candidate.workflowType === "database.query",
		);
		expect(reloadedQuery?.config).toMatchObject({
			parameters: JSON.stringify([parameterReference]),
		});
	});
});

describe("data extraction", () => {
	it("preserves source, path, format, and fallback values", () => {
		const step = node("data.extract");
		const saved = documentOf([
			{
				...step,
				config: {
					...(step.config as DataExtractConfig),
					source: "$" + "{download.filePath}",
					path: "orders[0].customer.name",
					format: "json",
					missingValue: '"Unknown customer"',
					nullValue: '"Not provided"',
				},
			},
		]);

		expect(saved.graph.nodes[0]?.config).toMatchObject({
			source: "$" + "{download.filePath}",
			path: "orders[0].customer.name",
			format: "json",
			missingValue: "Unknown customer",
			nullValue: "Not provided",
		});

		const reloaded = canvasDocumentFromWorkflow(saved, {});
		const reloadedExtract = reloaded.steps.find(
			(candidate) => candidate.workflowType === "data.extract",
		);
		expect(reloadedExtract?.config).toMatchObject({
			source: "$" + "{download.filePath}",
			path: "orders[0].customer.name",
			format: "json",
			missingValue: "Unknown customer",
			nullValue: "Not provided",
		});
	});
});

describe("loop container mapping", () => {
	it("preserves its nested graph and body node sources", () => {
		const bodyNode = node("developer.python", {
			id: "double-item",
			label: "Double item",
			outputVar: "doubled",
			workflowCodeMode: "custom",
			workflowConfig: {
				pythonSource:
					'def run(scope):\n    return scope.get("batch_context", {}).get("item") * 2\n',
			},
		});
		const loop = node("control.loop", {
			id: "batch-loop",
			outputVar: "batch_context",
			config: {
				mode: "forEach",
				items: "$" + "{numbers}",
				batchSize: 1,
				maxIterations: 25,
			},
			body: { nodes: [bodyNode], edges: [] },
		});

		const saved = documentOf([loop]);
		expect(saved.graph.nodes[0]).toMatchObject({
			type: "control.loop",
			outputVar: "batch_context",
			config: {
				mode: "forEach",
				items: "$" + "{numbers}",
				batchSize: 1,
				maxIterations: 25,
			},
			body: {
				nodes: [{ id: "double-item", type: "developer.python" }],
				edges: [],
			},
		});
		expect(getCanvasNodeSources([loop])).toEqual({
			"double-item": bodyNode.workflowConfig?.pythonSource,
		});

		const reloaded = canvasDocumentFromWorkflow(saved, {
			"double-item": bodyNode.workflowConfig?.pythonSource ?? "",
		});
		const reloadedLoop = reloaded.steps.find(
			(candidate) => candidate.workflowType === "control.loop",
		);
		expect(reloadedLoop?.body?.nodes[0]).toMatchObject({
			id: "double-item",
			workflowType: "developer.python",
			workflowConfig: {
				pythonSource: bodyNode.workflowConfig?.pythonSource,
			},
		});
	});

	it.each([
		{
			mode: "repeat" as const,
			count: 4,
			maxIterations: 10,
		},
		{
			mode: "while" as const,
			condition: "$" + '{loop_context.previous.status} != "complete"',
			maxIterations: 10,
		},
	])("round trips $mode configuration", (config) => {
		const bodyNode = node("developer.python", { id: "body-step" });
		const loop = node("control.loop", {
			id: "loop",
			outputVar: "loop_context",
			config,
			body: { nodes: [bodyNode], edges: [] },
		});

		const saved = documentOf([loop]);
		expect(saved.graph.nodes[0].config).toMatchObject(config);
		const reloaded = canvasDocumentFromWorkflow(saved, {});
		const reloadedLoop = reloaded.steps.find(
			(candidate) => candidate.workflowType === "control.loop",
		);
		expect(reloadedLoop?.config).toMatchObject(config);
	});

	it("validates repeat and while settings", () => {
		const bodyNode = node("developer.python", { id: "body-step" });
		const invalidRepeat = node("control.loop", {
			config: { mode: "repeat", count: 11, maxIterations: 10 },
			body: { nodes: [bodyNode], edges: [] },
		});
		const invalidWhile = node("control.loop", {
			config: { mode: "while", condition: "", maxIterations: 10 },
			body: { nodes: [bodyNode], edges: [] },
		});

		expect(
			validateCanvasWorkflowNode(invalidRepeat, [invalidRepeat]),
		).toContain(
			"Number of times must be a whole number no greater than the safety limit",
		);
		expect(
			validateCanvasWorkflowNode(invalidWhile, [invalidWhile]),
		).toContain("Continue while condition is required");
	});

	it("requires an array source and at least one nested step", () => {
		const loop = node("control.loop", {
			config: {
				mode: "forEach",
				items: "not a list",
				batchSize: 1,
				maxIterations: 10,
			},
			body: { nodes: [], edges: [] },
		});

		expect(validateCanvasWorkflowNode(loop, [loop])).toEqual(
			expect.arrayContaining([
				"Items must be a JSON array or an exact variable reference",
				"Add at least one step inside the loop",
			]),
		);
	});

	it("identifies the invalid nested step and its missing routes", () => {
		const decision = node("control.if", {
			id: "decision",
			label: "Choose path",
			config: { clauses: [{ id: "case-1", condition: "" }] },
		});
		const target = node("developer.python", { id: "target" });
		const loop = node("control.loop", {
			config: {
				mode: "forEach",
				items: "[1]",
				batchSize: 1,
				maxIterations: 10,
			},
			body: {
				nodes: [decision, target],
				edges: [
					{
						id: "case-edge",
						source: decision.id,
						target: target.id,
						sourceHandle: `case-${decision.id}-case-1`,
					},
				],
			},
		});

		expect(validateCanvasWorkflowNode(loop, [loop])).toEqual(
			expect.arrayContaining([
				'Inside "Choose path": Each condition is required',
				'Inside "Choose path": Every condition and the Else path must be connected',
			]),
		);
	});
});

describe("Jev decision mapping", () => {
	it("normalizes a legacy local draft before the node card or editor reads it", () => {
		const normalized = normalizeJevDecisionConfig({
			engineId: "jev-engine",
			state: "A support request",
			questionType: "choice",
			question: "Which team owns this request?",
			confidenceThreshold: 0.75,
			clauses: [
				{
					id: "billing",
					description: "Billing",
				},
				{
					id: "technical",
					description: "Technical support",
				},
			],
		});

		expect(normalized.questions).toEqual([
			expect.objectContaining({
				key: "route",
				type: "choice",
				instructions: "Which team owns this request?",
			}),
		]);
		expect(normalized.clauses).toHaveLength(2);
		expect(normalized.clauses[0]?.conditions).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					questionKey: "route",
					field: "choice",
					value: "billing",
				}),
			]),
		);
	});

	it("preserves mixed typed questions and ordered route rules", () => {
		const ticketReference = "$" + "{ticket}";
		const step = node("control.jev", {
			config: {
				engineId: "jev-engine",
				state: ticketReference,
				questions: [
					{
						key: "department",
						type: "choice",
						instructions: "Which team owns this ticket?",
						criteria: {
							billing: "Payments and refunds",
							technical: "Bugs and errors",
						},
					},
					{
						key: "urgency",
						type: "score",
						instructions: "How urgent is it?",
						criteria: ["Routine", "Urgent"],
					},
					{
						key: "safe_to_automate",
						type: "noul",
						instructions: "Can this run without a person?",
						criteria: { true: "Safe", false: "Needs review" },
					},
				],
				clauses: [
					{
						id: "urgent-technical",
						description: "Urgent technical review",
						match: "all",
						conditions: [
							{
								questionKey: "department",
								field: "choice",
								operator: "equals",
								value: "technical",
							},
							{
								questionKey: "urgency",
								field: "score",
								operator: "greaterThanOrEqual",
								value: 0.7,
							},
						],
					},
				],
				paramValues: '{"timeout":5}',
			},
		});

		const saved = documentOf([step]);
		expect(saved.graph.nodes[0]).toMatchObject({
			type: "control.jev",
			codeMode: "generated",
			config: {
				engineId: "jev-engine",
				state: ticketReference,
				questions: expect.arrayContaining([
					expect.objectContaining({
						key: "department",
						type: "choice",
					}),
					expect.objectContaining({ key: "urgency", type: "score" }),
					expect.objectContaining({
						key: "safe_to_automate",
						type: "noul",
					}),
				]),
				clauses: [
					expect.objectContaining({
						id: "urgent-technical",
						match: "all",
						conditions: expect.arrayContaining([
							expect.objectContaining({
								questionKey: "urgency",
								field: "score",
								value: 0.7,
							}),
						]),
					}),
				],
				paramValues: { timeout: 5 },
			},
		});
		expect(getCanvasNodeSources([step])).toEqual({});

		const reloaded = canvasDocumentFromWorkflow(saved, {});
		const reloadedJev = reloaded.steps.find(
			(candidate) => candidate.workflowType === "control.jev",
		);
		expect(reloadedJev?.workflowConfig).toMatchObject({
			engineId: "jev-engine",
			state: ticketReference,
			questions: expect.arrayContaining([
				expect.objectContaining({
					key: "safe_to_automate",
					type: "noul",
				}),
			]),
		});
	});

	it("validates each route against a known typed answer", () => {
		const step = node("control.jev", {
			config: {
				engineId: "jev-engine",
				state: "$" + "{ticket}",
				questions: [
					{
						key: "safe_to_automate",
						type: "noul",
						instructions: "Can this ticket run automatically?",
						criteria: { true: "Safe", false: "Needs review" },
					},
				],
				clauses: [
					{
						id: "automatic",
						description: "Continue automatically",
						match: "all",
						conditions: [
							{
								questionKey: "safe_to_automate",
								field: "noul",
								operator: "greaterThanOrEqual",
								value: 0.8,
							},
						],
					},
				],
				paramValues: "{}",
			},
		});

		expect(validateCanvasWorkflowNode(step, [step])).toEqual([]);
	});

	it("rejects unknown question references and missing route rules", () => {
		const step = node("control.jev", {
			config: {
				engineId: "jev-engine",
				state: "$" + "{ticket}",
				questions: [
					{
						key: "decision",
						type: "choice",
						instructions: "Choose a path.",
						criteria: { continue: "Continue" },
					},
				],
				clauses: [
					{
						id: "first",
						description: "First",
						conditions: [],
					},
					{
						id: "second",
						description: "Second",
						conditions: [
							{
								questionKey: "missing",
								field: "choice",
								operator: "equals",
								value: "continue",
							},
						],
					},
				],
				paramValues: "{}",
			},
		});

		expect(validateCanvasWorkflowNode(step, [step])).toEqual(
			expect.arrayContaining([
				'Route "First" needs a rule',
				'Route "Second" references an unknown question',
			]),
		);
	});

	it("requires every JEV route and fallback path before execution", () => {
		const step = node("control.jev", {
			id: "jev",
			config: {
				engineId: "jev-engine",
				state: "$" + "{ticket}",
				questions: [
					{
						key: "route",
						type: "choice",
						instructions: "Choose a path.",
						criteria: { yes: "Continue", no: "Stop" },
					},
				],
				clauses: [
					{
						id: "yes",
						description: "Continue",
						conditions: [
							{
								questionKey: "route",
								field: "choice",
								operator: "equals",
								value: "yes",
							},
						],
					},
					{
						id: "no",
						description: "Stop",
						conditions: [
							{
								questionKey: "route",
								field: "choice",
								operator: "equals",
								value: "no",
							},
						],
					},
				],
				paramValues: "{}",
			},
		});
		const yesEdge = {
			id: "yes-edge",
			source: step.id,
			target: "yes-target",
			sourceHandle: `case-${step.id}-yes`,
		};
		const noEdge = {
			id: "no-edge",
			source: step.id,
			target: "no-target",
			sourceHandle: `case-${step.id}-no`,
		};
		const fallbackEdge = {
			id: "fallback-edge",
			source: step.id,
			target: "fallback-target",
			sourceHandle: `else-${step.id}`,
		};

		expect(validateCanvasWorkflowConnections(step, [yesEdge])).toEqual([
			"Every route and the fallback path must be connected",
		]);
		expect(
			validateCanvasWorkflowConnections(step, [
				yesEdge,
				noEdge,
				fallbackEdge,
			]),
		).toEqual([]);
	});
});

describe("Python source ownership", () => {
	it("strips legacy trigger setup source from the typed trigger", () => {
		const source = 'def run(scope):\n    return {"cutoff": 1}\n';
		const trigger = node("trigger.start", {
			workflowConfig: { pythonSource: source },
		});

		const saved = documentOf([trigger]);
		expect(saved.graph.nodes[0]?.config.pythonSource).toBeUndefined();
	});

	it("is left out of the node source map", () => {
		const trigger = node("trigger.start", {
			workflowCodeMode: "custom",
			workflowConfig: {
				pythonSource: "def run(scope):\n    return {}\n",
			},
		});
		expect(getCanvasNodeSources([trigger])).toEqual({});
	});

	it("is omitted rather than persisted blank", () => {
		const saved = documentOf([
			node("trigger.start", { workflowConfig: { pythonSource: "   " } }),
		]);
		expect(saved.graph.nodes[0]?.config.pythonSource).toBeUndefined();
	});

	it("strips source from every typed node", () => {
		const saved = documentOf([
			node("database.query", {
				workflowCodeMode: "custom",
				workflowConfig: {
					query: "SELECT 1",
					pythonSource: "def run(scope):\n    return {}\n",
				},
			}),
		]);
		expect(saved.graph.nodes[0]?.config.pythonSource).toBeUndefined();
	});
});

describe("trigger global inputs", () => {
	it("drops rows the user never named", () => {
		const saved = documentOf([
			node("trigger.start", {
				workflowConfig: {
					globals: [
						{ name: "lookback_days", defaultValue: "7" },
						{ name: "  ", defaultValue: "" },
					],
				},
			}),
		]);
		expect(saved.graph.nodes[0]?.config.globals).toEqual([
			{ name: "lookback_days", defaultValue: "7" },
		]);
	});
});

describe("vector node value mapping", () => {
	/**
	 * A vector node persists one `value`, which each operation's form shows under
	 * a different label. Mapping only the search field would leave add and delete
	 * nodes unable to satisfy the server's required `value`.
	 */
	it("maps the field each operation renders", () => {
		const cases = [
			{ type: "vector.search", key: "command", value: "find claims" },
			{ type: "vector.add", key: "filePath", value: "/tmp/a.pdf" },
			{ type: "vector.delete", key: "fileNames", value: "a.pdf, b.pdf" },
		] as const;

		for (const { type, key, value } of cases) {
			const step = node(type);
			const saved = documentOf([
				{ ...step, config: { ...step.config, [key]: value } },
			]);
			expect(saved.graph.nodes[0]?.config.value, type).toBe(value);
		}
	});
});

describe("optional engine parameters", () => {
	it("persists supported storage, vector, and vision options as typed values", () => {
		const upload = node("storage.upload");
		const search = node("vector.search");
		const vision = node("model.vision");
		const saved = documentOf([
			{
				...upload,
				config: {
					...(upload.config as StorageEngineConfig),
					engineId: "storage-1",
					storagePath: "archive",
					filePath: "report.pdf",
					metadata: '{"case":"123"}',
				},
			},
			{
				...search,
				config: {
					...(search.config as VectorEngineConfig),
					engineId: "vector-1",
					command: "claims",
					filters: '{"category":"report"}',
					paramValues: '{"threshold":0.7}',
				},
			},
			{
				...vision,
				config: {
					...(vision.config as ModelEngineConfig),
					engineId: "model-1",
					command: "Describe these images",
					urls: '["https://example.com/image.png"]',
					paramValues: '{"temperature":0.2}',
				},
			},
		]);

		expect(saved.graph.nodes[0]?.config.metadata).toEqual({ case: "123" });
		expect(saved.graph.nodes[1]?.config.filters).toEqual({
			category: "report",
		});
		expect(saved.graph.nodes[1]?.config.paramValues).toEqual({
			threshold: 0.7,
		});
		expect(saved.graph.nodes[2]?.config.urls).toEqual([
			"https://example.com/image.png",
		]);
		expect(saved.graph.nodes[2]?.config.paramValues).toEqual({
			temperature: 0.2,
		});
	});

	it("persists storage list file types as a typed array", () => {
		const listFiles = node("storage.list");
		const saved = documentOf([
			{
				...listFiles,
				config: {
					...(listFiles.config as StorageEngineConfig),
					fileTypes: "pdf, png, .jpg",
				},
			},
		]);

		expect(saved.graph.nodes[0]?.config.extensions).toEqual([
			"pdf",
			"png",
			".jpg",
		]);
	});
});

describe("definesRunEntryPoint", () => {
	it("accepts a top level binding", () => {
		expect(definesRunEntryPoint("def run(scope):\n    return {}\n")).toBe(
			true,
		);
		expect(
			definesRunEntryPoint("async def run(scope):\n    return {}\n"),
		).toBe(true);
		expect(definesRunEntryPoint("run = lambda scope: {}\n")).toBe(true);
	});

	/** A run nested in a class or function is not the entry point execute_node looks up. */
	it("rejects a nested or missing binding", () => {
		expect(definesRunEntryPoint("")).toBe(false);
		expect(
			definesRunEntryPoint("def helper(scope):\n    return {}\n"),
		).toBe(false);
		expect(
			definesRunEntryPoint(
				"class Job:\n    def run(self, scope):\n        return {}\n",
			),
		).toBe(false);
	});
});

describe("validateAutomationOutputVariable", () => {
	it("accepts a Python identifier", () => {
		expect(validateAutomationOutputVariable("claims_2")).toBeNull();
	});

	it("rejects names Python could not bind", () => {
		expect(validateAutomationOutputVariable("2claims")).not.toBeNull();
		expect(validateAutomationOutputVariable("with spaces")).not.toBeNull();
		expect(validateAutomationOutputVariable("class")).not.toBeNull();
	});

	/** The runtime seeds these itself; a node writing one would shadow run metadata. */
	it("rejects names the runtime owns", () => {
		for (const reserved of ["date", "triggered_at", "run_id"]) {
			expect(
				validateAutomationOutputVariable(reserved),
				reserved,
			).not.toBeNull();
		}
	});
});
