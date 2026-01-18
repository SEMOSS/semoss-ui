import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragIndicator, PlayArrowRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import {
	Box,
	Button,
	CircularProgress,
	Container,
	Stack,
	styled,
} from "@semoss/ui";
import { NotebookCell } from "./NotebookCell";

const StyledSheet = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	backgroundColor: theme.palette.background.paper,
	flex: 1,
	overflow: "hidden",
}));

const StyledContainer = styled(Container)(({ theme }) => ({
	flex: 1,
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "inherit",
	overflow: "auto",
	padding: theme.spacing(2),
}));

const StyledCell = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	width: "100%",
}));

const StyledContainedButton = styled(Button)(() => ({
	lineHeight: "1.25rem",
}));

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
		transform: CSS.Transform.toString(transform),
		transition,
		display: "flex",
		alignItems: "center",
		gap: 1,
	};

	return (
		<div key={`action-${id}`} ref={setNodeRef} style={style}>
			<Box
				{...attributes}
				{...listeners}
				sx={{ cursor: "grab", alignSelf: "baseline", paddingTop: 2 }}
			>
				<DragIndicator color="disabled" />
			</Box>
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
		<StyledSheet>
			<Stack
				alignItems={"center"}
				justifyContent={"space-between"}
				direction="row"
				paddingLeft={3}
				paddingRight={3}
				paddingY={1.25}
				spacing={2}
			>
				&nbsp;
				<Stack direction="row" alignItems="center" spacing={1}>
					<StyledContainedButton
						title="Run all cells"
						variant="contained"
						size="small"
						color="primary"
						disableElevation
						startIcon={
							notebook.isLoading ? (
								<CircularProgress size="0.75em" />
							) : (
								<PlayArrowRounded />
							)
						}
						disabled={notebook.isLoading}
						onClick={() =>
							state.dispatch({
								message: ActionMessages.RUN_QUERY,
								payload: {
									queryId: id,
								},
							})
						}
					>
						Run All
					</StyledContainedButton>
				</Stack>
			</Stack>
			<DndContext
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToParentElement]}
			>
				<SortableContext
					items={notebook.list?.map((item) => item)}
					strategy={verticalListSortingStrategy}
				>
					<StyledContainer maxWidth={false}>
						{notebook.list.map((cellId) => (
							<SortableItems key={cellId} id={cellId}>
								<StyledCell key={cellId}>
									<NotebookCell
										queryId={id}
										cellId={cellId}
										cellPlayCounter={cellPlayCounter}
										setCellPlayCounter={setCellPlayCounter}
									></NotebookCell>
								</StyledCell>
							</SortableItems>
						))}
					</StyledContainer>
				</SortableContext>
			</DndContext>
		</StyledSheet>
	);
});
