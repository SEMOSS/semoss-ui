import {
	CropFree,
	DriveFileRenameOutlineRounded,
	KeyboardArrowDown,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	FormControlLabel,
	InputAdornment,
	Select,
	Stack,
	styled,
	TextField,
} from "@semoss/ui";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
} from "../../../store";
import { DatabaseTables } from "./DatabaseTables";

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

// Reduce Initial Bundle
const Editor = lazy(() => import("@monaco-editor/react"));

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500; // ~25 lines

const StyledContent = styled("div")(({ theme }) => ({
	position: "relative",
	width: "100%",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-root": {
		color: theme.palette.text.secondary,
		display: "flex",
		gap: theme.spacing(1),
		height: "30px",
	},
}));

const StyledContainer = styled("div")(({ theme }) => ({}));

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
		const editorRef = useRef(null);

		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const [showTables, setShowTables] = useState(false);

		const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
			loading: true,
			ids: [],
			display: {},
		});
		const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
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
		}, []);

		useEffect(() => {
			if (myDbs.status !== "SUCCESS") {
				return;
			}

			const dbIds: string[] = [];
			const dbDisplay = {};
			myDbs.data.forEach((db) => {
				dbIds.push(db.app_id);
				dbDisplay[db.app_id] = db.app_name;
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
		}, [myDbs.status, myDbs.data]);

		/**
		 * Handle mounting of the editor
		 *
		 * @param editor - editor that mounted
		 * @param monaco - monaco instance
		 */
		const handleEditorMount = (editor, monaco) => {
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
		const handleEditorChange = (newValue: string) => {
			if (cell.isLoading) {
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
									disabled={cell.isLoading}
									title={"Select Database"}
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
									onClick={() => {
										setShowTables(!showTables);
									}}
								>
									{showTables ? "Hide" : "Show"} Available
									Columns
								</Button>
							</Stack>
							{showTables && cell.parameters.databaseId ? (
								<DatabaseTables
									databaseId={cell.parameters.databaseId}
								/>
							) : null}
						</Stack>
					)}
					<StyledContainer>
						<Suspense fallback={<>...</>}>
							<Editor
								value={cell.parameters.selectQuery}
								defaultValue="--SELECT * FROM..."
								language="sql" /** TODO: language support? can we tell this from the database type? */
								options={{
									scrollbar: {
										alwaysConsumeMouseWheel: false,
									},
									readOnly: false,
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
					</StyledContainer>
					{isExpanded && (
						<Stack
							direction="row"
							alignItems={"center"}
							justifyContent={"flex-end"}
							spacing={2}
							sx={{ flexWrap: "nowrap" }}
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
										width: "120px",
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
							<FormControlLabel
								control={
									<Checkbox
										checked={
											cell.parameters.enableBatching ??
											false
										}
										disabled={cell.isLoading}
										label="Enable Batching"
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>,
										) => {
											const isEnabling = e.target.checked;

											state.dispatch({
												message:
													ActionMessages.UPDATE_CELL,
												payload: {
													queryId: cell.query.id,
													cellId: cell.id,
													path: "parameters.enableBatching",
													value: isEnabling,
												},
											});

											// ALWAYS reset offset to 0 when toggling batching
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
											paddingLeft: "4px",
										}}
									/>
								}
								label=""
								sx={{
									color: "text.secondary",
									marginRight: 0,
									marginLeft: 0,
									gap: 0,
									"& .MuiFormControlLabel-label": {
										fontSize: "14px",
									},
								}}
							/>
							{cell.parameters.enableBatching && (
								<>
									<StyledTextField
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
									<StyledTextField
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
			</StyledContent>
		);
	},
);
