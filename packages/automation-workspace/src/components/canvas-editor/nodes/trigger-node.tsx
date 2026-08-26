import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Pencil, Plus, Zap } from "lucide-react";

export type TriggerNodeData = {
	label: string;
	description?: string;
	devMode?: boolean;
	isLast?: boolean;
	onEdit?: () => void;
	onAdd?: () => void;
};

export function TriggerNode({ data, id }: NodeProps) {
	const d = data as TriggerNodeData;

	return (
		<div className="group relative flex flex-col items-center">
			{/* Diamond shape */}
			<div className="relative h-[72px] w-[72px] rotate-45 rounded-lg border-2 border-emerald-500/40 bg-card shadow-sm transition-all hover:shadow-md">
				{/* Edit button */}
				{d.onEdit && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							d.onEdit?.();
						}}
						className="-top-2 -right-2 -rotate-45 absolute z-10 hidden rounded-full bg-muted p-1 transition-colors hover:bg-muted/80 group-hover:block"
						aria-label="Edit trigger"
					>
						<Pencil className="h-3 w-3 text-muted-foreground" />
					</button>
				)}

				<div className="-rotate-45 flex h-full w-full items-center justify-center">
					<Zap className="h-5 w-5 text-emerald-600" />
				</div>
			</div>

			{/* Label below diamond */}
			<p className="mt-3 mb-3 max-w-[120px] text-center font-medium text-foreground text-xs leading-tight">
				{d.label || "Start"}
			</p>
			{d.description && (
				<p className="mt-0.5 max-w-[120px] text-center text-[10px] text-muted-foreground">
					{d.description}
				</p>
			)}

			{d.isLast ? (
				<>
					<Handle
						id={`out-${id}`}
						type="source"
						position={Position.Bottom}
						isConnectable
						onClick={(event) => {
							event.stopPropagation();
							d.onAdd?.();
						}}
						aria-label="Add node or drag to connect"
						className="!h-7 !w-7 !border !border-emerald-500/40 !bg-background hover:!border-emerald-500 shadow-sm transition-colors"
					/>
					<span
						data-tour="add-step"
						className="-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 z-10 flex h-7 w-7 translate-y-1/2 items-center justify-center text-emerald-600"
					>
						<Plus className="h-4 w-4" />
					</span>
				</>
			) : (
				<Handle
					id={`out-${id}`}
					type="source"
					position={Position.Bottom}
					isConnectable
					className="!h-2 !w-2 !border-2 !border-background !bg-emerald-500/60"
				/>
			)}
		</div>
	);
}
