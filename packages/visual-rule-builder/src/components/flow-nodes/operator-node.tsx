import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo, useState } from "react";
import { Input } from "@semoss/ui/next";

// Helper to get operator display name
const getOperatorLabel = (op: string): string => {
	const opMap: Record<string, string> = {
		"==": "Equals (==)",
		"!=": "Not Equals (!=)",
		">": "Greater Than (>)",
		"<": "Less Than (<)",
		">=": "Greater or Equal (>=)",
		"<=": "Less or Equal (<=)",
		AND: "AND",
		OR: "OR",
		NOT: "NOT",
	};
	return opMap[op] || op;
};

export const OperatorNode = memo(({ data, id }: NodeProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [label, setLabel] = useState((data.label as string) || "");

	const isLogicalOperator = ["AND", "OR", "NOT"].includes(
		((data.label as string) || "").toUpperCase(),
	);
	const isBinaryComparisonOperator = [
		"==",
		"!=",
		">",
		"<",
		">=",
		"<=",
	].includes((data.label as string) || "");

	const handleDoubleClick = () => {
		setIsEditing(true);
	};

	const handleBlur = () => {
		setIsEditing(false);
		if (data.onUpdate && typeof data.onUpdate === "function") {
			data.onUpdate(id, { label });
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleBlur();
		}
		if (e.key === "Escape") {
			setLabel((data.label as string) || "");
			setIsEditing(false);
		}
	};

	return (
		<div className="min-w-[200px] rounded-xl border-2 border-blue-400 bg-white shadow-lg">
			<Handle
				type="target"
				position={Position.Top}
				className="bg-blue-500!"
				title="Connect condition or value input"
			/>

			<div className="space-y-2 p-3">
				<div className="flex items-center justify-between">
					<span className="inline-block rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-700 text-xs uppercase tracking-wide">
						{isLogicalOperator ? "Logic" : "Condition"}
					</span>
					{isBinaryComparisonOperator && (
						<span
							className="rounded bg-blue-50 px-2 py-0.5 text-blue-600 text-xs"
							title="Accepts exactly 2 inputs"
						>
							2 inputs max
						</span>
					)}
				</div>
				<div className="text-muted-foreground text-xs">
					{isLogicalOperator
						? "Logical Operator"
						: "Comparison Operator"}
				</div>
				<div className="min-h-8">
					{isEditing ? (
						<Input
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							onBlur={handleBlur}
							onKeyDown={handleKeyDown}
							autoFocus
							className="h-8 font-semibold text-sm"
						/>
					) : (
						<div
							role="button"
							tabIndex={0}
							onDoubleClick={handleDoubleClick}
							onKeyDown={(e) =>
								e.key === "Enter" && handleDoubleClick()
							}
							className="cursor-text rounded-md bg-blue-50 px-3 py-2 font-semibold text-sm hover:bg-blue-100"
							title="Double-click to edit"
						>
							{getOperatorLabel((data.label as string) || "")}
						</div>
					)}
				</div>
				{isLogicalOperator && (
					<div className="text-muted-foreground text-xs italic">
						{(data.label as string) === "AND" &&
							"All conditions must be true"}
						{(data.label as string) === "OR" &&
							"Any condition can be true"}
						{(data.label as string) === "NOT" &&
							"Inverts the condition"}
					</div>
				)}
				{isBinaryComparisonOperator && (
					<div className="flex gap-1 text-xs">
						<div className="flex-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-center text-blue-700">
							Left
						</div>
						<div className="flex-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-center text-blue-700">
							Right
						</div>
					</div>
				)}
			</div>

			<Handle
				type="source"
				position={Position.Bottom}
				className="bg-blue-500!"
				title="Connect to result or another operator"
			/>
		</div>
	);
});

OperatorNode.displayName = "OperatorNode";
