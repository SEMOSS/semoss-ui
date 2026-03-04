import { Add, Search } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useMemo, useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import {
	IconButton,
	InputAdornment,
	Stack,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { FlexLayout } from "@/components/flex-layout";
import { DeleteNotebookOverlay, NewQueryOverlay } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { useWorkspace } from "@/hooks";
import { NotebookExplorerItem } from "./NotebookExplorerPanelItem";

interface NotebookExplorerPanelProps {
	title: string;
	/** Current layoutobject */
	layout: FlexLayout.Layout;
}
const StyledTitle = styled("div")(({ theme }) => ({
	borderRadius: "16px",
	background: " #EBF4FE",
	width: "fit-content",
	marginTop: "4px",
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	marginBottom: "8px",
	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
}));

const StyledTitleSpan = styled("span")(() => ({
	color: "var(--Primary-Dark, #1260DD)",
	fontFamily: "Inter",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontStyle: "normal",
	fontSize: "13px",
	lineHeight: "18px",
	fontWeight: 400,
	marginTop: "8px",
	letterSpacing: "0.16px",
	marginBottom: "8px",
}));

const StyledStack = styled(Stack)(() => ({
	backgroundColor: "#FFF",
	width: "100%",
	padding: "0px",
}));

const StyledNotebookListStack = styled(Stack)(() => ({
	backgroundColor: "#FFF",
}));

const StyledIconsButton = styled(IconButton)(() => ({
	justifyContent: "flex-end",
}));

const StyledNotebookStack = styled(Stack)(() => ({
	backgroundColor: "#FFF",
	paddingLeft: "16px",
	paddingRight: "16px",
	paddingTop: "16px",
	paddingBottom: "8px",
}));

const StyledTextField = styled(TextField)(() => ({
	paddingRight: "16px",
	marginTop: "8px",
	paddingLeft: "16px",
	borderRadius: "8px",
	width: "100%",
}));

export const NotebookExplorerPanel: React.FC<NotebookExplorerPanelProps> =
	observer((props) => {
		const { title, layout } = props;

		const { workspace } = useWorkspace();
		const { state, notebook } = useBlocks();

		const notification = useNotification();

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
			// increment the counter
			setCounter(counter + 1);
		};

		/**
		 * Open the add modal
		 */
		const handleOpenCreateNotebook = () => {
			workspace.openOverlay(() => (
				<NewQueryOverlay
					onClose={(newQueryId?: string) => {
						if (newQueryId) {
							// create the panel
							createPanel(newQueryId);

							// refresh the content
							refreshNotebooks();
						}

						// close the overlay
						workspace.closeOverlay();
					}}
				/>
			));
		};

		/**
		 * Select a panel and create one if it doesn't exist
		 *
		 * id - id of the notebook
		 */
		const handleOnSelect = (id: string) => {
			// try to select a panel, if it doesn't exist create it. Save the path
			const IsSelected = selectPanel(id);
			if (!IsSelected) {
				createPanel(id);
			}

			// set the path
			setSelected(id);
		};

		/**
		 * Filter the notebooks based on the filter word
		 * This is done by filtering the queries in the notebook
		 */
		const filteredNotebooks = useMemo(() => {
			// get the queries
			const queries = notebook.queriesList;
			// filter the queries
			return queries.filter((query) => {
				return query.id
					.toLowerCase()
					.includes(filterWord.toLowerCase());
			});
		}, [notebook.queriesList, filterWord]);

		/**
		 * Open the delete modal
		 */
		const handleOnTrashClick = (deletedNotebookId: string) => {
			workspace.openOverlay(() => (
				<DeleteNotebookOverlay
					deletedNotebookId={deletedNotebookId}
					onClose={(success) => {
						if (success) {
							// trigger the delete file callback if successful
							removePanel(deletedNotebookId);

							// refresh the content
							refreshNotebooks();
						}

						workspace.closeOverlay();
					}}
				/>
			));
		};

		/**
		 * Open the delete modal
		 */
		const handleOnCopyClick = (id: string) => {
			try {
				// get the notebook
				const notebook = state.getQuery(id);
				if (!notebook) {
					notification.add({
						color: "error",
						message: `Cannot find notebook ${id}`,
					});
				}

				// get the json
				const json = notebook.toJSON();

				// get a new id
				let newQueryId = id;
				let newQueryCount = 1;
				while (state.getQuery(newQueryId)) {
					newQueryId = `${id} (${newQueryCount})`;
					newQueryCount++;
				}

				// dispatch it
				state.dispatch({
					message: ActionMessages.NEW_QUERY,
					payload: {
						queryId: newQueryId,
						config: {
							cells: json.cells,
						},
					},
				});

				// select the panel in the layout
				selectPanel(newQueryId);
			} catch (e) {
				// log it
				console.error(e);

				// notify the user
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		/**
		 * Handle dragging of an item
		 *
		 * event - drag event
		 * path - id of the notebook
		 */
		const handleOnDragStart = (event: React.MouseEvent, id: string) => {
			try {
				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				// TODO: altKey key needs to be down for now. event.altKey=false is reserved for panel-to-panel interactions
				if (!event.altKey) {
					return;
				}

				// get the name
				const name = id.split("/").pop();

				// add to layout
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
				notification.add({
					color: "error",
					message: e,
				});
			}
		};

		/** Helpers */
		/**
		 * Create a new panel and highlight it
		 *
		 * id - id of the notebook
		 */
		const createPanel = (id: string): boolean => {
			try {
				if (!id) {
					return false;
				}

				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				// get the name
				const name = id;

				// where to add the node
				const addId =
					model.getActiveTabset()?.getId() ||
					model.getRoot().getChildren()[0]?.getId() ||
					"";

				// create and select the panel
				model.doAction(
					FlexLayout.Actions.addNode(
						{
							type: "tab",
							name: name,
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
				notification.add({
					color: "error",
					message: e,
				});

				return false;
			}

			return true;
		};

		/**
		 * Select a panel if it is there. Return false if not selected.
		 *
		 * id - id of the notebook
		 */
		const selectPanel = (id: string): boolean => {
			try {
				if (!id) {
					return false;
				}

				let selectedNode: FlexLayout.TabNode | null = null;

				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				// visit the notes, and see if it exists
				model.visitNodes((node) => {
					// check if it is a tabNode
					if (node instanceof FlexLayout.TabNode) {
						// it needs to be a notebook-viewer
						const component = node.getComponent();
						if (component !== "notebook-viewer") {
							return;
						}

						// path and space need to match
						const config = node.getConfig();
						if (config.id !== id) {
							return;
						}

						selectedNode = node;
					}
				});

				// create a new panel if there is no node
				if (!selectedNode) {
					return false;
				}

				const selectedNodeId = selectedNode.getId();
				model.doAction(FlexLayout.Actions.selectTab(selectedNodeId));
			} catch (e) {
				notification.add({
					color: "error",
					message: e,
				});

				return false;
			}

			return true;
		};

		/**
		 * Remove a panel
		 *
		 * id - id of the notebook
		 */
		const removePanel = (id: string): boolean => {
			try {
				if (!id) {
					return false;
				}

				const nodesToBeRemoved: FlexLayout.TabNode[] = [];

				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				// visit the notes, and see if it exists
				model.visitNodes((node) => {
					// check if it is a tabNode
					if (node instanceof FlexLayout.TabNode) {
						// it needs to be a notebook-viewer
						const component = node.getComponent();
						if (component !== "notebook-viewer") {
							return;
						}

						// path and space need to match
						const config = node.getConfig();
						if (config.id !== id) {
							return;
						}

						nodesToBeRemoved.push(node);
					}
				});

				// delete the tabs
				for (const n of nodesToBeRemoved) {
					const id = n.getId();
					model.doAction(FlexLayout.Actions.deleteTab(id));
				}
			} catch (e) {
				notification.add({
					color: "error",
					message: e,
				});

				return false;
			}

			return true;
		};

		return (
			<Panel
				actions={
					<StyledStack direction="column" spacing={0}>
						<StyledTitle>
							<StyledTitleSpan>{title}</StyledTitleSpan>
						</StyledTitle>
						<StyledTextField
							placeholder="Search"
							size="small"
							fullWidth
							value={filterWord}
							onChange={(e) => setFilterWord(e.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<Search />
									</InputAdornment>
								),
							}}
						/>
						<StyledNotebookStack
							direction="row"
							alignItems={"center"}
							justifyContent={"space-between"}
						>
							<Typography align="left" variant="body1">
								Notebook
							</Typography>
							<StyledIconsButton
								title={`Create new notebook`}
								size={"small"}
								onClick={(e) => {
									e.stopPropagation();
									handleOpenCreateNotebook();
								}}
							>
								<Add fontSize="inherit" />
							</StyledIconsButton>
						</StyledNotebookStack>
					</StyledStack>
				}
			>
				<StyledNotebookListStack
					key={counter}
					direction="column"
					height={"100%"}
					overflow={"auto"}
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
								onCopyClick={() => {
									handleOnCopyClick(q.id);
								}}
								onDragStart={(e) => handleOnDragStart(e, q.id)}
							/>
						);
					})}
				</StyledNotebookListStack>
			</Panel>
		);
	});
