import {
	CropFree,
	DriveFileRenameOutlineRounded,
	KeyboardArrowDown,
	Refresh,
} from "@mui/icons-material";
import { TableContainer } from "@mui/material";
import { Suspense, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { runPixel, usePixel } from "@semoss/sdk/react";
import { MonacoEditor } from "@semoss/shared";
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	InputAdornment,
	Menu,
	Modal,
	Select,
	Stack,
	styled,
	Table,
	TextField,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useBlocks } from "../../hooks";
import {
	ActionMessages,
	type CellStateConfig,
	type NewCellAction,
	type QueryState,
} from "../../store";
import { DefaultCells } from "../cell-defaults";
import {
	QueryImportCellConfig,
	type QueryImportCellDef,
} from "../cell-defaults/query-import-cell";
import { DatabaseAccordions } from "../cell-defaults/query-import-cell/DatabaseAccordions";

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MIN_HEIGHT = 300;

const IMPORT_MODAL_WIDTHS = {
	small: "500px",
	medium: "1550px",
	large: "1550px",
};

const StyledModalTitle = styled(Typography)(() => ({
	alignContent: "center",
	marginRight: "15px",
}));

const StyledModalTitleWrapper = styled(Modal.Title)(() => ({
	justifyContent: "space-between",
	alignContent: "center",
	display: "flex",
	padding: "0px",
	marginBottom: "15px",
	marginTop: "25px",
}));

const StyledDivFitContent = styled("div")(() => ({
	width: "fit-content",
	blockSize: "fit-content",
	display: "flex",
}));

const StyledSelectMinWidth = styled(Select)(() => ({
	minWidth: "220px",
}));

const StyledModalContent = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const StyledEditColumnsWrapper = styled("div")<{ showPreview: boolean }>(
	({ showPreview }) => ({
		height: showPreview ? "65%" : "100%",
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
		transition: "height 0.3s ease",
	}),
);

const StyledPreviewWrapper = styled("div")(() => ({
	height: "35%",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
	marginTop: "16px",
}));

const StyledSplitContainer = styled("div")(({ theme }) => ({
	display: "grid",
	gridTemplateColumns: "400px 1fr",
	gap: theme.spacing(2),
	flex: 1,
	overflow: "hidden",
}));

const StyledColumnsSection = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	overflowY: "auto",
	borderRight: `1px solid ${theme.palette.divider}`,
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
}));

const StyledEditorSection = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	overflowY: "auto",
}));

const StyledEditorContainer = styled("div")(({ theme }) => ({
	flex: 1,
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
}));

const StyledPaddedStack = styled(Stack)(() => ({
	backgroundColor: "#FAFAFA",
	padding: "16px 16px 16px 16px",
	marginBottom: "15px",
}));

const ScrollTableSetContainer = styled(TableContainer)(() => ({
	maxHeight: "350px",
	overflowY: "scroll",
}));

const StyledTableSetWrapper = styled("div")(() => ({
	backgroundColor: "#fff",
	marginBottom: "20px",
}));

const StyledTableTitle = styled(Typography)(() => ({
	marginTop: "15px",
	marginLeft: "15px",
	marginBottom: "20px",
}));

const StyledLoadingContainer = styled("div")(() => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	minHeight: "200px",
}));

const StyledEmptyMessage = styled(Typography)(() => ({
	textAlign: "center",
	padding: "40px",
	fontWeight: "bold",
}));

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

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-root": {
		color: theme.palette.text.secondary,
		display: "flex",
		gap: theme.spacing(1),
		height: "30px",
	},
}));

interface QueryImportFormModalProps {
	setIsQueryImportModalOpen: (open: boolean) => void;
	query: QueryState;
	cell: {
		id: string;
		query: QueryState;
		parameters: QueryImportCellDef["parameters"];
	};
	editMode?: boolean;
	previousCellId?: string;
}

interface FormData {
	databaseSelect: string;
}

