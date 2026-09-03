import { Handle, type NodeProps, Position } from "@xyflow/react";
import { CalendarClock, Plus, Radio, Zap } from "lucide-react";
import { getFlowBorderClass } from "../flow-colors";

type OptionalTriggerMode = "schedule" | "event-based";

export type TriggerNodeData = {
	label: string;
	description?: string;
	devMode?: boolean;
	runStatus?: "running" | "success" | "error";
	/** True when this step sits on the path leading to the selected node. */
	pathHighlighted?: boolean;
	triggerModes?: OptionalTriggerMode[];
	onEdit?: () => void;
	onAdd?: () => void;
};

export function TriggerNode({ data, id }: NodeProps) {
	const trigger = data as TriggerNodeData;
	const triggerModes = trigger.triggerModes ?? [];
	const statusBorderClass = getFlowBorderClass(
		trigger.runStatus,
		Boolean(trigger.pathHighlighted),
		"border-emerald-500/40",
	);
	const runningClass =
		trigger.runStatus === "running" ? "automation-trigger-running" : "";

	return (
		<div className="group relative flex h-[120px] w-full items-center justify-center">
			<button
				type="button"
				aria-label="Edit trigger"
				disabled={!trigger.onEdit}
				onClick={() => trigger.onEdit?.()}
				className={`relative flex h-[72px] w-[72px] rotate-45 appearance-none items-center justify-center rounded-lg border-2 ${statusBorderClass} ${runningClass} bg-card p-0 shadow-sm disabled:cursor-default`}
			>
				<span className="absolute inset-[2px] rounded-md bg-card" />
				<Zap className="-rotate-45 relative h-5 w-5 text-success" />
				{triggerModes.includes("schedule") && (
					<CalendarClock className="-top-1 -left-1 -rotate-45 absolute z-10 h-4 w-4 rounded-full bg-card p-0.5 text-success" />
				)}
				{triggerModes.includes("event-based") && (
					<Radio className="-right-1 -bottom-1 -rotate-45 absolute z-10 h-4 w-4 rounded-full bg-card p-0.5 text-success" />
				)}
			</button>
			<p className="-translate-x-1/2 pointer-events-none absolute top-[calc(50%+48px)] left-1/2 whitespace-nowrap font-medium text-foreground text-xs leading-tight">
				{trigger.label || "Start"}
			</p>

			<Handle
				id={`out-${id}`}
				type="source"
				position={Position.Right}
				isConnectable
				onClick={(event) => {
					event.stopPropagation();
					trigger.onAdd?.();
				}}
				aria-label="Add node or drag to connect"
				className="!right-[calc(50%_-_58px)] !h-7 !w-7 !border !border-emerald-500/40 !bg-background hover:!border-emerald-500 shadow-sm transition-colors"
			/>
			<span
				data-tour="add-step"
				className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-[calc(50%_-_58px)] z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center text-emerald-600"
			>
				<Plus className="h-4 w-4" />
			</span>
		</div>
	);
}
