/**
 * Best-effort converter from an exported n8n workflow JSON into our
 * `AutomationWorkflowDocument` + node-source format (see `automation-workflow-adapter.ts`).
 *
 * Only a narrow subset of n8n is directly translated: `manualTrigger`, `wait`, `set`, `if`,
 * `merge`, and the LangChain `agent` node (mapped to our `model.chat`). Any other node type
 * becomes a placeholder `developer.python` step (raising `NotImplementedError`) so the graph's
 * shape and connections are preserved and the gap is visible on the canvas, not just in
 * `warnings` — callers should still surface `warnings` to the user after import. Sticky notes
 * and the LangChain agent's paired chat-model sub-node (e.g. `lmChatOpenAi`) are silently
 * dropped instead, since neither represents an executable step.
 *
 * Assumption to verify against the backend: generated `Set`-equivalent Python writes
 * fields directly onto `scope` (e.g. `scope["records_found"] = ...`) so that downstream
 * `${records_found}`-style condition/variable references resolve the same way n8n's
 * `$json.records_found` would. If the backend instead namespaces each node's return value
 * under its own `outputVar`, downstream `${var}` references generated here will need an
 * `outputVar["field"]`-style rewrite instead.
 */

import type {
	AutomationWorkflowDocument,
	AutomationWorkflowEdge,
	AutomationWorkflowNode,
	AutomationWorkflowNodeConfig,
	AutomationWorkflowNodeType,
	TriggerBinding,
} from "./automation-workflow.types";
import type { AutomationNodeSources } from "./automation-workflow-adapter";

export interface N8nConnectionTarget {
	node: string;
	type: string;
	index: number;
}

export interface N8nCondition {
	leftValue: unknown;
	rightValue: unknown;
	operator?: { operation?: string };
}

export interface N8nNode {
	id: string;
	name: string;
	type: string;
	position?: [number, number];
	parameters?: Record<string, unknown>;
}

export interface N8nWorkflow {
	name?: string;
	nodes: N8nNode[];
	/** Keyed by connection type ("main", "ai_languageModel", ...) — only "main" is used for control flow. */
	connections: Record<
		string,
		Record<string, (N8nConnectionTarget[] | null)[] | undefined>
	>;
}

export interface N8nImportResult {
	document: AutomationWorkflowDocument;
	nodeSources: AutomationNodeSources;
	/** Human-readable notes about anything dropped or best-effort translated. */
	warnings: string[];
}

/** Non-step nodes dropped without a placeholder or warning: sticky notes, and sub-resource nodes wired via a non-"main" connection (e.g. a chat model feeding an agent). */
const IGNORED_N8N_TYPES = new Set([
	"n8n-nodes-base.stickyNote",
	"@n8n/n8n-nodes-langchain.lmChatOpenAi",
]);

const OPERATOR_SYMBOLS: Record<string, string> = {
	equals: "==",
	notEquals: "!=",
	gt: ">",
	gte: ">=",
	lt: "<",
	lte: "<=",
};

function sanitizeVarName(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "") || "value"
	);
}

/** Translates a subset of n8n's `{{ }}` expression syntax to Python; unknown expressions become `None`. */
function jsExpressionToPython(
	raw: string,
	warnings: string[],
	nodeName: string,
): string {
	const templateMatch = raw.trim().match(/^=?\{\{([\s\S]*)\}\}$/);
	if (!templateMatch) return JSON.stringify(raw);
	const expr = templateMatch[1].trim();
	if (/^\$now\.toISO\(\)$/.test(expr)) {
		return "datetime.datetime.utcnow().isoformat()";
	}
	const jsonField = expr.match(/^\$json\.([a-zA-Z0-9_]+)$/);
	if (jsonField) return `scope.get(${JSON.stringify(jsonField[1])})`;
	const randomRange = expr.match(
		/^Math\.floor\(Math\.random\(\)\s*\*\s*(\d+)\)\s*\+\s*(\d+)$/,
	);
	if (randomRange) {
		const span = Number(randomRange[1]);
		const base = Number(randomRange[2]);
		return `random.randint(${base}, ${base + span - 1})`;
	}
	const randomFloor = expr.match(
		/^Math\.floor\(Math\.random\(\)\s*\*\s*(\d+)\)$/,
	);
	if (randomFloor) return `random.randint(0, ${Number(randomFloor[1]) - 1})`;
	warnings.push(
		`"${nodeName}": couldn't translate expression "${expr}" — left as None, edit the generated Python.`,
	);
	return "None";
}

