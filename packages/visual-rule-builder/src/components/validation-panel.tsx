import type { Edge, Node } from "@xyflow/react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface ValidationPanelProps {
	nodes: Node[];
	edges: Edge[];
}

interface ValidationIssue {
	type: "error" | "warning" | "info";
	message: string;
	nodeId?: string;
}

export function ValidationPanel({ nodes, edges }: ValidationPanelProps) {
	const issues: ValidationIssue[] = [];

	// Check for binary operators with too many or too few operands
	const operators = nodes.filter((n) => n.type === "operator");
	for (const op of operators) {
		const label = (op.data.label as string) || "";
		const isBinary = [
			"==",
			"!=",
			">",
			"<",
			">=",
			"<=",
			"Equals (==)",
			"Not Equals (!=)",
			"Greater Than (>)",
			"Less Than (<)",
			"Greater or Equal (>=)",
			"Less or Equal (<=)",
		].includes(label);

		if (isBinary) {
			const operandEdges = edges.filter((e) => {
				const target = nodes.find((n) => n.id === e.target);
				return e.source === op.id && target?.type !== "result";
			});

			if (operandEdges.length < 2) {
				issues.push({
					type: "error",
					message: `Comparison "${label}" needs 2 operands (has ${operandEdges.length})`,
					nodeId: op.id,
				});
			} else if (operandEdges.length > 2) {
				issues.push({
					type: "warning",
					message: `Comparison "${label}" has ${operandEdges.length} operands (using last 2)`,
					nodeId: op.id,
				});
			}
		}
	}

	// Check for result nodes without connections
	const results = nodes.filter((n) => n.type === "result");
	for (const result of results) {
		const incoming = edges.filter((e) => e.target === result.id);
		if (incoming.length === 0) {
			issues.push({
				type: "warning",
				message: "Result node not connected to any condition",
				nodeId: result.id,
			});
		}
	}

	// Check for operators without outgoing connections
	for (const op of operators) {
		const outgoing = edges.filter((e) => e.source === op.id);
		if (outgoing.length === 0) {
			issues.push({
				type: "info",
				message: `Operator "${op.data.label}" has no connections`,
				nodeId: op.id,
			});
		}
	}

	// Check for disconnected result nodes (not leading to final if statement)
	const resultNodes = nodes.filter((n) => n.type === "result");
	if (resultNodes.length === 0 && nodes.length > 0) {
		issues.push({
			type: "error",
			message: "No result nodes - add at least one to define output",
		});
	}

	const errors = issues.filter((i) => i.type === "error");
	const warnings = issues.filter((i) => i.type === "warning");
	const infos = issues.filter((i) => i.type === "info");

	if (issues.length === 0) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
				<CheckCircle className="h-4 w-4" />
				<span>No validation issues - structure looks good!</span>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{errors.length > 0 && (
				<div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3">
					<div className="flex items-center gap-2 font-semibold text-red-800 text-sm">
						<AlertCircle className="h-4 w-4" />
						<span>
							{errors.length} Error{errors.length > 1 ? "s" : ""}
						</span>
					</div>
					{errors.map((issue) => (
						<div
							key={`error-${issue.message}`}
							className="ml-6 text-red-700 text-xs"
						>
							• {issue.message}
						</div>
					))}
				</div>
			)}

			{warnings.length > 0 && (
				<div className="space-y-1 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
					<div className="flex items-center gap-2 font-semibold text-sm text-yellow-800">
						<AlertCircle className="h-4 w-4" />
						<span>
							{warnings.length} Warning
							{warnings.length > 1 ? "s" : ""}
						</span>
					</div>
					{warnings.map((issue) => (
						<div
							key={`warning-${issue.message}`}
							className="ml-6 text-xs text-yellow-700"
						>
							• {issue.message}
						</div>
					))}
				</div>
			)}

			{infos.length > 0 && (
				<div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-3">
					<div className="flex items-center gap-2 font-semibold text-blue-800 text-sm">
						<Info className="h-4 w-4" />
						<span>{infos.length} Info</span>
					</div>
					{infos.map((issue) => (
						<div
							key={`info-${issue.message}`}
							className="ml-6 text-blue-700 text-xs"
						>
							• {issue.message}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
