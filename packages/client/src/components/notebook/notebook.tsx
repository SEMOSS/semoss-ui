import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Play } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { Button, Spinner } from "@semoss/ui/next";
import { NotebookCell } from "./notebook-cell";

interface NotebookProps {
	/** Id of the notebook */
	id: string;
}

// Sortable encapsulation elements based on the sortable context
const SortableItems = ({
	id,
	children,
}: {
	id: string;
	children: React.ReactElement;
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	// `CSS.Translate.toString` emits only translate3d (no scaleX/scaleY) so
	// cells with different heights don't visually morph during a drag.
	const style: React.CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	if (isDragging) {
		// Collapsed single-row preview while dragging — keeps large cells
		// (long code editors, model comparisons, etc.) from blocking the view
		// or flickering as they pass over neighbours. The real cell snaps
		// back to its full height once the drop lands.
		return (
			<div ref={setNodeRef} style={style}>
				<div
					{...attributes}
					{...listeners}
					className="my-1 flex w-full cursor-grabbing items-center gap-2 rounded-sm border border-primary border-dashed bg-primary/5 px-3 py-1.5 text-muted-foreground text-xs shadow-sm"
				>
					<span className="font-mono">Moving cell {id}</span>
				</div>
			</div>
		);
	}

	return (
		<div key={`action-${id}`} ref={setNodeRef} style={style}>
			{React.cloneElement(children, {
				dragHandleProps: { ...attributes, ...listeners },
			})}
		</div>
	);
};

/**
 * Render a sheet in the notebook (contains the individual steps)
 */
export const Notebook = observer((props: NotebookProps): JSX.Element => {
	const { id } = props;
	const { state } = useBlocks();
	const [cellPlayCounter, setCellPlayCounter] = useState<number | null>(null);

	/**
	 * Handle drag end
	 * @param event - event object from dnd context
	 */
	const handleDragEnd = ({ active, over }) => {
		// If the active item is over the same item, do nothing
		if (!active || !over) {
			console.error("Invalid item!");
			return;
		}

		// If the active item is over a different item, swap them
		if (over && active.id !== over.id) {
			state.dispatch({
				message: ActionMessages.MOVE_CELL,
				payload: {
					queryId: id,
					activeCellId: active.id,
					overCellId: over.id,
				},
			});
		}
	};

	// need a notebook to render it
	const notebook = state.getNotebook(id);
	if (!notebook) {
		return null;
	}

	return (
		<div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
			<div className="flex items-center justify-between px-6 py-2.5">
				<span>&nbsp;</span>
				<div className="flex items-center gap-2">
					<Button
						title="Run all cells"
						size="sm"
						disabled={notebook.isLoading}
						onClick={() =>
							state.dispatch({
								message: ActionMessages.RUN_NOTEBOOK,
								payload: {
									queryId: id,
								},
							})
						}
					>
						{notebook.isLoading ? (
							<Spinner className="size-3" />
						) : (
							<Play className="size-3" />
						)}
						Run All
					</Button>
				</div>
			</div>
			<DndContext
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToParentElement]}
			>
				<SortableContext
					items={notebook.list?.map((item) => item)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex h-full w-full flex-1 flex-col overflow-auto px-3 py-2">
						{notebook.list.map((cellId) => (
							<SortableItems key={cellId} id={cellId}>
								<NotebookCell
									queryId={id}
									cellId={cellId}
									cellPlayCounter={cellPlayCounter}
									setCellPlayCounter={setCellPlayCounter}
								/>
							</SortableItems>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
});
