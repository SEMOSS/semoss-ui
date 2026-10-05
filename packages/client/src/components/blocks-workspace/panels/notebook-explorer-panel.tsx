import { Notebook, Plus } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useMemo, useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useWorkbench, writeSpawnDragSpec } from "@semoss/workbench";
import { NewNotebookDialog } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { NotebookExplorerItem } from "./notebook-explorer-panel-item";
import { PanelEmptyState } from "./panel-empty-state";
import { PanelSearch } from "./panel-search";

export const NotebookExplorerPanel: React.FC = observer(() => {
	const layoutActions = useWorkbench((s) => s.layout.actions);
	const { state, notebook } = useBlocks();

	// files to add
	const [selected, setSelected] = useState<string>("");

	// temporary fix for dead refresh button should be removed
	const [counter, setCounter] = useState(0);

	// filter word for the search
	const [filterWord, setFilterWord] = useState<string>("");
	const [newNotebookDialogOpen, setNewNotebookDialogOpen] = useState(false);

	/**
	 * Refresh the notebooks
	 */
	const refreshNotebooks = () => {
		setCounter(counter + 1);
	};

	/**
	 * Open the add modal
	 */
	const handleOpenCreateNotebook = () => {
		setNewNotebookDialogOpen(true);
	};

	/**
	 * Select a panel and create one if it doesn't exist
	 */
	const handleOnSelect = (id: string) => {
		const IsSelected = selectPanel(id);
		if (!IsSelected) {
			createPanel(id);
		}
		setSelected(id);
	};

	/**
	 * Filter the notebooks based on the filter word
	 */
	const filteredNotebooks = useMemo(() => {
		const queries = notebook.queriesList;
		return queries.filter((query) => {
			return query.id.toLowerCase().includes(filterWord.toLowerCase());
		});
	}, [notebook.queriesList, filterWord]);

	/**
	 * Delete a notebook and remove its panel
	 */
	const handleOnTrashClick = (deletedNotebookId: string) => {
		try {
			state.dispatch({
				message: ActionMessages.DELETE_NOTEBOOK,
				payload: {
					queryId: deletedNotebookId,
				},
			});
			removePanel(deletedNotebookId);
			refreshNotebooks();
		} catch (e) {
			console.error(e);
		}
	};

	/**
	 * Copy a notebook
	 */
	const handleOnCopyClick = (id: string, newName: string) => {
		try {
			const nb = state.getNotebook(id);
			if (!nb) {
				toast.error(`Cannot find notebook ${id}`);
				return;
			}

			const json = nb.toJSON();

			let finalId = newName;
			let count = 1;
			while (state.getNotebook(finalId)) {
				finalId = `${newName} (${count})`;
				count++;
			}

			state.dispatch({
				message: ActionMessages.NEW_NOTEBOOK,
				payload: {
					queryId: finalId,
					config: {
						cells: json.cells,
					},
				},
			});

			selectPanel(finalId);
		} catch (e) {
			console.error(e);
			toast.error(e.message);
		}
	};

	/**
	 * Handle dragging of an item
	 */
	const handleOnDragStart = (
		event: React.DragEvent<HTMLLIElement>,
		id: string,
	) => {
		try {
			if (!event.altKey) {
				return;
			}

			writeSpawnDragSpec(event.dataTransfer, {
				type: WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_VIEWER,
				config: { id: id },
				name: id.split("/").pop() ?? id,
			});
		} catch (e) {
			toast.error(e.message ?? e);
		}
	};

	/**
	 * Create a new panel and highlight it
	 */
	const createPanel = (id: string): boolean => {
		try {
			if (!id) {
				return false;
			}

			layoutActions.selectPanel(
				WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_VIEWER,
				{ id: id },
				{ name: id },
			);
		} catch (e) {
			toast.error(e.message ?? e);
			return false;
		}

		return true;
	};

	/**
	 * Select a panel if it exists
	 */
	const selectPanel = (id: string): boolean => {
		try {
			if (!id) {
				return false;
			}

			// `selectPanel` would spawn one when there is none, and the
			// caller's contract is "reveal it only if it is already open"
			if (
				!layoutActions.matchPanels(
					WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_VIEWER,
					{ id: id },
				).length
			) {
				return false;
			}

			layoutActions.selectPanel(
				WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_VIEWER,
				{ id: id },
				{ name: id },
			);
		} catch (e) {
			toast.error(e.message ?? e);
			return false;
		}

		return true;
	};

	/**
	 * Remove a panel
	 */
	const removePanel = (id: string): boolean => {
		try {
			if (!id) {
				return false;
			}

			for (const record of layoutActions.matchPanels(
				WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_VIEWER,
				{ id: id },
			)) {
				layoutActions.closePanel(record.id);
			}
		} catch (e) {
			toast.error(e.message ?? e);
			return false;
		}

		return true;
	};

	return (
		<Panel
			actions={
				<div className="flex w-full items-center gap-1 px-2 py-2">
					<PanelSearch value={filterWord} onChange={setFilterWord} />
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Create new notebook"
								onClick={(e) => {
									e.stopPropagation();
									handleOpenCreateNotebook();
								}}
							>
								<Plus className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Create new notebook</TooltipContent>
					</Tooltip>
				</div>
			}
		>
			<div
				key={counter}
				className="flex h-full flex-col overflow-auto bg-background"
			>
				{filteredNotebooks.length === 0 ? (
					<PanelEmptyState
						icon={Notebook}
						message={
							filterWord
								? "No notebooks match your search"
								: "No notebooks yet"
						}
					/>
				) : null}
				{filteredNotebooks.map((q) => {
					return (
						<NotebookExplorerItem
							key={q.id}
							id={q.id}
							isSelected={selected === q.id}
							onClick={() => handleOnSelect(q.id)}
							onTrashClick={() => {
								handleOnTrashClick(q.id);
							}}
							onCopyClick={(newName) => {
								handleOnCopyClick(q.id, newName);
							}}
							onDragStart={(e) => handleOnDragStart(e, q.id)}
						/>
					);
				})}
			</div>
			<Dialog
				open={newNotebookDialogOpen}
				onOpenChange={(open) => {
					setNewNotebookDialogOpen(open);
				}}
			>
				<DialogContent className="max-w-sm p-0">
					<NewNotebookDialog
						onClose={(newQueryId?: string) => {
							if (newQueryId) {
								createPanel(newQueryId);
								refreshNotebooks();
							}
							setNewNotebookDialogOpen(false);
						}}
					/>
				</DialogContent>
			</Dialog>
		</Panel>
	);
});
