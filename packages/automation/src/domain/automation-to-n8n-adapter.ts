/**
 * Best-effort converter from our `AutomationWorkflowDocument` + node sources into an
 * n8n-importable workflow JSON — the inverse of `n8n-import-adapter.ts`.
 *
 * Only `trigger.start`, `control.wait`, `control.if`, and `developer.python` steps whose
 * source matches our own generated `scope["x"] = ...` shape have a clean n8n equivalent
 * (`manualTrigger`, `wait`, `if`, `set`). Everything else (arbitrary Python, `model.chat`,
 * database/storage/vector/model/function/agent/app steps) has no n8n node type to match,
 * so it's exported as an `n8n-nodes-base.code` node running the original Python (or a
 * `NotImplementedError` stub describing the step) — callers should surface `warnings`.
 * A node with two or more incoming control edges (our merge-into-one-node support) gets a
 * synthesized `n8n-nodes-base.merge` node inserted ahead of it, since n8n has no other way
 * to represent that.
 */

import type {
	AutomationWorkflowDocument,
	AutomationWorkflowNode,
} from "./automation-workflow.types";
import type { AutomationNodeSources } from "./automation-workflow-adapter";
import { parseBranchCondition } from "./branch-condition";

export interface N8nExportResult {
	workflow: Record<string, unknown>;
	warnings: string[];
}

interface ExportedN8nNode {
	id: string;
	name: string;
	type: string;
	typeVersion: number;
	position: [number, number];
	parameters: Record<string, unknown>;
}

type ConnectionTarget = { node: string; type: "main"; index: number };
type Connections = Record<string, { main: (ConnectionTarget[] | null)[] }>;

const OPERATOR_TO_N8N: Record<string, string> = {
	equals: "equals",
	notEquals: "notEquals",
	greaterThan: "gt",
	greaterThanOrEqual: "gte",
	lessThan: "lt",
	lessThanOrEqual: "lte",
};

function operandToN8nValue(token: string): {
	value: unknown;
	isField: boolean;
} {
	const field = token.match(/^\$\{([^}]+)\}$/);
	if (field) return { value: `={{ $json.${field[1]} }}`, isField: true };
	if (/^-?\d+(\.\d+)?$/.test(token))
		return { value: Number(token), isField: false };
	return { value: token, isField: false };
}