function operandToken(value: unknown): string {
	if (typeof value === "number") return String(value);
	if (typeof value === "string") {
		const field = value
			.trim()
			.match(/^=?\{\{\s*\$json\.([a-zA-Z0-9_]+)\s*\}\}$/);
		if (field) return `\${${field[1]}}`;
		return JSON.stringify(value);
	}
	return "None";
}

function conditionToExpression(
	condition: N8nCondition,
	warnings: string[],
	nodeName: string,
): string {
	const operation = condition.operator?.operation ?? "equals";
	const symbol = OPERATOR_SYMBOLS[operation];
	if (!symbol) {
		warnings.push(
			`"${nodeName}": unsupported condition operator "${operation}", defaulted to "==".`,
		);
	}
	return `${operandToken(condition.leftValue)} ${symbol ?? "=="} ${operandToken(condition.rightValue)}`;
}

function conditionsToExpression(
	conditions: N8nCondition[],
	combinator: string | undefined,
	warnings: string[],
	nodeName: string,
): string {
	if (conditions.length === 0) return "True";
	if (conditions.length === 1) {
		return conditionToExpression(conditions[0], warnings, nodeName);
	}
	const glue = combinator === "or" ? " or " : " and ";
	return conditions
		.map((c) => `(${conditionToExpression(c, warnings, nodeName)})`)
		.join(glue);
}

function assignmentsToPython(n8nNode: N8nNode, warnings: string[]): string {
	const assignments =
		(
			n8nNode.parameters?.assignments as
				| { assignments?: Array<{ name: string; value: unknown }> }
				| undefined
		)?.assignments ?? [];
	const lines = assignments.map((assignment) => {
		const value =
			typeof assignment.value === "string"
				? jsExpressionToPython(assignment.value, warnings, n8nNode.name)
				: JSON.stringify(assignment.value ?? null);
		return `    scope[${JSON.stringify(assignment.name)}] = ${value}`;
	});
	return [
		"import datetime",
		"import random",
		"",
		"def run(scope):",
		...(lines.length > 0 ? lines : ["    pass"]),
		"    return scope",
		"",
	].join("\n");
}

interface MappedNode {
	type: AutomationWorkflowNodeType;
	config: AutomationWorkflowNodeConfig;
	codeMode: "generated" | "custom";
	pythonSource?: string;
	/** Overrides the canvas label (e.g. to flag a placeholder step). */
	label?: string;
}

/** Translates `{{ $json.field }}` references inline within free-form text (e.g. a prompt); leaves other `{{ }}` expressions as-is and warns. */
function translateInlineTemplate(
	raw: string,
	warnings: string[],
	nodeName: string,
): string {
	const withoutLeadingEquals = raw.replace(/^=/, "");
	const withFieldRefs = withoutLeadingEquals.replace(
		/\{\{\s*\$json\.([a-zA-Z0-9_]+)\s*\}\}/g,
		(_match, field: string) => `\${${field}}`,
	);
	return withFieldRefs.replace(/\{\{[^}]*\}\}/g, (match) => {
		warnings.push(
			`"${nodeName}": couldn't translate template ${match} — left as-is, edit it manually.`,
		);
		return match;
	});
}

