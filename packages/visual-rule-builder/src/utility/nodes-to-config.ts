import type { Edge, Node } from "@xyflow/react";

interface Condition {
	id: string;
	field: string;
	operator: string;
	value: string;
}

interface RuleConfig {
	conditions: Condition[];
	logic: "AND" | "OR";
	thenResult: string;
	elseResult: string;
}

/**
 * Parse ReactFlow nodes and edges back into a SimpleRuleBuilder config
 */
export function nodesToConfig(nodes: Node[], edges: Edge[]): RuleConfig | null {
	try {
		const conditions: Condition[] = [];
		let logic: "AND" | "OR" = "AND";
		let thenResult = '""';
		let elseResult = '""';

		// Find logic node (and/or)
		const logicNode = nodes.find(
			(n) =>
				n.type === "operator" &&
				(n.data.label?.toString().toLowerCase() === "and" ||
					n.data.label?.toString().toLowerCase() === "or"),
		);
		if (logicNode) {
			logic =
				logicNode.data.label?.toString().toLowerCase() === "or"
					? "OR"
					: "AND";
		}

		// Find all comparison operators (==, !=, >, <, >=, <=)
		const comparisonOperators = nodes.filter(
			(n) =>
				n.type === "operator" &&
				["==", "!=", ">", "<", ">=", "<="].includes(
					String(n.data.label || ""),
				),
		);

		// For each comparison operator, find its operands
		for (const opNode of comparisonOperators) {
			// Edges go FROM operator TO operands (source: operator, target: operand)
			const outgoingEdges = edges.filter((e) => e.source === opNode.id);

			if (outgoingEdges.length >= 2) {
				// Get the two operands
				const operand1Node = nodes.find(
					(n) => n.id === outgoingEdges[0].target,
				);
				const operand2Node = nodes.find(
					(n) => n.id === outgoingEdges[1].target,
				);

				if (operand1Node && operand2Node) {
					// Both operands are type "value", so distinguish by content
					// First operand is typically the field/variable, second is the literal value
					const fieldNode = operand1Node;
					const valueNode = operand2Node;

					const fieldName = String(fieldNode.data.label || "");
					const value = String(
						valueNode.data.label || valueNode.data.value || "",
					);
					const operator = String(opNode.data.label || "");

					const condition = {
						id: opNode.id,
						field: fieldName,
						operator,
						value,
					};
					conditions.push(condition);
				}
			}
		}

		// Find result nodes
		const resultNodes = nodes.filter((n) => n.type === "result");

		// Try to determine which result is THEN vs ELSE
		// Look for edges labeled "true" or from the logic node with handle "true"
		for (const resultNode of resultNodes) {
			const incomingEdge = edges.find((e) => e.target === resultNode.id);
			const resultValue = String(
				resultNode.data.label || resultNode.data.value || "",
			);

			if (incomingEdge) {
				// Check if this is the "true" path
				if (
					incomingEdge.label === "true" ||
					incomingEdge.sourceHandle === "true"
				) {
					thenResult = resultValue;
				} else if (
					incomingEdge.label === "else" ||
					incomingEdge.label === "false" ||
					incomingEdge.sourceHandle === "false"
				) {
					elseResult = resultValue;
				} else {
					// Default: first result is THEN, second is ELSE
					if (thenResult === '""') {
						thenResult = resultValue;
					} else {
						elseResult = resultValue;
					}
				}
			}
		}

		// If no conditions found, return null (can't populate form)
		if (conditions.length === 0) {
			return null;
		}

		return {
			conditions,
			logic,
			thenResult,
			elseResult,
		};
	} catch (error) {
		console.error("Failed to parse nodes to config:", error);
		return null;
	}
}
