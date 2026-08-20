import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Pencil, Play, Plus } from "lucide-react";

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
		<div className="group relative w-[280px] rounded-2xl border-2 border-emerald-500/40 bg-card shadow-sm transition-all hover:shadow-md">
			{/* Edit button */}
			{d.onEdit && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						d.onEdit?.();
					}}
					className="absolute top-2 right-2 z-10 hidden rounded bg-muted p-1 transition-colors hover:bg-muted/80 group-hover:block"
					aria-label="Edit trigger"
				>
					<Pencil className="h-3 w-3 text-muted-foreground" />
				</button>
			)}

			<div className="px-4 py-3">
				<div className="mb-2 flex items-center gap-2">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
						<Play className="h-3.5 w-3.5 text-emerald-600" />
					</span>
					<span className="font-medium text-[10px] text-emerald-600 uppercase tracking-widest">
						Trigger
					</span>
					{d.devMode && (
						<span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700">
							dev
						</span>
					)}
				</div>
				<p className="line-clamp-3 font-semibold text-sm leading-snug">
					{d.label || "Start"}
				</p>
				{d.description && (
					<p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
						{d.description}
					</p>
				)}
			</div>

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
