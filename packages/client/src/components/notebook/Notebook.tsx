import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical as DragIndicator, Loader2, PlayCircle as PlayArrowRounded } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { Button } from "@semoss/ui/next";
import { NotebookCell } from "./NotebookCell";

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
	children: React.ReactNode;
}) => {
	// Use the sortable context
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });

	// Apply styles to the list items based on their state
	const style: React.CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		display: "flex",
		alignItems: "center",
		gap: 8,
	};

	return (
		<div key={`action-${id}`} ref={setNodeRef} style={style}>
			<div
				{...attributes}
				{...listeners}
				style={{ cursor: "grab", alignSelf: "baseline", paddingTop: "16px" }}
			>
				<DragIndicator className="h-6 w-6 text-muted-foreground" />
			</div>
			{children}
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
	const notebook = state.getQuery(id);
	if (!notebook) {
		return null;
	}

	return (
		<div className="flex flex-col h-full w-full bg-background flex-1 overflow-hidden">
			<div className="flex items-center justify-between px-3 py-2.5 gap-2">
				&nbsp;
				<div className="flex items-center gap-1">
					<Button
						title="Run all cells"
						variant="default"
						size="sm"
						disabled={notebook.isLoading}
						onClick={() =>
							state.dispatch({
								message: ActionMessages.RUN_QUERY,
								payload: {
									queryId: id,
								},
							})
						}
						style={{ lineHeight: "1.25rem" }}
					>
						{notebook.isLoading ? (
							<Loader2 className="h-3 w-3 animate-spin" />
						) : (
							<PlayArrowRounded className="h-4 w-4" />
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
					<div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-auto overflow-x-hidden p-4">
						{notebook.list.map((cellId) => (
							<SortableItems key={cellId} id={cellId}>
								<div className="flex flex-col w-full min-w-0" key={cellId}>
									<NotebookCell
										queryId={id}
										cellId={cellId}
										cellPlayCounter={cellPlayCounter}
										setCellPlayCounter={setCellPlayCounter}
									></NotebookCell>
								</div>
							</SortableItems>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
});
