import type { Edge, Node } from "@xyflow/react";

let nodeIdCounter = 0;

const generateId = () => `node-${nodeIdCounter++}`;

export interface ParseResult {
	nodes: Node[];
	edges: Edge[];
}

interface NodePosition {
	x: number;
	y: number;
}

export function parseJsonLogicToFlow(logic: unknown): ParseResult {
	nodeIdCounter = 0;
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	if (logic && typeof logic === "object" && "if" in logic) {
		const ifStatement = (logic as { if: unknown[] }).if;
		parseIfStatement(ifStatement, nodes, edges, null, { x: 400, y: 50 });
	}

	return { nodes, edges };
}

function parseIfStatement(
	ifArray: unknown[],
	nodes: Node[],
	edges: Edge[],
	parentId: string | null,
	basePosition: NodePosition,
): string[] {
	const resultNodeIds: string[] = [];
	let currentY = basePosition.y;
	let previousConditionNodeId = parentId;

	// Process if-then-else pairs
	for (let i = 0; i < ifArray.length; i += 2) {
		const condition = ifArray[i];
		const result = ifArray[i + 1];

		// If we've reached the final else case (odd index at end)
		if (i === ifArray.length - 1) {
			const nodeId = generateId();
			nodes.push({
				id: nodeId,
				type: "result",
				data: { label: formatReturnValue(condition) },
				position: { x: basePosition.x, y: currentY },
			});
			if (previousConditionNodeId) {
				edges.push({
					id: `${previousConditionNodeId}-${nodeId}`,
					source: previousConditionNodeId,
					target: nodeId,
					label: "else",
				});
			}
			resultNodeIds.push(nodeId);
			break;
		}

		// Parse the condition into separate nodes
		const conditionNodeId = parseCondition(
			condition,
			nodes,
			edges,
			previousConditionNodeId,
			{ x: basePosition.x, y: currentY },
		);

		// Create result node for true path
		const resultNodeId = generateId();
		nodes.push({
			id: resultNodeId,
			type: "result",
			data: { label: formatReturnValue(result) },
			position: { x: basePosition.x + 500, y: currentY },
		});

		edges.push({
			id: `${conditionNodeId}-${resultNodeId}`,
			source: conditionNodeId,
			target: resultNodeId,
			label: "true",
		});

		resultNodeIds.push(resultNodeId);

		// Move to next condition vertically
		currentY = Math.max(currentY + 250, (nodes.length + 1) * 120);
		previousConditionNodeId = conditionNodeId;
	}

	return resultNodeIds;
}

