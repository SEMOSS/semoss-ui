// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import {
	CalendarViewMonth,
	CropFree,
	DriveFileRenameOutlineRounded,
	Edit,
	JoinFull,
	JoinInner,
	JoinLeft,
	JoinRight,
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
	IconButton,
	InputAdornment,
	Modal,
	Select,
	Stack,
	styled,
	TextField,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
} from "../../../store";
import { DataImportFormModal } from "../../shared/DataImportFormModal";

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

const JOIN_ICONS = {
	inner: <JoinInner />,
	"right.outer": <JoinRight />,
	"left.outer": <JoinLeft />,
	outer: <JoinFull />,
};

const StyledIconButton = styled(IconButton)({
	marginRight: "7.5px",
	marginLeft: "7.5px",
});

const StyledPaddedFlexDiv = styled("div")({
	alignItems: "center",
	display: "flex",
});

const StyledFlexDiv = styled("div")({
	alignItems: "center",
	paddingBottom: "0",
	marginBottom: "0",
	display: "flex",
});

const StyledCalendarViewMonth = styled(CalendarViewMonth)({
	strokeWidth: 0.025,
	marginLeft: "-3px",
	marginRight: "7px",
	color: "#95909C",
});

const BlueStyledJoinDiv = styled("div")(({ theme }) => ({
	backgroundColor: theme.palette.primary.selected,
	padding: "0px 12px",
	borderRadius: "12px",
	fontSize: "12.5px",
	border: "none",
	color: "black",
	cursor: "default",
	fontWeight: "500",
}));

const GreenStyledJoinDiv = styled("div")({
	border: "none",
	padding: "0px 12px",
	backgroundColor: "#DEF4F3",
	borderRadius: "12px",
	fontSize: "12.5px",
	color: "black",
	cursor: "default",
	fontWeight: "500",
});

const StyledJoinTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.secondary.dark,
	marginRight: "12.5px",
	marginLeft: "12.5px",
	cursor: "default",
}));

const StyledModalTitleWrapper = styled(Modal.Title)({
	alignContent: "center",
	display: "flex",
	padding: "0px",
});

const StyledTableTitleBubble = styled("div")({
	marginTop: "0px",
	marginRight: "15px",
	width: "fit-content",
	backgroundColor: "#F1E9FB",
	padding: "7.5px 17.5px",
	display: "inline-flex",
	borderRadius: "10px",
	alignItems: "center",
	fontWeight: "400",
	fontSize: "12.5px",
	cursor: "default",
});

const StyledContent = styled("div")({
	position: "relative",
	width: "100%",
});

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-root": {
		color: theme.palette.text.secondary,
		gap: theme.spacing(1),
		display: "flex",
		height: "30px",
		width: "200px",
	},
}));

const StyledBlockStack = styled(Stack)({
	display: "block",
});

interface JoinObject {
	id: string;
	joinType: string;
	leftTable: string;
	rightTable: string;
	rightKey: string;
	leftKey: string;
}

// TODO add filters and summaries
// interface FilterObject {
//     // structure for filters
// }
// interface summaryObject {
//     // structure for summaries
// }

export interface DataImportCellDef extends CellDef<"data-import"> {
	widget: "data-import";
	parameters: {
		databaseId: string;
		frameType: "NATIVE" | "PY" | "R" | "GRID" | "PIXEL";
		frameVariableName: string;
		selectQuery: string;
		rootTable: string;
		selectedColumns: string[];
		columnAliases: string[];
		tableNames: string[];
		joins: JoinObject[];
		dataLimit: number;
		enableBatching?: boolean;
		batchSize?: number;
		currentOffset?: number;
		// TODO add filters and summaries
		// filters: FilterObject[];
		// summaries: FilterObject[];
	};
}