export const QueryImportFormModal = (props: QueryImportFormModalProps) => {
	const {
		setIsQueryImportModalOpen,
		query,
		cell,
		editMode = false,
		previousCellId,
	} = props;
	const [showPreview, setShowTablePreview] = useState<boolean>(false);
	const [isDatabaseLoading, setIsDatabaseLoading] = useState<boolean>(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [importModalPixelWidth, setImportModalPixelWidth] = useState<string>(
		cell?.parameters?.databaseId
			? IMPORT_MODAL_WIDTHS.medium
			: IMPORT_MODAL_WIDTHS.small,
	);
	const [databaseTableRows, setDatabaseTableRows] = useState<unknown[][]>([]);
	const [databaseTableHeaders, setDatabaseTableHeaders] = useState<string[]>(
		[],
	);
	// Select Database
	const [selectedDatabase, setSelectedDatabase] = useState(
		cell?.parameters?.databaseId || "",
	);
	const [userDatabases, setUserDatabases] = useState<{
		ids: string[];
		display: Record<string, string>;
	}>({ ids: [], display: {} });

	// SQL Query Input
	const [sqlQuery, setSqlQuery] = useState(
		cell?.parameters?.selectQuery || "--SELECT * FROM...",
	);
	// Frame Inputs
	const [frameType, setFrameType] = useState(
		cell?.parameters?.frameType || "GRID",
	);
	const [frameVariableName, setFrameVariableName] = useState(
		cell?.parameters?.frameVariableName || null,
	);
	// Batching Inputs
	const [enableBatching, setEnableBatching] = useState(
		cell?.parameters?.enableBatching ?? false,
	);
	const [batchSize, setBatchSize] = useState<number | "">(
		cell?.parameters?.batchSize ?? 100,
	);

	const { state, notebook } = useBlocks();
	const editorRef = useRef<{
		layout: (dimensions: { width: number; height: number }) => void;
		getContainerDomNode: () => { clientWidth: number };
	} | null>(null);
	const notification = useNotification();
	const pixelStringRef = useRef<string>("");

	const { control: formControl } = useForm<FormData>({
		defaultValues: {
			databaseSelect: cell?.parameters?.databaseId || "",
		},
	});

	const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
		`MyEngines(engineTypes=['DATABASE']);`,
	);

	// After user databases are loaded, set the database ids and names
	// If no database is selected in the cell, set the first database as default
	useEffect(() => {
		if (myDbs.status !== "SUCCESS") {
			return;
		}

		const dbIds: string[] = [];
		const dbDisplay: Record<string, string> = {};
		myDbs.data?.forEach((db) => {
			dbIds.push(db.app_id);
			dbDisplay[db.app_id] = db.app_name;
		});
		setUserDatabases({
			// loading: false,
			ids: dbIds,
			display: dbDisplay,
		});
	}, [myDbs.status, myDbs.data]);

	const retrievePreviewData = async () => {
		setIsDatabaseLoading(true);
		setPreviewError(null);
		const databaseId = selectedDatabase;

		try {
			// Escape double quotes in SQL query
			const escapedQuery = sqlQuery.replace(/"/g, '\\"');

			// Build pixel query for preview
			const reactorPixel = `Database ( database = [ "${databaseId}" ] ) | Query ( "${escapedQuery}" ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "query_import_preview_frame" ] ) ] ) ; META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

			pixelStringRef.current = reactorPixel;

			runPixel(reactorPixel).then((response) => {
				const type = response.pixelReturn[0]?.operationType;

				const o = response.pixelReturn[1]?.output as {
					data: {
						values: unknown[][];
						headers: string[];
					};
				};
				const tableHeadersData = o.data?.headers;
				const tableRowsData = o.data?.values;

				if (type.indexOf("ERROR") !== -1) {
					const error = response.pixelReturn[0]?.output;
					console.error(`${error}`);
					setPreviewError(`${error}`);
					notification.add({
						color: "error",
						message: `${error}`,
					});
					setIsDatabaseLoading(false);
					return;
				}

				setDatabaseTableHeaders(tableHeadersData);
				setDatabaseTableRows(tableRowsData);
				setIsDatabaseLoading(false);
			});
		} catch (error) {
			console.error("Error in preview:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Error running query preview";
			setPreviewError(errorMessage);
			setIsDatabaseLoading(false);

			notification.add({
				color: "error",
				message: errorMessage,
			});
		}
	};

	const handleEditorMount = (
		editor: {
			layout: (dimensions: { width: number; height: number }) => void;
			getContainerDomNode: () => { clientWidth: number };
		},
		monaco: {
			editor: {
				defineTheme: (name: string, theme: unknown) => void;
				setTheme: (name: string) => void;
			};
		},
	) => {
		editorRef.current = editor;

		monaco.editor.defineTheme("custom-theme", {
			base: "vs",
			inherit: false,
			rules: [],
			colors: {
				"editor.background": "#FAFAFA",
			},
		});

		monaco.editor.setTheme("custom-theme");

		// Set minimum height
		editor.layout({
			width: editor.getContainerDomNode().clientWidth,
			height: EDITOR_MIN_HEIGHT,
		});
	};

	const handleImport = async () => {
		if (editMode && cell) {
			// Update database id
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
					path: "parameters.databaseId",
					value: selectedDatabase,
				},
			});

			// Update SQL Query
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
					path: "parameters.selectQuery",
					value: sqlQuery,
				},
			});

			// Update frame parameters
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
					path: "parameters.frameType",
					value: frameType,
				},
			});
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
					path: "parameters.frameVariableName",
					value: frameVariableName,
				},
			});

			// Update batching parameters
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
					path: "parameters.enableBatching",
					value: enableBatching,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
					path: "parameters.batchSize",
					value: batchSize,
				},
			});

			// Always reset offset to 0 when importing
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
					path: "parameters.currentOffset",
					value: 0,
				},
			});

			// Run the cell
			state.dispatch({
				message: ActionMessages.RUN_CELL,
				payload: {
					queryId: query.id,
					cellId: cell.id,
				},
			});
		} else {
			// Create new cell
			try {
				const config: NewCellAction["payload"]["config"] = {
					widget: QueryImportCellConfig.widget,
					parameters: {
						...DefaultCells[QueryImportCellConfig.widget]
							.parameters,
						frameVariableName: frameVariableName,
						frameType: frameType,
						databaseId: selectedDatabase,
						selectQuery: sqlQuery,
						enableBatching: enableBatching,
						batchSize: batchSize,
						currentOffset: 0,
					},
				};

				const newCellId = (await state.dispatch({
					message: ActionMessages.NEW_CELL,
					payload: {
						queryId: query.id,
						previousCellId: previousCellId ?? "",
						config: config as Omit<CellStateConfig, "id">,
					},
				})) as string;

				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: `${query.id}--${newCellId}`,
						type: "cell",
						to: query.id,
						cellId: newCellId,
					},
				});

				notebook.selectCell(query.id, newCellId);

				// Run the new cell
				state.dispatch({
					message: ActionMessages.RUN_CELL,
					payload: {
						queryId: query.id,
						cellId: newCellId,
					},
				});
			} catch (e) {
				console.error(e);
			}
		}

		setIsQueryImportModalOpen(false);
	};

	return (
		<Modal
			open={true}
			onClose={() => setIsQueryImportModalOpen(false)}
			maxWidth="xl"
		>
			<Modal.Content sx={{ width: importModalPixelWidth }}>
				<StyledModalContent>
					<StyledModalTitleWrapper>
						<StyledDivFitContent>
							<StyledModalTitle variant="h6">
								Query Import From
							</StyledModalTitle>
							<Controller
								name={"databaseSelect"}
								control={formControl}
								render={({ field }) => (
									<StyledSelectMinWidth
										onChange={(e) => {
											field.onChange(e.target.value);
											setSelectedDatabase(e.target.value);
											setShowTablePreview(false);
											setPreviewError(null);
											setImportModalPixelWidth(
												IMPORT_MODAL_WIDTHS.medium,
											);
										}}
										label={"Select Database"}
										value={field.value || ""}
										size={"small"}
									>
										{userDatabases.ids.map(
											(databaseId, dbIndex) => (
												<Menu.Item
													value={databaseId}
													key={`${dbIndex}-${databaseId}`}
												>
													{userDatabases.display[
														databaseId
													] ?? ""}
												</Menu.Item>
											),
										)}
									</StyledSelectMinWidth>
								)}
							/>
						</StyledDivFitContent>
					</StyledModalTitleWrapper>
					{selectedDatabase && (
						<StyledEditColumnsWrapper showPreview={showPreview}>
							<StyledSplitContainer>
								<StyledColumnsSection>
									<Typography variant="subtitle2">
										Available Columns
									</Typography>
									<DatabaseAccordions
										databaseId={selectedDatabase}
									/>
								</StyledColumnsSection>

								<StyledEditorSection>
									<Stack
										direction={"row"}
										justifyContent="space-between"
										alignItems="center"
									>
										<Stack
											spacing={1}
											direction={"row"}
											sx={{ alignItems: "center" }}
										>
											<Typography variant="subtitle2">
												SQL Query
											</Typography>
											<Button
												onClick={() => setSqlQuery("")}
												startIcon={<Refresh />}
												size="small"
											>
												Clear
											</Button>
										</Stack>
										<Stack
											spacing={1}
											direction={"row"}
											alignItems="center"
										>
											<StyledSelect
												size={"small"}
												title={"Select Type"}
												value={frameType}
												SelectProps={{
													IconComponent:
														KeyboardArrowDown,
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
												onChange={(e) =>
													setFrameType(
														e.target.value as
															| "NATIVE"
															| "PY"
															| "R"
															| "GRID",
													)
												}
											>
												{Object.values(
													DATA_FRAME_TYPES,
												).map((frame, i) => (
													<StyledSelectItem
														key={`${i}-${frame.value}`}
														value={frame.value}
													>
														{frame.display}
													</StyledSelectItem>
												))}
											</StyledSelect>
											<StyledTextField
												title="Set Frame Variable Name"
												value={frameVariableName}
												placeholder="Frame Name"
												InputProps={{
													startAdornment: (
														<DriveFileRenameOutlineRounded />
													),
												}}
												onChange={(e) =>
													setFrameVariableName(
														e.target.value,
													)
												}
												sx={{ width: "160px" }}
											/>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													minWidth: "180px",
												}}
											>
												<Tooltip
													title={
														enableBatching
															? "Disable Batching"
															: "Enable Batching"
													}
												>
													<Checkbox
														checked={enableBatching}
														label={
															enableBatching
																? ""
																: "Enable Batching"
														}
														onChange={(
															_event: React.SyntheticEvent,
															checked: boolean,
														) => {
															setEnableBatching(
																checked,
															);
														}}
														sx={{
															color: "text.secondary",
														}}
													/>
												</Tooltip>
												{enableBatching && (
													<StyledTextField
														title="Batch Size"
														type="number"
														placeholder="Batch Amount..."
														value={batchSize}
														onChange={(e) => {
															const inputValue =
																e.target.value;
															if (
																inputValue ===
																""
															) {
																setBatchSize(
																	"",
																);
																return;
															}
															const value =
																Number.parseInt(
																	inputValue,
																	10,
																);
															if (
																!Number.isNaN(
																	value,
																) &&
																value >= 0
															) {
																setBatchSize(
																	value,
																);
															}
														}}
														sx={{ width: "130px" }}
													/>
												)}
											</Box>
										</Stack>
									</Stack>
									<StyledEditorContainer>
										<Suspense
											fallback={<>Loading editor...</>}
										>
											<MonacoEditor
												value={sqlQuery}
												language="sql"
												options={{
													scrollbar: {
														alwaysConsumeMouseWheel: false,
													},
													readOnly: false,
													minimap: { enabled: false },
													automaticLayout: true,
													scrollBeyondLastLine: false,
													lineHeight:
														EDITOR_LINE_HEIGHT,
													overviewRulerBorder: false,
													lineNumbers: "on",
													glyphMargin: false,
													folding: true,
													lineNumbersMinChars: 2,
												}}
												onChange={(value) =>
													setSqlQuery(value || "")
												}
												onMount={handleEditorMount}
											/>
										</Suspense>
									</StyledEditorContainer>
								</StyledEditorSection>
							</StyledSplitContainer>
						</StyledEditColumnsWrapper>
					)}

					{!selectedDatabase && (
						<StyledPaddedStack spacing={1} direction="column">
							<Typography variant="subtitle2" color="secondary">
								Select a Database for Import
							</Typography>
						</StyledPaddedStack>
					)}

					{showPreview && (
						<StyledPreviewWrapper>
							<StyledTableSetWrapper
								style={{
									height: "100%",
									display: "flex",
									flexDirection: "column",
								}}
							>
								<StyledTableTitle variant="h6">
									Preview
								</StyledTableTitle>
								{!sqlQuery.trim() ||
								sqlQuery.trim().toLowerCase() ===
									"--select * from..." ? (
									<Box
										sx={{
											padding: "16px",
											backgroundColor: "#F5F5F5",
											border: "1px solid #E0E0E0",
											borderRadius: "4px",
											margin: "0 16px 16px 16px",
											textAlign: "center",
										}}
									>
										<Typography
											variant="body2"
											color="textSecondary"
										>
											Enter a SQL query to view preview
										</Typography>
									</Box>
								) : isDatabaseLoading ? (
									<StyledLoadingContainer>
										<CircularProgress />
									</StyledLoadingContainer>
								) : previewError ? (
									<Box
										sx={{
											padding: "16px",
											backgroundColor: "#FEF2F2",
											border: "1px solid #FCA5A5",
											borderRadius: "4px",
											margin: "0 16px 16px 16px",
										}}
									>
										<Typography
											variant="body2"
											color="error"
										>
											<strong>Error:</strong>{" "}
											{previewError}
										</Typography>
									</Box>
								) : databaseTableHeaders.length === 0 ||
									databaseTableRows.length === 0 ? (
									<StyledEmptyMessage variant="h6">
										No Rows
									</StyledEmptyMessage>
								) : (
									<ScrollTableSetContainer
										style={{ flex: 1 }}
									>
										<Table
											stickyHeader
											size={"small"}
											sx={{ backgroundColor: "#FFFF" }}
										>
											<Table.Body>
												<Table.Row>
													{databaseTableHeaders.map(
														(
															headers,
															headerIdx,
														) => (
															<Table.Cell
																key={`${headerIdx}-${headers}`}
															>
																<strong>
																	{headers}
																</strong>
															</Table.Cell>
														),
													)}
												</Table.Row>
												{databaseTableRows.map(
													(rows, rowIdx) => (
														<Table.Row
															key={`${rowIdx}-${rows}`}
														>
															{rows.map(
																(
																	value,
																	valueIdx,
																) => (
																	<Table.Cell
																		key={`${valueIdx}-${value}`}
																	>
																		{typeof value ===
																			"object" &&
																		value !==
																			null
																			? JSON.stringify(
																					value,
																				)
																			: String(
																					value ??
																						"",
																				)}
																	</Table.Cell>
																),
															)}
														</Table.Row>
													),
												)}
											</Table.Body>
										</Table>
									</ScrollTableSetContainer>
								)}
							</StyledTableSetWrapper>
						</StyledPreviewWrapper>
					)}
				</StyledModalContent>
			</Modal.Content>
			<Modal.Actions>
				<Button
					variant="text"
					onClick={() => setIsQueryImportModalOpen(false)}
				>
					Cancel
				</Button>
				<Button
					variant="outlined"
					onClick={() => {
						if (showPreview) {
							setShowTablePreview(false);
						} else {
							setShowTablePreview(true);
							retrievePreviewData();
						}
					}}
					disabled={
						!selectedDatabase ||
						!sqlQuery.trim() ||
						sqlQuery.trim().toLowerCase() === "--select * from..."
					}
				>
					{showPreview ? "Hide Preview" : "Show Preview"}
				</Button>
				<Button
					variant="contained"
					onClick={handleImport}
					disabled={
						!selectedDatabase ||
						!sqlQuery.trim() ||
						sqlQuery.trim().toLowerCase() ===
							"--select * from..." ||
						!frameVariableName?.trim()
					}
				>
					Import
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
