import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo, useState } from "react";
import { Input } from "@semoss/ui/next";

export const ResultNode = memo(({ data, id }: NodeProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [label, setLabel] = useState((data.label as string) || "");

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
		<div className="min-w-[180px] rounded-xl border-2 border-purple-400 bg-white shadow-lg">
			<Handle
				type="target"
				position={Position.Top}
				className="bg-purple-500!"
			/>

			<div className="space-y-2 p-3">
				<div className="flex items-center justify-between">
					<span className="rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-700 text-xs uppercase tracking-wide">
						Result
					</span>
				</div>
				<div className="text-muted-foreground text-xs">Output</div>
				<div className="min-h-8">
					{isEditing ? (
						<Input
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							onBlur={handleBlur}
							onKeyDown={handleKeyDown}
							autoFocus
							className="h-8 font-medium text-sm"
						/>
					) : (
						<div
							role="button"
							tabIndex={0}
							onDoubleClick={handleDoubleClick}
							onKeyDown={(e) =>
								e.key === "Enter" && handleDoubleClick()
							}
							className="cursor-text rounded-md bg-purple-50 px-3 py-2 font-medium text-sm hover:bg-purple-100"
						>
							{(data.label as string) || '""'}
						</div>
					)}
				</div>
			</div>

			<Handle
				type="source"
				position={Position.Bottom}
				className="bg-purple-500!"
			/>
		</div>
	);
});

ResultNode.displayName = "ResultNode";
