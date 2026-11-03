import { Handle, type NodeProps, Position } from "@xyflow/react";
import { AutomationNodeCard } from "../../components/canvas-editor/nodes/automation-node-card";
import { getWorkflowNodeDisplay } from "../../domain/automation-workflow-display";
import type { AutomationPreviewNode } from "./automation-flow-graph";

/** Uses the editor's card presentation without any editor state or callbacks. */
export function AutomationFlowNode({ data }: NodeProps<AutomationPreviewNode>) {
	const display = getWorkflowNodeDisplay(data.workflowType);
	return (
		<AutomationNodeCard
			label={data.label}
			icon={display.icon}
			ports={
				<>
					{data.inputPorts.map((port, index) => (
						<Handle
							key={port}
							id={port}
							type="target"
							position={Position.Left}
							isConnectable={false}
							style={{
								top: `${((index + 1) / (data.inputPorts.length + 1)) * 100}%`,
							}}
							className="size-2! border-2! border-background! bg-muted-foreground!"
						/>
					))}
					{data.outputPorts.map((port, index) => (
						<Handle
							key={port}
							id={port}
							type="source"
							position={Position.Right}
							isConnectable={false}
							style={{
								top: `${((index + 1) / (data.outputPorts.length + 1)) * 100}%`,
							}}
							className="size-2! border-2! border-background! bg-muted-foreground!"
						/>
					))}
				</>
			}
		/>
	);
}
