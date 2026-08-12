import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import React from "react";

interface NotebookSortableCellProps {
	/** Stable cell id used by dnd-kit for sorting. */
	id: string;
	/** Disable dragging while the notebook is busy or read-only. */
	disabled?: boolean;
	/** Label shown on the drag chip (e.g. "Moving code cell"). */
	label?: string;
	/** Registers the sortable node so the parent can scroll it into view. */
	onNodeRef?: (node: HTMLDivElement | null) => void;
	/** The cell to render; receives injected `dragHandleProps` via cloneElement. */
	children: React.ReactElement;
}

/**
 * dnd-kit sortable wrapper for one cell: applies the drag transform, injects the
 * drag-handle props (attributes + listeners) so only the grip starts a drag, and
 * shrinks to a compact chip while dragging so tall cells don't hide the drop gap.
 */
export const SortableCell: React.FC<NotebookSortableCellProps> = ({
	id,
	disabled,
	label,
	onNodeRef,
	children,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, disabled });

	const style: React.CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	const setRef = (node: HTMLDivElement | null) => {
		setNodeRef(node);
		onNodeRef?.(node);
	};

	if (isDragging) {
		return (
			<div ref={setRef} style={style} className="relative z-10">
				<div
					{...attributes}
					{...listeners}
					className="flex w-full cursor-grabbing items-center gap-2 rounded-md border border-primary border-dashed bg-primary/5 px-3 py-2 text-muted-foreground text-xs shadow-sm"
				>
					<GripVerticalIcon className="size-3.5" />
					<span className="font-mono">{label ?? "Moving cell"}</span>
				</div>
			</div>
		);
	}

	return (
		<div ref={setRef} style={style}>
			{React.cloneElement(children, {
				dragHandleProps: { ...attributes, ...listeners },
			})}
		</div>
	);
};
