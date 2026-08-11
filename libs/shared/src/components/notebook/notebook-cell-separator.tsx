import { PlusIcon } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type { JupyterCellType } from "./notebook.types";

export interface NotebookCellSeparatorProps {
	/** Insert a new cell of `type` right at this gap. */
	onInsert: (type: JupyterCellType) => void;
	/** Disable inserting while the notebook is busy. */
	disabled?: boolean;
}

/**
 * Slim hover zone rendered between two cells; reveals inline "+ Code" /
 * "+ Markdown" buttons (overlaid, not laid out) to insert a new cell at that
 * gap without shifting the surrounding cells when idle.
 */
export const NotebookCellSeparator: React.FC<NotebookCellSeparatorProps> = ({
	onInsert,
	disabled,
}) => {
	return (
		<div className="group/gap relative flex h-6 items-center justify-center">
			<div className="mx-auto h-px w-[60%] bg-transparent transition-colors group-hover/gap:bg-border" />
			<div className="pointer-events-none absolute z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/gap:pointer-events-auto group-hover/gap:opacity-100">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					className="h-5 gap-1 bg-background px-1 text-xs"
					onClick={() => onInsert("code")}
				>
					<PlusIcon className="size-3" />
					Code
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					className="h-5 gap-1 bg-background px-1 text-xs"
					onClick={() => onInsert("markdown")}
				>
					<PlusIcon className="size-3" />
					Markdown
				</Button>
			</div>
		</div>
	);
};
