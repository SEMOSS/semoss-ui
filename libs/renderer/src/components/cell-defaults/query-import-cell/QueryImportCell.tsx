import {
	CropFree,
	DriveFileRenameOutlineRounded,
	Edit,
	KeyboardArrowDown,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Suspense, useEffect, useRef, useState } from "react";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Checkbox,
	InputAdornment,
	Select,
	Stack,
	styled,
	TextField,
	Tooltip,
} from "@semoss/ui";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
} from "../../../store";
import { QueryImportFormModal } from "../../shared/QueryImportFormModal";

const StyledSelect = styled(Select)(({ theme }) => ({
	"& .MuiSelect-select": {
		color: theme.palette.text.secondary,
		display: "flex",
		gap: theme.spacing(1),
		alignItems: "center",
		textOverflow: "ellipsis",
		overflow: "hidden",
		whiteSpace: "nowrap",
		"&:focus": {
			backgroundColor: "inherit !important",
		},
	},
}));

const StyledSelectItem = styled(Select.Item)(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(1),
	color: theme.palette.text.secondary,
}));

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500; // ~25 lines

const StyledContent = styled("div")({
	position: "relative",
	width: "100%",
});

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-root": {
		color: theme.palette.text.secondary,
		display: "flex",
		gap: theme.spacing(1),
		height: "30px",
	},
}));

export interface QueryImportCellDef extends CellDef<"query-import"> {
	widget: "query-import";
	parameters: {
		/** Database associated with the cell */
		databaseId: string;

		/** Output frame type */
		frameType: "NATIVE" | "PY" | "R" | "GRID";

		/** Ouput variable name */
		frameVariableName: string;

		/** Select query rendered in the cell */
		selectQuery: string;

		/** Enable batching for query results */
		enableBatching?: boolean;

		/** Number of rows per batch */
		batchSize?: number;

		/** Current offset for batching */
		currentOffset?: number;
	};
}