export const DataImportCell: CellComponent<DataImportCellDef> = observer(
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
		const [showStyledView, setShowStyledView] = useState(true);
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const [isDataImportModalOpen, setIsDataImportModalOpen] =
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
		const [dataLimit, setDataLimit] = useState(
			cell.parameters.dataLimit === -1 ? "" : cell.parameters.dataLimit,
		);

		const myDbs = usePixel<{ engine_id: string; engine_name: string }[]>(
			`MyEngines(engineTypes=['DATABASE']);`,
		);

		// Ensure offset starts at 0 when component first mounts with batching enabled
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
			// Sync local dataLimit state with cell parameters when they change
			const newDataLimit =
				cell.parameters.dataLimit === -1
					? ""
					: cell.parameters.dataLimit;
			setDataLimit(newDataLimit);
		}, [cell.parameters.dataLimit]);

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
				display: dbDisplay,
				ids: dbIds,
			});

			if (!cell.parameters.databaseId && dbIds.length) {
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						path: "parameters.databaseId",
						queryId: cell.query.id,
						cellId: cell.id,
						value: dbIds[0],
					},
				});
			}
		}, [myDbs.status, myDbs.data]);

		/**
		 * Handle mounting of the editor
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
							path: "parameters.selectQuery",
							queryId: cell.query.id,
							cellId: cell.id,
							value: newValue,
						},
					});

					state.dispatch({
						message: ActionMessages.RUN_CELL,
						payload: {
							queryId: cell.query.id,
							cellId: cell.id,
						},
					});
				},
			});

			monaco.editor.defineTheme("custom-theme", {
				base: "vs",
				inherit: false,
				rules: [],
				colors: {
					"editor.background": "#FAFAFA",
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
		 * Handle changes in the editor - currently not in use, will need work if edits are enabled
		 * @param newValue - newValue
		 * @returns
		 */
		const handleEditorChange = (newValue: string | undefined) => {
			if (cell.isLoading) {
				return;
			}

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					value: newValue,
					path: "parameters.selectQuery",
					queryId: cell.query.id,
					cellId: cell.id,
				},
			});
		};

		const openEditModal = () => {
			setIsDataImportModalOpen(true);
		};

		const updateDataLimit = (query: string): string => {
			return query.replace(
				/Limit\s*\(\s*-*\d+\s*\)/,
				`Limit ( ${cell.parameters.dataLimit || -1} )`,
			);
		};

		const handleDataLimitUpdate = (
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			const inputValue = e.target.value;

			// Handle empty string - set to -1 (no limit)
			if (inputValue === "") {
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						path: "parameters.dataLimit",
						queryId: cell.query.id,
						cellId: cell.id,
						value: -1,
					},
				});
				const updatedSelectQuery = updateDataLimit(
					cell.parameters.selectQuery,
				);
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						path: "parameters.selectQuery",
						queryId: cell.query.id,
						cellId: cell.id,
						value: updatedSelectQuery,
					},
				});
				setDataLimit("");
				return;
			}

			let value = parseInt(e.target.value, 10);
			if (Number.isNaN(value)) {
				return; // Don't update if invalid
			}

			// Clamp value between 1 and 10000
			if (value <= 0) {
				value = 1;
			}
			if (value >= 10000) {
				value = 10000;
			}

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					path: "parameters.dataLimit",
					queryId: cell.query.id,
					cellId: cell.id,
					value: value,
				},
			});
			const updatedSelectQuery = updateDataLimit(
				cell.parameters.selectQuery,
			);
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					path: "parameters.selectQuery",
					queryId: cell.query.id,
					cellId: cell.id,
					value: updatedSelectQuery,
				},
			});
			setDataLimit(value);
		};
		const updateFrameType = (e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					path: "parameters.frameType",
					queryId: cell.query.id,
					cellId: cell.id,
					value: value,
				},
			});
		};

		return (
			<StyledContent>
				<Stack direction="column" spacing={1}>
					{isExpanded && (
						<Stack direction={"column"}>
							<Stack
								justifyContent={"space-between"}
								direction="row"
							>
								<StyledSelect
									value={cell.parameters.databaseId}
									title={"Database Not Editable"}
									variant="standard"
									disabled={true}
									size={"small"}
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
												path: "parameters.databaseId",
												queryId: cell.query.id,
												cellId: cell.id,
												value: value,
											},
										});
									}}
									key={`database-${cell.parameters.databaseId}`}
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
										openEditModal();
									}}
									startIcon={<Edit />}
									key={`cell-edit-data-import-${cell.id}`}
								>
									Edit
								</Button>
							</Stack>
						</Stack>
					)}
					{showStyledView ? (
						<>
							<StyledFlexDiv>
								{cell.parameters.tableNames?.map(
									(tableName) => (
										<Tooltip
											title={`${tableName} Table`}
											key={`table-key-${tableName}`}
										>
											<StyledTableTitleBubble>
												<StyledCalendarViewMonth fontSize="small" />
												{tableName}
											</StyledTableTitleBubble>
										</Tooltip>
									),
								)}
							</StyledFlexDiv>

							{isExpanded &&
								cell.parameters.joins &&
								cell.parameters.joins.map((join) => (
									<StyledBlockStack
										direction="column"
										spacing={1}
										key={`column-${join.leftTable}-${join.joinType}}`}
									>
										<StyledModalTitleWrapper>
											<StyledPaddedFlexDiv>
												<Tooltip title="Left Join Table">
													<BlueStyledJoinDiv>
														{join.leftTable}
													</BlueStyledJoinDiv>
												</Tooltip>

												<Tooltip
													title={`${join.joinType} join`}
												>
													<StyledIconButton
														size="small"
														color="secondary"
													>
														{
															JOIN_ICONS[
																join.joinType as keyof typeof JOIN_ICONS
															]
														}
													</StyledIconButton>
												</Tooltip>

												<Tooltip title="Right Join Table">
													<GreenStyledJoinDiv>
														{join.rightTable}
													</GreenStyledJoinDiv>
												</Tooltip>

												<StyledJoinTypography variant="body1">
													ON
												</StyledJoinTypography>

												<Tooltip title="Left Join Key">
													<BlueStyledJoinDiv>
														{join.leftKey}
													</BlueStyledJoinDiv>
												</Tooltip>

												<StyledJoinTypography variant="body1">
													=
												</StyledJoinTypography>

												<Tooltip title="Right Join Key">
													<GreenStyledJoinDiv>
														{join.rightKey}
													</GreenStyledJoinDiv>
												</Tooltip>
											</StyledPaddedFlexDiv>
										</StyledModalTitleWrapper>
									</StyledBlockStack>
								))}
						</>
					) : (
						<div>
							<Suspense fallback={<>...</>}>
								<MonacoEditor
									// value is appended to make pixel valid for copy / paste to other pixel cell
									defaultValue={
										cell.parameters.selectQuery
											.slice(0, -1)
											.replace(
												/\s*\|\s*Limit\s*\(\s*[^)]*\s*\)/,
												"",
											) +
										(cell.parameters.enableBatching
											? ` | Offset ( ${cell.parameters.currentOffset ?? 0} ) | Limit ( ${cell.parameters.batchSize ?? 100} ) | Import ( frame = [ CreateFrame ( frameType = [ "${cell.parameters.frameType}" ] , override = [ true ] ) .as ( [ "${cell.parameters.frameVariableName}" ] ) ] ) ; Frame ( frame = [ "${cell.parameters.frameVariableName}" ] ) | QueryAll ( ) | Limit ( 20 ) | CollectAll ( ) ;`
											: ` | Import ( frame = [ CreateFrame ( frameType = [ "${cell.parameters.frameType}" ] , override = [ true ] ) .as ( [ "${cell.parameters.frameVariableName}" ] ) ] ) ; Frame ( frame = [ "${cell.parameters.frameVariableName}" ] ) | QueryAll ( ) | Limit ( 20 ) | CollectAll ( ) ;`)
									}
									language="pixel"
									options={{
										scrollbar: {
											alwaysConsumeMouseWheel: false,
										},
										lineHeight: EDITOR_LINE_HEIGHT,
										scrollBeyondLastLine: false,
										overviewRulerBorder: false,
										minimap: { enabled: false },
										lineNumbersMinChars: 2,
										automaticLayout: true,
										glyphMargin: false,
										lineNumbers: "on",
										readOnly: true,
										folding: false,
									}}
									onChange={handleEditorChange}
									onMount={handleEditorMount}
								/>
							</Suspense>
						</div>
					)}
					{isExpanded && (
						<Stack
							justifyContent={"flex-end"}
							alignItems={"center"}
							paddingTop={"0px"}
							direction="row"
							spacing={1}
						>
							{!cell.parameters.enableBatching && (
								<StyledTextField
									type="number"
									size="small"
									placeholder="Data Limit"
									value={dataLimit}
									onChange={handleDataLimitUpdate}
									disabled={
										cell.parameters.enableBatching ?? false
									}
									key={`data-limit-number`}
								/>
							)}
							<Button
								variant={"text"}
								color={"primary"}
								size={"small"}
								onClick={() => {
									setShowStyledView(!showStyledView);
								}}
								key={`show-hide-pixel-button`}
							>
								{showStyledView ? "Show" : "Hide"} Pixel
							</Button>

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
								onChange={updateFrameType}
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
								key={`frame-variable-name-${cell.id}`}
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
											path: "parameters.frameVariableName",
											queryId: cell.query.id,
											value: e.target.value,
											cellId: cell.id,
										},
									});
								}}
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
				{isDataImportModalOpen && (
					<DataImportFormModal
						setIsDataImportModalOpen={setIsDataImportModalOpen}
						query={cell.query}
						previousCellId={undefined}
						editMode={true}
						cell={cell}
					/>
				)}
			</StyledContent>
		);
	},
);