/** Finds the model label of the chat-model sub-node feeding a LangChain agent via its `ai_languageModel` connection. */
function findLanguageModelLabel(
	agentName: string,
	workflow: N8nWorkflow,
): string | undefined {
	for (const [sourceName, connection] of Object.entries(
		workflow.connections,
	)) {
		const targets = connection.ai_languageModel;
		if (!targets) continue;
		const linked = targets.some((branch) =>
			(branch ?? []).some((target) => target.node === agentName),
		);
		if (!linked) continue;
		const modelNode = workflow.nodes.find((n) => n.name === sourceName);
		const modelValue = (
			modelNode?.parameters?.model as { value?: string } | undefined
		)?.value;
		return modelValue ?? sourceName;
	}
	return undefined;
}

function mapNode(
	n8nNode: N8nNode,
	workflow: N8nWorkflow,
	warnings: string[],
): MappedNode | undefined {
	switch (n8nNode.type) {
		case "n8n-nodes-base.manualTrigger":
			return { type: "trigger.start", config: {}, codeMode: "generated" };
		case "n8n-nodes-base.wait": {
			const amount = Number(n8nNode.parameters?.amount ?? 1);
			return {
				type: "control.wait",
				config: {
					durationSeconds: Number.isFinite(amount) ? amount : 1,
				},
				codeMode: "generated",
			};
		}
		case "n8n-nodes-base.if": {
			const conditionsParam = n8nNode.parameters?.conditions as
				| { conditions?: N8nCondition[]; combinator?: string }
				| undefined;
			const expression = conditionsToExpression(
				conditionsParam?.conditions ?? [],
				conditionsParam?.combinator,
				warnings,
				n8nNode.name,
			);
			return {
				type: "control.if",
				config: { clauses: [{ id: "cond", condition: expression }] },
				codeMode: "generated",
			};
		}
		case "n8n-nodes-base.set": {
			const pythonSource = assignmentsToPython(n8nNode, warnings);
			return {
				type: "developer.python",
				config: { pythonSource },
				codeMode: "custom",
				pythonSource,
			};
		}
		case "@n8n/n8n-nodes-langchain.agent": {
			const promptRaw = n8nNode.parameters?.text;
			const prompt =
				typeof promptRaw === "string"
					? translateInlineTemplate(promptRaw, warnings, n8nNode.name)
					: "";
			const systemPrompt =
				(
					n8nNode.parameters?.options as
						| { systemMessage?: string }
						| undefined
				)?.systemMessage ?? "";
			const modelLabel = findLanguageModelLabel(n8nNode.name, workflow);
			warnings.push(
				modelLabel
					? `"${n8nNode.name}": select a model engine (n8n used "${modelLabel}") \u2014 it isn't set automatically.`
					: `"${n8nNode.name}": select a model engine \u2014 it isn't set automatically.`,
			);
			return {
				type: "model.chat",
				config: { engineId: "", systemPrompt, prompt },
				codeMode: "generated",
			};
		}
		default: {
			warnings.push(
				`"${n8nNode.name}": no mapping for n8n node type "${n8nNode.type}" — added as a placeholder Python step, fill it in manually.`,
			);
			const pythonSource = [
				"def run(scope):",
				`    raise NotImplementedError(${JSON.stringify(`Port n8n node "${n8nNode.name}" (${n8nNode.type}) to Python`)})`,
				"",
			].join("\n");
			return {
				type: "developer.python",
				config: { pythonSource },
				codeMode: "custom",
				pythonSource,
				label: `\u26a0\ufe0f ${n8nNode.name}`,
			};
		}
	}
}

function sourcePortFor(n8nNode: N8nNode, outputIndex: number): string {
	if (n8nNode.type === "n8n-nodes-base.if") {
		return outputIndex === 0 ? "case:cond" : "else";
	}
	return "out";
}