// TODO:: Refactor height to account for Layout
export const QueryImportCell: CellComponent<QueryImportCellDef> = observer(
	(props) => {
		const editorRef = useRef<{
			layout: (dimensions: { width: number; height: number }) => void;
			getContainerDomNode: () => { clientWidth: number };
			onDidContentSizeChange: (callback: () => void) => void;
			addAction: (action: {
				id: string;
				label: string;
				keybindings: number[];
				run: (editor: { getValue: () => string }) => void;
			}) => void;
			getContentHeight: () => number;
		} | null>(null);

		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const [isQueryImportModalOpen, setIsQueryImportModalOpen] =
			useState(false);
		const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState<{
			loading: boolean;
			ids: string[];
			display: Record<string, string>;
		}>({
			loading: true,
			ids: [],
			display: {},
		});
		const myDbs = usePixel<{ engine_id: string; engine_name: string }[]>(
			`MyEngines(engineTypes=['DATABASE']);`,
		);

		// Ensure offset starts at 0 when component first mounts with batching enabled
		// This handles the case where cell was saved with batching enabled and a non-zero offset
		const hasInitialized = useRef(false);
		useEffect(() => {
			if (
				!hasInitialized.current &&
				cell.parameters.enableBatching &&
				(cell.parameters.currentOffset ?? 0) !== 0
			) {
				hasInitialized.current = true;
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
						path: "parameters.currentOffset",
						value: 0,
					},
				});
			}
		}, [
			cell,
			cell.query.id,
			cell.parameters.enableBatching,
			cell.parameters.currentOffset,
			state,
		]);

		// After user databases are loaded, set the database ids and names
		// If no database is selected in the cell, set the first database as default
		// biome-ignore lint/correctness/useExhaustiveDependencies: state.dispatch is a function, not a depdency
		useEffect(() => {
			if (myDbs.status !== "SUCCESS") {
				return;
			}

			const dbIds: string[] = [];
			const dbDisplay: Record<string, string> = {};
			myDbs.data.forEach((db) => {
				dbIds.push(db.engine_id);
				dbDisplay[db.engine_id] = db.engine_name;
			});
			setCfgLibraryDatabases({
				loading: false,
				ids: dbIds,
				display: dbDisplay,
			});

			if (!cell.parameters.databaseId && dbIds.length) {
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
						path: "parameters.databaseId",
						value: dbIds[0],
					},
				});
			}
		}, [
			cell.parameters.databaseId,
			cell.id,
			cell.query.id,
			myDbs.status,
			myDbs.data,
		]);

		/**
		 * Handle mounting of the editor
		 *
		 * @param editor - editor that mounted
		 * @param monaco - monaco instance
		 */
		const handleEditorMount = (
			editor: {
				layout: (dimensions: { width: number; height: number }) => void;
				getContainerDomNode: () => { clientWidth: number };
				onDidContentSizeChange: (callback: () => void) => void;
				addAction: (action: {
					id: string;
					label: string;
					keybindings: number[];
					run: (editor: { getValue: () => string }) => void;
				}) => void;
				getContentHeight: () => number;
			},
			monaco: {
				editor: {
					defineTheme: (name: string, theme: unknown) => void;
					setTheme: (name: string) => void;
				};
				KeyMod: {
					CtrlCmd: number;
				};
				KeyCode: {
					Enter: number;
				};
			},
		) => {
			editorRef.current = editor;

			// add on change
			let ignoreResize = false;
			editor.onDidContentSizeChange(() => {
				try {
					// set the ignoreResize flag
					if (ignoreResize) {
						return;
					}
					ignoreResize = true;

					resizeEditor();
				} finally {
					ignoreResize = false;
				}
			});

			// update the action
			editor.addAction({
				id: "run",
				label: "Run",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
				run: (editor) => {
					const newValue = editor.getValue();

					// update with the new code
					state.dispatch({
						message: ActionMessages.UPDATE_CELL,
						payload: {
							queryId: cell.query.id,
							cellId: cell.id,
							path: "parameters.selectQuery",
							value: newValue,
						},
					});

					// If batching is enabled, reset offset to 0 when manually running the cell
					if (cell.parameters.enableBatching) {
						state.dispatch({
							message: ActionMessages.UPDATE_CELL,
							payload: {
								queryId: cell.query.id,
								cellId: cell.id,
								path: "parameters.currentOffset",
								value: 0,
							},
						});

						// Small delay to ensure offset is updated before running
						setTimeout(() => {
							state.dispatch({
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: cell.query.id,
									cellId: cell.id,
								},
							});
						}, 50);
					} else {
						// No batching - run immediately
						state.dispatch({
							message: ActionMessages.RUN_CELL,
							payload: {
								queryId: cell.query.id,
								cellId: cell.id,
							},
						});
					}
				},
			});

			monaco.editor.defineTheme("custom-theme", {
				base: "vs",
				inherit: false,
				rules: [],
				colors: {
					"editor.background": "#FAFAFA", // Background color
					// 'editor.lineHighlightBorder': '#FFF', // Border around selected line
				},
			});

			monaco.editor.setTheme("custom-theme");

			// resize the editor
			resizeEditor();
		};

		/**
		 * Resize the editor
		 */
		const resizeEditor = () => {
			if (!editorRef.current) return;
			// set the initial height
			let height = 0;

			// if expanded scale to lines, but do not go over the max height
			if (isExpanded) {
				height = Math.min(
					editorRef.current.getContentHeight(),
					EDITOR_MAX_HEIGHT,
				);
			}

			// add the trailing line
			height += EDITOR_LINE_HEIGHT;

			editorRef.current.layout({
				width: editorRef.current.getContainerDomNode().clientWidth,
				height: height,
			});
		};

		/**
		 * Handle changes in the editor
		 * @param newValue - newValue
		 * @returns
		 */
		const handleEditorChange = (newValue: string | undefined) => {
			if (cell.isLoading || newValue === undefined) {
				return;
			}

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.selectQuery",
					value: newValue,
				},
			});
		};

		const openEditModal = () => {
			setIsQueryImportModalOpen(true);
		};

		return (
			<StyledContent>
				<Stack direction="column" spacing={1}>
					{isExpanded && (
						<Stack direction={"column"}>
							<Stack
								direction="row"
								justifyContent={"space-between"}
							>
								<StyledSelect
									size={"small"}
									variant="standard"
									disabled={true}
									title={"Database Not Editable"}
									value={cell.parameters.databaseId}
									SelectProps={{
										IconComponent: KeyboardArrowDown,
									}}
									InputProps={{
										disableUnderline: true,
									}}
									onChange={(e) => {
										const value = e.target.value;
										state.dispatch({
											message: ActionMessages.UPDATE_CELL,
											payload: {
												queryId: cell.query.id,
												cellId: cell.id,
												path: "parameters.databaseId",
												value: value,
											},
										});
									}}
								>
									{Array.from(
										cfgLibraryDatabases.ids,
										(databaseId, i) => (
											<StyledSelectItem
												key={`${i}-${cell.id}-${databaseId}`}
												value={databaseId}
											>
												{cfgLibraryDatabases.display[
													databaseId
												] ?? ""}
											</StyledSelectItem>
										),
									)}
								</StyledSelect>
								<Button
									variant={"text"}
									color={"secondary"}
									onClick={openEditModal}
									startIcon={<Edit />}
								>
									Edit
								</Button>
							</Stack>
						</Stack>
					)}
					<div>
						<Suspense fallback={<>...</>}>
							<MonacoEditor
								value={cell.parameters.selectQuery}
								defaultValue="--SELECT * FROM..."
								language="sql"
								options={{
									scrollbar: {
										alwaysConsumeMouseWheel: false,
									},
									readOnly: true,
									minimap: { enabled: false },
									automaticLayout: true,
									scrollBeyondLastLine: false,
									lineHeight: EDITOR_LINE_HEIGHT,
									overviewRulerBorder: false,
									lineNumbers: "on",
									glyphMargin: false,
									folding: false,
									lineNumbersMinChars: 2,
								}}
								onChange={handleEditorChange}
								onMount={handleEditorMount}
							/>
						</Suspense>
					</div>
					{isExpanded && (
						<Stack
							direction="row"
							alignItems={"center"}
							justifyContent={"flex-end"}
							spacing={1}
							paddingTop={"0px"}
						>
							<StyledSelect
								size={"small"}
								disabled={cell.isLoading}
								title={"Select Type"}
								value={cell.parameters.frameType}
								SelectProps={{
									IconComponent: KeyboardArrowDown,
									style: {
										height: "30px",
										width: "140px",
									},
									startAdornment: (
										<InputAdornment position="start">
											<CropFree />
										</InputAdornment>
									),
								}}
								onChange={(e) => {
									const value = e.target.value;
									state.dispatch({
										message: ActionMessages.UPDATE_CELL,
										payload: {
											queryId: cell.query.id,
											cellId: cell.id,
											path: "parameters.frameType",
											value: value,
										},
									});
								}}
							>
								{Object.values(DATA_FRAME_TYPES).map(
									(frame, i) => (
										<StyledSelectItem
											key={`${i}-${cell.id}-${frame.value}`}
											value={frame.value}
										>
											{frame.display}
										</StyledSelectItem>
									),
								)}
							</StyledSelect>
							<StyledTextField
								title="Set Frame Variable Name"
								value={cell.parameters.frameVariableName}
								disabled={cell.isLoading}
								InputProps={{
									startAdornment: (
										<DriveFileRenameOutlineRounded />
									),
								}}
								onChange={(e) => {
									state.dispatch({
										message: ActionMessages.UPDATE_CELL,
										payload: {
											queryId: cell.query.id,
											cellId: cell.id,
											path: "parameters.frameVariableName",
											value: e.target.value,
										},
									});
								}}
								sx={{ width: "150px" }}
							/>
							<Tooltip
								title={
									cell.parameters.enableBatching
										? "Disable Batching"
										: "Enable Batching"
								}
							>
								<Checkbox
									checked={
										cell.parameters.enableBatching ?? false
									}
									label={
										cell.parameters.enableBatching
											? ""
											: "Enable Batching"
									}
									disabled={cell.isLoading}
									onChange={(
										_event: React.SyntheticEvent,
										checked: boolean,
									) => {
										const isEnabling = checked;
										state.dispatch({
											message: ActionMessages.UPDATE_CELL,
											payload: {
												queryId: cell.query.id,
												cellId: cell.id,
												path: "parameters.enableBatching",
												value: isEnabling,
											},
										});

										// ALWAYS reset offset to 0 when toggling batching
										state.dispatch({
											message: ActionMessages.UPDATE_CELL,
											payload: {
												queryId: cell.query.id,
												cellId: cell.id,
												path: "parameters.currentOffset",
												value: 0,
											},
										});

										if (isEnabling) {
											// Set initial batch size when enabling batching
											state.dispatch({
												message:
													ActionMessages.UPDATE_CELL,
												payload: {
													queryId: cell.query.id,
													cellId: cell.id,
													path: "parameters.batchSize",
													value: 100,
												},
											});
										}
									}}
									sx={{
										color: "text.secondary",
									}}
								/>
							</Tooltip>
							{cell.parameters.enableBatching && (
								<>
									<TextField
										size="small"
										title="Batch Size"
										type="number"
										placeholder="Batch Amount..."
										value={cell.parameters.batchSize ?? 100}
										disabled={cell.isLoading}
										onChange={(e) => {
											const inputValue = e.target.value;

											// Allow empty string for deletion
											if (inputValue === "") {
												state.dispatch({
													message:
														ActionMessages.UPDATE_CELL,
													payload: {
														queryId: cell.query.id,
														cellId: cell.id,
														path: "parameters.batchSize",
														value: "",
													},
												});
												return;
											}

											const value = Number.parseInt(
												inputValue,
												10,
											);
											if (
												!Number.isNaN(value) &&
												value >= 0
											) {
												state.dispatch({
													message:
														ActionMessages.UPDATE_CELL,
													payload: {
														queryId: cell.query.id,
														cellId: cell.id,
														path: "parameters.batchSize",
														value: value,
													},
												});
											}
										}}
										sx={{ width: "120px" }}
									/>
									<TextField
										size="small"
										title="Current Offset"
										type="number"
										value={
											cell.parameters.currentOffset ?? 0
										}
										disabled
										sx={{ width: "80px" }}
									/>
									<Button
										variant="outlined"
										size="small"
										onClick={() => {
											state.dispatch({
												message:
													ActionMessages.UPDATE_CELL,
												payload: {
													queryId: cell.query.id,
													cellId: cell.id,
													path: "parameters.currentOffset",
													value: 0,
												},
											});
										}}
										disabled={cell.isLoading}
										sx={{ minWidth: "60px" }}
									>
										Reset
									</Button>
								</>
							)}
						</Stack>
					)}
				</Stack>
				{isQueryImportModalOpen && (
					<QueryImportFormModal
						setIsQueryImportModalOpen={setIsQueryImportModalOpen}
						query={cell.query}
						cell={cell}
						editMode={true}
					/>
				)}
			</StyledContent>
		);
	},
);
