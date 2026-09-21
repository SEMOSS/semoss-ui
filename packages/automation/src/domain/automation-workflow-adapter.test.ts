import { beforeAll, describe, expect, it } from "vitest";
import type { AutomationNode } from "./automation.types";
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
	getGeneratedPythonPreview,
	validateAutomationOutputVariable,
} from "./automation-workflow-adapter";

/**
 * Minimal stand-in for the backend node catalog. Nothing in the domain layer
 * works until setAutomationNodeDefinitions has run, because the adapter reads a
 * node's category and defaults straight off its definition. These mirror
 * AutomationNodeCatalog.createDefinitions closely enough for the pure mapping
 * functions to behave the same.
 */
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
	definition("trigger.start", "trigger", "Start", {}, false),
	definition("database.query", "database", "Query database", {
		engineId: "",
		query: "",
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
	definition("model.chat", "model", "Chat model", {
		engineId: "",
		prompt: "",
	}),
	definition("control.if", "control", "Decision", {
		clauses: [{ id: "initial", condition: "" }],
	}),
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

describe("getGeneratedPythonPreview", () => {
	/**
	 * `resolve` is a method on the scope mapping the runtime passes in, not a
	 * builtin. A bare `resolve(...)` raises NameError as soon as a user edits the
	 * preview into a custom node, which is how this code reaches production.
	 */
	it("resolves through scope for every node type", () => {
		for (const definition of TEST_NODE_DEFINITIONS) {
			const source = getGeneratedPythonPreview(node(definition.type));
			const total = source.match(/resolve\(/g)?.length ?? 0;
			const qualified = source.match(/scope\.resolve\(/g)?.length ?? 0;
			expect(
				qualified,
				`${definition.type} must call scope.resolve`,
			).toBe(total);
		}
	});

	it("uses the write method matching each database operation", () => {
		expect(getGeneratedPythonPreview(node("database.insert"))).toContain(
			"database.insertData(query=scope.resolve(QUERY))",
		);
		expect(getGeneratedPythonPreview(node("database.update"))).toContain(
			"database.updateData(query=scope.resolve(QUERY))",
		);
		expect(getGeneratedPythonPreview(node("database.delete"))).toContain(
			"database.removeData(query=scope.resolve(QUERY))",
		);
	});

	/** execQuery only runs SELECT, so a write must never fall back to it. */
	it("never renders a read call for a write node", () => {
		for (const type of [
			"database.insert",
			"database.update",
			"database.delete",
		] as const) {
			expect(getGeneratedPythonPreview(node(type))).not.toContain(
				"execQuery",
			);
		}
		expect(getGeneratedPythonPreview(node("database.query"))).toContain(
			"execQuery",
		);
	});

	/**
	 * The server compares a persisted trigger source against the identical
	 * template in AutomationSourceRenderer.triggerSource to decide whether the
	 * trigger is still generated. Drift on either side marks every untouched
	 * trigger custom, so the exact bytes are the contract.
	 */
	it("matches the server trigger template byte for byte", () => {
		expect(getGeneratedPythonPreview(node("trigger.start"))).toBe(
			[
				"# Declare globals in trigger.start config.globals.",
				"# Define optional setup here; return a map only for additional runtime values.",
				"def run(scope):",
				"    return {}",
				"",
			].join("\n"),
		);
	});

	it("always emits a run entry point", () => {
		for (const definition of TEST_NODE_DEFINITIONS) {
			expect(
				definesRunEntryPoint(
					getGeneratedPythonPreview(node(definition.type)),
				),
				`${definition.type} must define run(scope)`,
			).toBe(true);
		}
	});
});

describe("trigger setup source", () => {
	/**
	 * Every other node persists its Python as a file under automation-nodes/. The
	 * trigger has none, so config is the only place its setup source can live and
	 * the save path has to keep it.
	 */
	it("survives a save and reload round trip", () => {
		const source = 'def run(scope):\n    return {"cutoff": 1}\n';
		const trigger = node("trigger.start", {
			workflowConfig: { pythonSource: source },
		});

		const saved = documentOf([trigger]);
		expect(saved.graph.nodes[0]?.config.pythonSource).toBe(source);

		const reloaded = canvasDocumentFromWorkflow(saved, {});
		expect(reloaded.steps[0]?.workflowConfig?.pythonSource).toBe(source);
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

	/** Non-trigger nodes keep their source in a file, so config must not duplicate it. */
	it("is stripped from every other node type", () => {
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
