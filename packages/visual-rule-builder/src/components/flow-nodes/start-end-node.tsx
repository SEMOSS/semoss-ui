import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

export const StartEndNode = memo(({ data }: NodeProps) => {
	const isStart = data.label === "Start";

	return (
		<div className="rounded-full border-2 border-gray-700 bg-gray-100 px-6 py-3 shadow-lg">
			{!isStart && (
				<Handle
					type="target"
					position={Position.Top}
					className="bg-gray-700!"
				/>
			)}

			<div className="min-w-20 text-center font-bold text-gray-700 text-sm">
				{data.label}
			</div>

			{isStart && (
				<Handle
					type="source"
					position={Position.Bottom}
					className="bg-gray-700!"
				/>
			)}
		</div>
	);
});

StartEndNode.displayName = "StartEndNode";
