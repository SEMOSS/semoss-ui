import type { NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";

export type AddNodeButtonData = {
	onClick?: () => void;
	locked?: boolean;
};

export function AddNodeButtonNode({ data }: NodeProps) {
	const d = data as AddNodeButtonData;

	return (
		<button
			data-tour="add-step"
			type="button"
			onClick={d.onClick}
			disabled={d.locked}
			className="flex w-[180px] items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-muted-foreground text-sm transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="Add step"
		>
			<Plus className="h-4 w-4" />
			Add Step
		</button>
	);
}