export function n8nWorkflowToAutomationDocument(
	workflow: N8nWorkflow,
): N8nImportResult {
	const warnings: string[] = [];
	const byName = new Map(workflow.nodes.map((n) => [n.name, n]));
	const mergeNames = new Set(
		workflow.nodes
			.filter((n) => n.type === "n8n-nodes-base.merge")
			.map((n) => n.name),
	);

	// Merge nodes have no equivalent — control edges already support two incoming
	// paths on the same node, so drop the merge node and reroute through its output.
	function firstOutput(name: string): N8nConnectionTarget | undefined {
		return workflow.connections[name]?.main?.[0]?.[0] ?? undefined;
	}
	function resolveTarget(
		target: N8nConnectionTarget,
		seen: Set<string> = new Set(),
	): N8nConnectionTarget | undefined {
		if (!mergeNames.has(target.node) || seen.has(target.node)) {
			return target;
		}
		seen.add(target.node);
		const next = firstOutput(target.node);
		return next ? resolveTarget(next, seen) : undefined;
	}

	if (
		!workflow.nodes.some((n) => n.type === "n8n-nodes-base.manualTrigger")
	) {
		warnings.push("No manual trigger found in this workflow.");
	}

	const nodes: AutomationWorkflowNode[] = [];
	const nodeSources: AutomationNodeSources = {};

	for (const n8nNode of workflow.nodes) {
		if (mergeNames.has(n8nNode.name) || IGNORED_N8N_TYPES.has(n8nNode.type))
			continue;
		const mapped = mapNode(n8nNode, workflow, warnings);
		if (!mapped) continue;
		nodes.push({
			id: n8nNode.id,
			type: mapped.type,
			label: mapped.label ?? n8nNode.name,
			...(mapped.type === "trigger.start"
				? {}
				: { outputVar: sanitizeVarName(n8nNode.name) }),
			position: {
				x: n8nNode.position?.[0] ?? 0,
				y: n8nNode.position?.[1] ?? 0,
			},
			config: mapped.config,
			codeMode: mapped.codeMode,
		});
		if (mapped.pythonSource) nodeSources[n8nNode.id] = mapped.pythonSource;
	}

	const edges: AutomationWorkflowEdge[] = [];
	const createdNodeIds = new Set(nodes.map((node) => node.id));
	for (const [sourceName, connection] of Object.entries(
		workflow.connections,
	)) {
		if (mergeNames.has(sourceName)) continue;
		const sourceNode = byName.get(sourceName);
		if (!sourceNode || !createdNodeIds.has(sourceNode.id)) continue;
		(connection.main ?? []).forEach((branch, outputIndex) => {
			for (const target of branch ?? []) {
				const resolved = resolveTarget(target);
				if (!resolved) continue;
				const targetNode = byName.get(resolved.node);
				if (!targetNode || !createdNodeIds.has(targetNode.id)) {
					warnings.push(
						`Skipped connection into dropped node "${resolved.node}".`,
					);
					continue;
				}
				edges.push({
					id: `e-${sourceNode.id}-${targetNode.id}-${outputIndex}`,
					kind: "control",
					source: sourceNode.id,
					sourcePort: sourcePortFor(sourceNode, outputIndex),
					target: targetNode.id,
					targetPort: "in",
				});
			}
		});
	}

	const triggerBindings: TriggerBinding[] = [
		{ id: "manual", type: "manual" },
	];

	return {
		document: {
			formatVersion: 2,
			...(workflow.name
				? { description: `Imported from n8n: ${workflow.name}` }
				: {}),
			triggerBindings,
			graph: { nodes, edges },
		},
		nodeSources,
		warnings,
	};
}

/** Parses and shape-validates a raw n8n export before conversion. */
export function parseN8nWorkflowJson(raw: string): N8nWorkflow {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("File is not valid JSON.");
	}
	if (
		!parsed ||
		typeof parsed !== "object" ||
		!Array.isArray((parsed as { nodes?: unknown }).nodes) ||
		typeof (parsed as { connections?: unknown }).connections !== "object"
	) {
		throw new Error("File doesn't look like an n8n workflow export.");
	}
	return parsed as N8nWorkflow;
}
