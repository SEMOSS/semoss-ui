import { Plus } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useMemo, useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { Button, toast } from "@semoss/ui/next";
import { FlexLayout } from "@/components/flex-layout";
import { NewNotebookOverlay } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { useWorkspace } from "@/hooks";
import { NotebookExplorerItem } from "./notebook-explorer-panel-item";
import { PanelSearch } from "./panel-search";

interface NotebookExplorerPanelProps {
	title: string;
	/** Current layoutobject */
	layout: FlexLayout.Layout;
}

export const NotebookExplorerPanel: React.FC<NotebookExplorerPanelProps> =
	observer((props) => {
		const { title, layout } = props;

		const { workspace } = useWorkspace();
		const { state, notebook } = useBlocks();

		// files to add
		const [selected, setSelected] = useState<string>("");

		// temporary fix for dead refresh button should be removed
		const [counter, setCounter] = useState(0);

		// filter word for the search
		const [filterWord, setFilterWord] = useState<string>("");

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
			workspace.openOverlay(() => (
				<NewNotebookOverlay
					onClose={(newQueryId?: string) => {
						if (newQueryId) {
							createPanel(newQueryId);
							refreshNotebooks();
						}
						workspace.closeOverlay();
					}}
				/>
			));
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
				return query.id
					.toLowerCase()
					.includes(filterWord.toLowerCase());
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
		const handleOnDragStart = (event: React.MouseEvent, id: string) => {
			try {
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				if (!event.altKey) {
					return;
				}

				const name = id.split("/").pop();

				layout.addTabWithDragAndDrop(event as unknown as DragEvent, {
					type: "tab",
					name: name,
					component: "notebook-viewer",
					config: {
						id: id,
					},
					enableClose: true,
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

				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				const addId =
					model.getActiveTabset()?.getId() ||
					model.getRoot().getChildren()[0]?.getId() ||
					"";

				model.doAction(
					FlexLayout.Actions.addNode(
						{
							type: "tab",
							name: id,
							component: "notebook-viewer",
							config: {
								id: id,
							},
							enableClose: true,
						},
						addId,
						FlexLayout.DockLocation.CENTER,
						-1,
						true,
					),
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

				let selectedNode: FlexLayout.TabNode | null = null;

				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				model.visitNodes((node) => {
					if (node instanceof FlexLayout.TabNode) {
						const component = node.getComponent();
						if (component !== "notebook-viewer") {
							return;
						}

						const config = node.getConfig();
						if (config.id !== id) {
							return;
						}

						selectedNode = node;
					}
				});

				if (!selectedNode) {
					return false;
				}

				const selectedNodeId = selectedNode.getId();
				model.doAction(FlexLayout.Actions.selectTab(selectedNodeId));
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

				const nodesToBeRemoved: FlexLayout.TabNode[] = [];

				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				model.visitNodes((node) => {
					if (node instanceof FlexLayout.TabNode) {
						const component = node.getComponent();
						if (component !== "notebook-viewer") {
							return;
						}

						const config = node.getConfig();
						if (config.id !== id) {
							return;
						}

						nodesToBeRemoved.push(node);
					}
				});

				for (const n of nodesToBeRemoved) {
					const nodeId = n.getId();
					model.doAction(FlexLayout.Actions.deleteTab(nodeId));
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
					<div className="flex w-full flex-col bg-white p-0">
						<div className="flex min-h-12 items-center justify-between px-3 pt-3 pb-2">
							<p className="m-0 font-semibold text-sm">{title}</p>
							<Button
								variant="ghost"
								size="icon-sm"
								title="Create new notebook"
								onClick={(e) => {
									e.stopPropagation();
									handleOpenCreateNotebook();
								}}
							>
								<Plus className="size-4" />
							</Button>
						</div>
						<PanelSearch
							value={filterWord}
							onChange={setFilterWord}
						/>
					</div>
				}
			>
				<div
					key={counter}
					className="flex h-full flex-col overflow-auto bg-background"
				>
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
			</Panel>
		);
	});
