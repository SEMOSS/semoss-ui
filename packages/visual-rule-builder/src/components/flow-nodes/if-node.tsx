import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Check, GitBranch } from "lucide-react";
import { memo, useState } from "react";

export const IfNode = memo(({ data }: NodeProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState<string>((data.label as string) || "IF");

	const handleDoubleClick = () => {
		setIsEditing(true);
	};

	const handleBlur = () => {
		setIsEditing(false);
		if (data.onUpdate && typeof data.onUpdate === "function") {
			data.onUpdate(data.id as string, { label: value });
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleBlur();
		}
	};

	return (
		<div className="min-w-[220px] rounded-xl border-2 border-purple-500 bg-white shadow-lg">
			{/* Input handles for conditions */}
			{/* biome-ignore lint/correctness/useUniqueElementIds: XYFlow requires static Handle IDs for edge connections */}
			<Handle
				type="target"
				position={Position.Left}
				id="condition"
				style={{ top: "33%", background: "#3b82f6" }}
				title="Connect condition here"
			/>

			{/* Header */}
			<div className="flex items-center gap-2 border-purple-200 border-b bg-purple-50 px-4 py-2">
				<GitBranch className="h-4 w-4 text-purple-600" />
				<span className="font-semibold text-purple-900 text-xs uppercase tracking-wide">
					IF-THEN-ELSE
				</span>
			</div>

			{/* Body */}
			<div className="space-y-3 p-4">
				<div>
					<div className="mb-1 text-muted-foreground text-xs">
						IF (condition)
					</div>
					{isEditing ? (
						<input
							type="text"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onBlur={handleBlur}
							onKeyDown={handleKeyDown}
							className="w-full rounded border px-2 py-1 text-sm"
						/>
					) : (
						<button
							type="button"
							onDoubleClick={handleDoubleClick}
							className="w-full cursor-pointer rounded border border-transparent px-2 py-1 text-left text-sm hover:border-purple-300 hover:bg-purple-50"
							title="Double-click to edit"
						>
							{value}
						</button>
					)}
				</div>

				{/* Output handles */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Check className="h-3 w-3 text-green-600" />

						<span className="text-xs">THEN (if true)</span>
						{/* biome-ignore lint/correctness/useUniqueElementIds: XYFlow requires static Handle IDs for edge connections */}
						<Handle
							type="source"
							position={Position.Right}
							id="true"
							style={{ top: "45%", background: "#22c55e" }}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Check className="h-3 w-3 text-orange-600" />
						<span className="text-xs">ELSE (if false)</span>

						{/* biome-ignore lint/correctness/useUniqueElementIds: XYFlow requires static Handle IDs for edge connections */}
						<Handle
							type="source"
							position={Position.Right}
							id="false"
							style={{ top: "65%", background: "#f97316" }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
});

IfNode.displayName = "IfNode";
