import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Plus, Zap } from "lucide-react";

export type TriggerNodeData = {
	label: string;
	description?: string;
	devMode?: boolean;
	runStatus?: "running" | "success" | "error";
	isLast?: boolean;
	onEdit?: () => void;
	onAdd?: () => void;
};

export function TriggerNode({ data, id }: NodeProps) {
	const trigger = data as TriggerNodeData;
	const statusBorderClass =
		trigger.runStatus === "success"
			? "border-emerald-500/60"
			: trigger.runStatus === "error"
				? "border-destructive/60"
				: trigger.runStatus === "running"
					? "border-blue-500/70"
					: "border-emerald-500/40";
	const runningClass =
		trigger.runStatus === "running" ? "automation-trigger-running" : "";

	return (
		<div className="group relative flex h-[120px] w-full items-center justify-center">
			<button
				type="button"
				aria-label="Edit trigger"
				disabled={!trigger.onEdit}
				onClick={() => trigger.onEdit?.()}
				className={`relative h-[72px] w-[72px] rotate-45 appearance-none rounded-lg border-2 ${statusBorderClass} ${runningClass} bg-card p-0 shadow-sm disabled:cursor-default`}
			>
				<span className="absolute inset-[2px] z-[1] rounded-md bg-card" />
				<span className="-rotate-45 relative z-[2] flex h-full w-full items-center justify-center">
					<Zap className="h-5 w-5 text-emerald-600" />
				</span>
			</button>
			<p className="-translate-x-1/2 pointer-events-none absolute top-[calc(50%+48px)] left-1/2 whitespace-nowrap font-medium text-foreground text-xs leading-tight">
				{trigger.label || "Start"}
			</p>

			{trigger.isLast ? (
				<>
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
				</>
			) : (
				<Handle
					id={`out-${id}`}
					type="source"
					position={Position.Right}
					isConnectable
					className="!right-[calc(50%_-_58px)] !h-2 !w-2 !border-2 !border-background !bg-emerald-500/60"
				/>
			)}
		</div>
	);
}
