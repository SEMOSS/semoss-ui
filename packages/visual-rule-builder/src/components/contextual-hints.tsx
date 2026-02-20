import type { Edge, Node } from "@xyflow/react";
import { ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import { useMemo } from "react";

interface ContextualHintsProps {
	nodes: Node[];
	edges: Edge[];
}

interface HintStep {
	message: string;
	type: "info" | "success" | "warning";
	priority: number; // Lower = higher priority
}

export function ContextualHints({ nodes, edges }: ContextualHintsProps) {
	const hints = useMemo(() => {
		const steps: HintStep[] = [];

		// Count different node types
		const operatorNodes = nodes.filter((n) => n.type === "operator");
		const valueNodes = nodes.filter((n) => n.type === "value");
		const resultNodes = nodes.filter((n) => n.type === "result");

		// Step 1: Empty canvas
		if (nodes.length === 0) {
			steps.push({
				message:
					"🎯 Let's start! Drag an operator node (like '==' or 'AND') from the left panel to begin building your rule.",
				type: "info",
				priority: 1,
			});
			return steps;
		}

		// Step 2: Has nodes but no connections
		if (edges.length === 0 && nodes.length > 0) {
			if (operatorNodes.length > 0 && valueNodes.length === 0) {
				steps.push({
					message:
						"✨ Great! Now add value nodes to compare. Drag a 'Value' node from the panel and connect it to your operator.",
					type: "info",
					priority: 2,
				});
			} else if (operatorNodes.length > 0 && valueNodes.length > 0) {
				steps.push({
					message:
						"🔗 Connect your nodes! Click and drag from the small circle on one node to another node to create a connection.",
					type: "info",
					priority: 2,
				});
			} else if (valueNodes.length > 0 && operatorNodes.length === 0) {
				steps.push({
					message:
						"🎯 Add an operator (like '==', '>', or 'AND') to compare or combine your values.",
					type: "info",
					priority: 2,
				});
			}
			return steps;
		}

		// Step 3: Check for disconnected result nodes
		const disconnectedResults = resultNodes.filter(
			(resultNode) => !edges.some((e) => e.target === resultNode.id),
		);

		// Step 4: No result nodes yet
		if (resultNodes.length === 0 && edges.length > 0) {
			steps.push({
				message:
					"📝 Add a result node to define what happens when your condition is met. Drag a 'Result' node from the panel.",
				type: "info",
				priority: 3,
			});
			return steps;
		}

		// Step 5: Result nodes not connected
		if (disconnectedResults.length > 0) {
			steps.push({
				message:
					"🔗 Connect your condition to a result node to complete the rule. Connect from an operator or IF block to the result.",
				type: "warning",
				priority: 4,
			});
			return steps;
		}

		// Step 6: Binary operators without enough operands
		const binaryOperators = ["==", "!=", ">", "<", ">=", "<="];
		const incompleteOperators = operatorNodes.filter((opNode) => {
			const label = (opNode.data.label as string) || "";
			const isBinary = binaryOperators.some((op) => label.includes(op));
			if (!isBinary) return false;

			const operandCount = edges.filter(
				(e) =>
					e.source === opNode.id &&
					nodes.find((n) => n.id === e.target)?.type !== "result",
			).length;

			return operandCount < 2;
		});

		if (incompleteOperators.length > 0) {
			const opLabel = incompleteOperators[0].data.label as string;
			steps.push({
				message: `⚠️ Your "${opLabel}" operator needs 2 values to compare. Add another value node and connect it.`,
				type: "warning",
				priority: 5,
			});
			return steps;
		}

		// Step 7: Logical operators (AND/OR) with only one condition
		const logicalOperators = operatorNodes.filter((opNode) => {
			const label = (opNode.data.label as string) || "";
			return label === "AND" || label === "OR";
		});

		const lonelyLogical = logicalOperators.filter((opNode) => {
			const conditionCount = edges.filter(
				(e) =>
					e.source === opNode.id &&
					nodes.find((n) => n.id === e.target)?.type !== "result",
			).length;
			return conditionCount < 2;
		});

		if (lonelyLogical.length > 0) {
			const opLabel = lonelyLogical[0].data.label as string;
			steps.push({
				message: `💡 Tip: "${opLabel}" operators work best with multiple conditions. Add another operator to create complex logic.`,
				type: "info",
				priority: 6,
			});
		}

		// Step 8: Has everything - suggest testing or adding complexity
		const connectedResults = resultNodes.filter((resultNode) =>
			edges.some((e) => e.target === resultNode.id),
		);

		if (
			connectedResults.length > 0 &&
			incompleteOperators.length === 0 &&
			disconnectedResults.length === 0
		) {
			steps.push({
				message:
					"🎉 Great! Your rule looks complete. Try using 'Show JSON' to see the output, or 'Save Rule' to store your work.",
				type: "success",
				priority: 10,
			});
		}

		return steps;
	}, [nodes, edges]);

	// Show the highest priority hint
	const currentHint = hints.sort((a, b) => a.priority - b.priority)[0];

	if (!currentHint) return null;

	const bgColor =
		currentHint.type === "success"
			? "bg-green-50"
			: currentHint.type === "warning"
				? "bg-orange-50"
				: "bg-blue-50";

	const borderColor =
		currentHint.type === "success"
			? "border-l-green-500"
			: currentHint.type === "warning"
				? "border-l-orange-500"
				: "border-l-blue-500";

	const iconColor =
		currentHint.type === "success"
			? "text-green-600"
			: currentHint.type === "warning"
				? "text-orange-600"
				: "text-blue-600";

	return (
		<div
			className={`flex w-full items-start gap-3 rounded-md border-l-4 p-4 ${bgColor} ${borderColor}`}
		>
			{currentHint.type === "success" && (
				<CheckCircle2 className={`h-5 w-5 shrink-0 ${iconColor}`} />
			)}
			{currentHint.type === "warning" && (
				<Lightbulb className={`h-5 w-5 shrink-0 ${iconColor}`} />
			)}
			{currentHint.type === "info" && (
				<ArrowRight className={`h-5 w-5 shrink-0 ${iconColor}`} />
			)}
			<p className="flex-1 font-medium text-sm leading-relaxed">
				{currentHint.message}
			</p>
		</div>
	);
}