function parseCondition(
	condition: unknown,
	nodes: Node[],
	edges: Edge[],
	parentId: string | null,
	position: NodePosition,
): string {
	if (typeof condition !== "object" || condition === null) {
		const nodeId = generateId();
		nodes.push({
			id: nodeId,
			type: "value",
			data: { label: String(condition) },
			position,
		});
		if (parentId) {
			edges.push({
				id: `${parentId}-${nodeId}`,
				source: parentId,
				target: nodeId,
			});
		}
		return nodeId;
	}

	// Handle AND operator
	if ("and" in condition) {
		const andNodeId = generateId();
		nodes.push({
			id: andNodeId,
			type: "operator",
			data: { label: "AND" },
			position,
		});
		if (parentId) {
			edges.push({
				id: `${parentId}-${andNodeId}`,
				source: parentId,
				target: andNodeId,
			});
		}

		const conditions = (condition as { and: unknown[] }).and;
		const childY = position.y + 150;
		const spacing = 400;
		const totalWidth = spacing * (conditions.length - 1);
		const startX = position.x - totalWidth / 2;

		conditions.forEach((cond, index) => {
			const childX = startX + index * spacing;
			parseCondition(cond, nodes, edges, andNodeId, {
				x: childX,
				y: childY,
			});
		});

		return andNodeId;
	}

	// Handle OR operator
	if ("or" in condition) {
		const orNodeId = generateId();
		nodes.push({
			id: orNodeId,
			type: "operator",
			data: { label: "OR" },
			position,
		});
		if (parentId) {
			edges.push({
				id: `${parentId}-${orNodeId}`,
				source: parentId,
				target: orNodeId,
			});
		}

		const conditions = (condition as { or: unknown[] }).or;
		const childY = position.y + 150;
		const spacing = 400;
		const totalWidth = spacing * (conditions.length - 1);
		const startX = position.x - totalWidth / 2;

		conditions.forEach((cond, index) => {
			const childX = startX + index * spacing;
			parseCondition(cond, nodes, edges, orNodeId, {
				x: childX,
				y: childY,
			});
		});

		return orNodeId;
	}

	// Handle NOT operator
	if ("!" in condition) {
		const notNodeId = generateId();
		nodes.push({
			id: notNodeId,
			type: "operator",
			data: { label: "NOT" },
			position,
		});
		if (parentId) {
			edges.push({
				id: `${parentId}-${notNodeId}`,
				source: parentId,
				target: notNodeId,
			});
		}

		const notCondition = (condition as { "!": unknown })["!"];
		parseCondition(notCondition, nodes, edges, notNodeId, {
			x: position.x,
			y: position.y + 150,
		});

		return notNodeId;
	}

	// Handle comparison operators
	const comparisonOp = getComparisonOperator(condition);
	if (comparisonOp) {
		const { operator, values } = comparisonOp;
		const compNodeId = generateId();

		// Create comparison node
		nodes.push({
			id: compNodeId,
			type: "operator",
			data: { label: operator },
			position,
		});

		if (parentId) {
			edges.push({
				id: `${parentId}-${compNodeId}`,
				source: parentId,
				target: compNodeId,
			});
		}

		// Create operand nodes
		const leftNodeId = generateId();
		const rightNodeId = generateId();
		const operandY = position.y + 150;

		nodes.push({
			id: leftNodeId,
			type: "value",
			data: { label: formatValue(values[0]) },
			position: { x: position.x - 200, y: operandY },
		});

		nodes.push({
			id: rightNodeId,
			type: "value",
			data: { label: formatValue(values[1]) },
			position: { x: position.x + 200, y: operandY },
		});

		edges.push({
			id: `${compNodeId}-${leftNodeId}`,
			source: compNodeId,
			target: leftNodeId,
		});

		edges.push({
			id: `${compNodeId}-${rightNodeId}`,
			source: compNodeId,
			target: rightNodeId,
		});

		return compNodeId;
	}

	// Fallback: create a node with JSON representation
	const nodeId = generateId();
	nodes.push({
		id: nodeId,
		type: "value",
		data: { label: JSON.stringify(condition, null, 2) },
		position,
	});
	if (parentId) {
		edges.push({
			id: `${parentId}-${nodeId}`,
			source: parentId,
			target: nodeId,
		});
	}
	return nodeId;
}

function getComparisonOperator(
	condition: unknown,
): { operator: string; values: unknown[] } | null {
	if (typeof condition !== "object" || condition === null) {
		return null;
	}

	const operators = ["==", "!=", ">", "<", ">=", "<="];
	for (const op of operators) {
		if (op in condition) {
			return {
				operator: op,
				values: (condition as Record<string, unknown[]>)[op],
			};
		}
	}

	return null;
}

function formatValue(value: unknown): string {
	if (typeof value !== "object" || value === null) {
		return JSON.stringify(value);
	}

	if ("var" in value) {
		const varPath = (value as { var: string }).var;
		// Show just the last part of the path for readability
		const parts = varPath.split(".");
		return parts[parts.length - 1] || varPath;
	}

	return JSON.stringify(value);
}

function formatReturnValue(value: unknown): string {
	if (typeof value === "string") {
		return `"${value}"`;
	}
	return JSON.stringify(value);
}
