import type { Edge, Node } from "@xyflow/react";

/**
 * Reconstructs JSON Logic from ReactFlow nodes and edges
 */
export function flowToJsonLogic(nodes: Node[], edges: Edge[]): unknown {
	// Find all result nodes
	const resultNodes = nodes.filter((node) => node.type === "result");

	if (resultNodes.length === 0) {
		// No result nodes - return a partial structure showing available conditions
		const operators = nodes.filter((node) => node.type === "operator");
		if (operators.length > 0) {
			return {
				_incomplete: true,
				_message: "Add result nodes and connect them to conditions",
				_availableNodes: operators.map((n) => ({
					id: n.id,
					operator: n.data.label,
				})),
			};
		}
		return null;
	}

	// Build an if-statement structure
	const ifArray: unknown[] = [];

	// Sort result nodes to maintain consistent ordering
	// Nodes connected with "true" edges first, then "else" edges
	const sortedResults = [...resultNodes].sort((a, b) => {
		const aEdge = edges.find((e) => e.target === a.id);
		const bEdge = edges.find((e) => e.target === b.id);
		const aLabel = aEdge?.label || "";
		const bLabel = bEdge?.label || "";

		if (aLabel === "true" && bLabel !== "true") return -1;
		if (aLabel !== "true" && bLabel === "true") return 1;
		return 0;
	});

	// Find nodes that lead to result nodes
	for (const resultNode of sortedResults) {
		// Find edges leading to this result node
		const incomingEdge = edges.find(
			(edge) => edge.target === resultNode.id,
		);

		if (!incomingEdge) {
			// This is a standalone result (else case)
			const value = parseResultValue(
				(resultNode.data.label as string) || "",
			);
			ifArray.push(value);
			continue;
		}

		// Get the condition node
		const conditionNodeId = incomingEdge.source;
		const condition = reconstructCondition(conditionNodeId, nodes, edges);

		// Get the result value
		const value = parseResultValue((resultNode.data.label as string) || "");

		// Check if this is a true or else branch
		// If no label, assume "true" for operator->result connections
		const edgeLabel = incomingEdge.label || (condition ? "true" : "else");

		if (edgeLabel === "true") {
			// Only add if condition is valid
			if (condition !== null) {
				ifArray.push(condition, value);
			}
		} else if (edgeLabel === "else") {
			// Else case - just add the value
			ifArray.push(value);
		}
	}

	if (ifArray.length === 0) {
		return {
			_incomplete: true,
			_message:
				"Connect conditions to result nodes to build if-statements",
		};
	}

	return { if: ifArray };
}

/**
 * Reconstructs a condition from a node and its children
 */
function reconstructCondition(
	nodeId: string,
	nodes: Node[],
	edges: Edge[],
): unknown {
	const node = nodes.find((n) => n.id === nodeId);

	if (!node) {
		return null;
	}

	const label = (node.data.label as string) || "";

	// Handle IF nodes - they build complete if-statements
	if (node.type === "if") {
		// Find the condition input
		const conditionEdge = edges.find(
			(edge) =>
				edge.target === nodeId && edge.targetHandle === "condition",
		);

		if (!conditionEdge) {
			return null;
		}

		// Get the condition
		const condition = reconstructCondition(
			conditionEdge.source,
			nodes,
			edges,
		);

		// Find true and false branches
		const trueEdge = edges.find(
			(edge) => edge.source === nodeId && edge.sourceHandle === "true",
		);
		const falseEdge = edges.find(
			(edge) => edge.source === nodeId && edge.sourceHandle === "false",
		);

		const ifArray: unknown[] = [];

		if (condition && trueEdge) {
			const trueTarget = nodes.find((n) => n.id === trueEdge.target);
			const trueValue = trueTarget
				? parseResultValue((trueTarget.data.label as string) || "")
				: null;
			ifArray.push(condition, trueValue);
		}

		if (falseEdge) {
			const falseTarget = nodes.find((n) => n.id === falseEdge.target);
			const falseValue = falseTarget
				? parseResultValue((falseTarget.data.label as string) || "")
				: null;
			ifArray.push(falseValue);
		}

		return ifArray.length > 0 ? { if: ifArray } : null;
	}

	// Handle operator nodes
	if (node.type === "operator") {
		// Find all outgoing edges from this node
		// Filter out edges that go to result nodes - those aren't part of the condition logic
		const outgoingEdges = edges.filter((edge) => {
			const targetNode = nodes.find((n) => n.id === edge.target);
			return edge.source === nodeId && targetNode?.type !== "result";
		});

		switch (label) {
			case "AND": {
				const conditions = outgoingEdges
					.map((edge) =>
						reconstructCondition(edge.target, nodes, edges),
					)
					.filter((condition) => condition !== null);
				return conditions.length > 0 ? { and: conditions } : null;
			}
			case "OR": {
				const conditions = outgoingEdges
					.map((edge) =>
						reconstructCondition(edge.target, nodes, edges),
					)
					.filter((condition) => condition !== null);
				return conditions.length > 0 ? { or: conditions } : null;
			}
			case "NOT": {
				const condition = outgoingEdges[0]
					? reconstructCondition(
							outgoingEdges[0].target,
							nodes,
							edges,
						)
					: null;
				return { "!": condition };
			}
			case "==":
			case "!=":
			case ">":
			case "<":
			case ">=":
			case "<=":
			case "Equals (==)":
			case "Not Equals (!=)":
			case "Greater Than (>)":
			case "Less Than (<)":
			case "Greater or Equal (>=)":
			case "Less or Equal (<=)": {
				// Extract the operator symbol
				let operator: string = label;
				if (label.includes("(")) {
					const match = label.match(/\((.+)\)/);
					if (match) {
						operator = match[1];
					}
				}

				// Get left and right operands
				const operands = outgoingEdges
					.map((edge) => {
						const targetNode = nodes.find(
							(n) => n.id === edge.target,
						);
						if (!targetNode) return null;
						return reconstructCondition(edge.target, nodes, edges);
					})
					.filter((op) => op !== null);

				if (operands.length >= 2) {
					// Use the LAST 2 operands (most recent connections)
					const lastTwo = operands.slice(-2);
					return { [operator]: [lastTwo[0], lastTwo[1]] };
				}

				return null;
			}
			default:
				return null;
		}
	}

	// Handle value nodes
	if (node.type === "value") {
		// Check if it's a variable reference
		if (label.startsWith("var.") || label.startsWith("$")) {
			const varName = label.replace(/^(var\.|\\$)/, "");
			return { var: varName };
		}

		// Try to parse as JSON
		try {
			const parsed = JSON.parse(label);
			return parsed;
		} catch {
			// Return as string
			return label;
		}
	}

	return null;
}

/**
 * Parses a result value string into proper JSON format
 */
function parseResultValue(value: string): unknown {
	if (!value || value === '""') {
		return "";
	}

	// Check if it's a variable reference
	if (value.startsWith("var.") || value.startsWith("$")) {
		const varName = value.replace(/^(var\.|\\$)/, "");
		return { var: varName };
	}

	// Try to parse as JSON
	try {
		const parsed = JSON.parse(value);
		return parsed;
	} catch {
		// Return as string
		return value;
	}
}
