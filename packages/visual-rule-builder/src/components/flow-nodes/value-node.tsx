import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo, useState } from "react";
import { Input } from "@semoss/ui/next";

export const ValueNode = memo(({ data, id }: NodeProps) => {
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
		<div className="min-w-[180px] rounded-xl border-2 border-green-400 bg-white shadow-lg">
			<Handle
				type="target"
				position={Position.Top}
				className="bg-green-500!"
			/>

			<div className="space-y-2 p-3">
				<span className="inline-block rounded bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs uppercase tracking-wide">
					Data
				</span>
				<div className="text-muted-foreground text-xs">Field</div>
				<div className="min-h-8">
					{isEditing ? (
						<Input
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							onBlur={handleBlur}
							onKeyDown={handleKeyDown}
							autoFocus
							className="h-8 text-sm"
						/>
					) : (
						<div
							role="button"
							tabIndex={0}
							onDoubleClick={handleDoubleClick}
							onKeyDown={(e) =>
								e.key === "Enter" && handleDoubleClick()
							}
							className="cursor-text truncate rounded-md bg-green-50 px-3 py-2 text-sm hover:bg-green-100"
							title={(data.label as string) || ""}
						>
							{(data.label as string) || ""}
						</div>
					)}
				</div>
			</div>

			<Handle
				type="source"
				position={Position.Bottom}
				className="bg-green-500!"
			/>
		</div>
	);
});

ValueNode.displayName = "ValueNode";