/** Translates a subset of Python expressions back to n8n's `{{ }}` template syntax. */
function pythonExpressionToN8n(
	raw: string,
): { value: string | number | boolean; type: "string" | "number" } | null {
	const trimmed = raw.trim();
	if (trimmed === "datetime.datetime.utcnow().isoformat()") {
		return { value: "={{ $now.toISO() }}", type: "string" };
	}
	const jsonField = trimmed.match(
		/^scope\.get\((?:"|')([a-zA-Z0-9_]+)(?:"|')\)$/,
	);
	if (jsonField) {
		return { value: `={{ $json.${jsonField[1]} }}`, type: "string" };
	}
	const randintMatch = trimmed.match(
		/^random\.randint\((-?\d+),\s*(-?\d+)\)$/,
	);
	if (randintMatch) {
		const base = Number(randintMatch[1]);
		const upper = Number(randintMatch[2]);
		const value =
			base === 0
				? `={{ Math.floor(Math.random() * ${upper + 1}) }}`
				: `={{ Math.floor(Math.random() * ${upper - base + 1}) + ${base} }}`;
		return { value, type: "number" };
	}
	try {
		const parsed = JSON.parse(trimmed);
		if (typeof parsed === "string")
			return { value: parsed, type: "string" };
		if (typeof parsed === "number")
			return { value: parsed, type: "number" };
		if (typeof parsed === "boolean") {
			return { value: parsed, type: "string" };
		}
	} catch {
		// fall through — unparseable expression
	}
	return null;
}

/** Reverses `assignmentsToPython()` from the n8n importer; `null` means "not that shape". */
function assignmentsFromPythonSource(
	source: string,
): Array<{ id: string; name: string; value: unknown; type: string }> | null {
	const lines = source.split("\n").map((line) => line.trim());
	const assignments: Array<{
		id: string;
		name: string;
		value: unknown;
		type: string;
	}> = [];
	let index = 0;
	for (const line of lines) {
		if (
			line === "" ||
			line.startsWith("import ") ||
			line.startsWith("def run(scope):") ||
			line === "return scope" ||
			line === "pass"
		) {
			continue;
		}
		const match = line.match(
			/^scope\[(?:"|')([a-zA-Z0-9_]+)(?:"|')\]\s*=\s*(.+)$/,
		);
		if (!match) return null;
		const [, name, rawValue] = match;
		const translated = pythonExpressionToN8n(rawValue);
		if (translated === null) return null;
		assignments.push({
			id: `a${index++}`,
			name,
			value: translated.value,
			type: translated.type,
		});
	}
	return assignments;
}

function ifNodeParameters(
	condition: string,
	warnings: string[],
	nodeName: string,
): Record<string, unknown> {
	const parsed = parseBranchCondition(condition);
	if (!parsed) {
		warnings.push(
			`"${nodeName}": condition "${condition}" couldn't be translated to n8n's simple builder — exported comparing the raw text to "true", edit it manually in n8n.`,
		);
		return {
			conditions: {
				options: {
					caseSensitive: true,
					typeValidation: "strict",
					version: 2,
				},
				conditions: [
					{
						id: "cond",
						leftValue: condition,
						rightValue: "true",
						operator: { type: "string", operation: "equals" },
					},
				],
				combinator: "and",
			},
			options: {},
		};
	}
	const operation = OPERATOR_TO_N8N[parsed.operator] ?? "equals";
	const left = operandToN8nValue(parsed.value1);
	const right = operandToN8nValue(parsed.value2);
	return {
		conditions: {
			options: {
				caseSensitive: true,
				typeValidation: "strict",
				version: 2,
			},
			conditions: [
				{
					id: "cond",
					leftValue: left.value,
					rightValue: right.value,
					operator: {
						type:
							typeof right.value === "number"
								? "number"
								: "string",
						operation,
					},
				},
			],
			combinator: "and",
		},
		options: {},
	};
}

function codeNodeParameters(pythonSource: string): Record<string, unknown> {
	return {
		language: "python",
		mode: "runOnceForAllItems",
		pythonCode: pythonSource,
	};
}

function mapNode(
	node: AutomationWorkflowNode,
	nodeSources: AutomationNodeSources,
	warnings: string[],
): { type: string; typeVersion: number; parameters: Record<string, unknown> } {
	switch (node.type) {
		case "trigger.start":
			return {
				type: "n8n-nodes-base.manualTrigger",
				typeVersion: 1,
				parameters: {},
			};
		case "control.wait": {
			const amount = node.config.durationSeconds;
			return {
				type: "n8n-nodes-base.wait",
				typeVersion: 1.1,
				parameters: { amount: typeof amount === "number" ? amount : 5 },
			};
		}
		case "control.if": {
			const rawClauses = node.config.clauses;
			const clauses = Array.isArray(rawClauses)
				? rawClauses.filter(
						(clause): clause is { id: string; condition: string } =>
							!!clause &&
							typeof clause === "object" &&
							typeof (clause as { condition?: unknown })
								.condition === "string",
					)
				: [];
			if (clauses.length > 1) {
				warnings.push(
					`"${node.label}": only the first condition was exported — n8n's If node supports a single true/false split, not multiple ordered clauses.`,
				);
			}
			const condition = clauses[0]?.condition ?? "";
			return {
				type: "n8n-nodes-base.if",
				typeVersion: 2.2,
				parameters: ifNodeParameters(condition, warnings, node.label),
			};
		}
		case "developer.python": {
			const source =
				nodeSources[node.id] ??
				(typeof node.config.pythonSource === "string"
					? node.config.pythonSource
					: "");
			const assignments = assignmentsFromPythonSource(source);
			if (assignments) {
				return {
					type: "n8n-nodes-base.set",
					typeVersion: 3.5,
					parameters: { assignments: { assignments }, options: {} },
				};
			}
			return {
				type: "n8n-nodes-base.code",
				typeVersion: 2,
				parameters: codeNodeParameters(source),
			};
		}
		case "model.chat": {
			warnings.push(
				`"${node.label}": exported as an n8n AI Agent node, but its model/credentials aren't set — reconfigure the chat model in n8n.`,
			);
			return {
				type: "@n8n/n8n-nodes-langchain.agent",
				typeVersion: 3.1,
				parameters: {
					promptType: "define",
					text:
						typeof node.config.prompt === "string"
							? node.config.prompt
							: "",
					options: {
						systemMessage:
							typeof node.config.systemPrompt === "string"
								? node.config.systemPrompt
								: "",
					},
				},
			};
		}
		default: {
			warnings.push(
				`"${node.label}" (${node.type}) has no n8n equivalent — exported as a Code node stub, reimplement it manually in n8n.`,
			);
			const pythonSource =
				nodeSources[node.id] ??
				(typeof node.config.pythonSource === "string"
					? node.config.pythonSource
					: `def run(scope):\n    raise NotImplementedError(${JSON.stringify(
							`Reimplement SEMOSS step "${node.label}" (${node.type})`,
						)})\n`);
			return {
				type: "n8n-nodes-base.code",
				typeVersion: 2,
				parameters: codeNodeParameters(pythonSource),
			};
		}
	}
}

export function automationDocumentToN8nWorkflow(
	workflowDocument: AutomationWorkflowDocument,
	nodeSources: AutomationNodeSources,
	name: string,
): N8nExportResult {
	const warnings: string[] = [];
	const nodesById = new Map(
		workflowDocument.graph.nodes.map((n) => [n.id, n]),
	);
	const controlEdges = workflowDocument.graph.edges.filter(
		(e) => e.kind === "control",
	);
	const dataEdges = workflowDocument.graph.edges.filter(
		(e) => e.kind === "data",
	);
	if (dataEdges.length > 0) {
		warnings.push(
			`${dataEdges.length} data connection${dataEdges.length === 1 ? "" : "s"} were dropped — n8n only models control-flow connections between nodes.`,
		);
	}

	const incomingByTarget = new Map<string, typeof controlEdges>();
	for (const edge of controlEdges) {
		incomingByTarget.set(edge.target, [
			...(incomingByTarget.get(edge.target) ?? []),
			edge,
		]);
	}

	const exportedNodes: ExportedN8nNode[] = [];
	const idToName = new Map<string, string>();
	const usedNames = new Set<string>();
	function uniqueName(base: string): string {
		let candidate = base || "Step";
		let suffix = 2;
		while (usedNames.has(candidate)) {
			candidate = `${base} (${suffix++})`;
		}
		usedNames.add(candidate);
		return candidate;
	}

	for (const node of workflowDocument.graph.nodes) {
		const name = uniqueName(node.label || node.type);
		idToName.set(node.id, name);
	}

	for (const node of workflowDocument.graph.nodes) {
		const mapped = mapNode(node, nodeSources, warnings);
		exportedNodes.push({
			id: node.id,
			name: idToName.get(node.id) as string,
			type: mapped.type,
			typeVersion: mapped.typeVersion,
			position: [node.position.x, node.position.y],
			parameters: mapped.parameters,
		});
	}

	const connections: Connections = {};
	function addConnection(
		sourceName: string,
		outputIndex: number,
		targetName: string,
	) {
		const entry = connections[sourceName] ?? { main: [] };
		while (entry.main.length <= outputIndex) entry.main.push([]);
		const branch = entry.main[outputIndex] ?? [];
		branch.push({ node: targetName, type: "main", index: 0 });
		entry.main[outputIndex] = branch;
		connections[sourceName] = entry;
	}

	function sourceOutputIndex(edge: (typeof controlEdges)[number]): number {
		if (edge.sourcePort === "else") return 1;
		if (edge.sourcePort.startsWith("case:")) return 0;
		return 0;
	}

	for (const [targetId, incoming] of incomingByTarget) {
		const targetName = idToName.get(targetId);
		if (!targetName) continue;
		if (incoming.length <= 1) {
			for (const edge of incoming) {
				const sourceName = idToName.get(edge.source);
				if (!sourceName) continue;
				addConnection(sourceName, sourceOutputIndex(edge), targetName);
			}
			continue;
		}
		// Two or more control edges into one node — synthesize a merge node ahead of it.
		const targetNode = nodesById.get(targetId);
		const mergeId = `merge-${targetId}`;
		const mergeName = uniqueName(
			`Merge into ${targetNode?.label ?? targetName}`,
		);
		idToName.set(mergeId, mergeName);
		exportedNodes.push({
			id: mergeId,
			name: mergeName,
			type: "n8n-nodes-base.merge",
			typeVersion: 3.2,
			position: targetNode
				? [targetNode.position.x - 120, targetNode.position.y]
				: [0, 0],
			parameters: {},
		});
		incoming.forEach((edge, inputIndex) => {
			const sourceName = idToName.get(edge.source);
			if (!sourceName) return;
			const entry = connections[sourceName] ?? { main: [] };
			const outputIndex = sourceOutputIndex(edge);
			while (entry.main.length <= outputIndex) entry.main.push([]);
			const branch = entry.main[outputIndex] ?? [];
			branch.push({ node: mergeName, type: "main", index: inputIndex });
			entry.main[outputIndex] = branch;
			connections[sourceName] = entry;
		});
		addConnection(mergeName, 0, targetName);
	}

	return {
		workflow: {
			name,
			nodes: exportedNodes,
			connections,
			pinData: {},
			active: false,
			settings: { executionOrder: "v1" },
		},
		warnings,
	};
}

export function downloadN8nExport(
	fileNameBase: string,
	workflowDocument: AutomationWorkflowDocument,
	nodeSources: AutomationNodeSources,
): string[] {
	const { workflow, warnings } = automationDocumentToN8nWorkflow(
		workflowDocument,
		nodeSources,
		fileNameBase || "automation",
	);
	const blob = new Blob([JSON.stringify(workflow, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `${fileNameBase || "automation"}.n8n.json`;
	anchor.click();
	URL.revokeObjectURL(url);
	return warnings;
}
