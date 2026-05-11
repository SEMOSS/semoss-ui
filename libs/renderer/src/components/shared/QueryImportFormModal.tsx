import { FilePenLine, Loader2, Maximize2, RotateCcw } from "lucide-react";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { runPixel, usePixel } from "@semoss/sdk/react";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableRow,
	toast,
} from "@semoss/ui/next";
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

export const QueryImportFormModal = (props: QueryImportFormModalProps) => {
	const {
		setIsQueryImportModalOpen,
		query,
		cell,
		editMode = false,
		previousCellId,
	} = props;
	const batchingCheckboxId = useId();
	const [showPreview, setShowTablePreview] = useState<boolean>(false);
	const [isDatabaseLoading, setIsDatabaseLoading] = useState<boolean>(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
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
	const pixelStringRef = useRef<string>("");

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
					toast.error(`${error}`, { position: "top-right" });
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

			toast.error(errorMessage, { position: "top-right" });
		}
	};

	const handleEditorMount = (
		editor: {
			layout: (dimensions: { width: number; height: number }) => void;
			getContainerDomNode: () => { clientWidth: number };
		},
		// biome-ignore lint/suspicious/noExplicitAny: Monaco type is complex
		monaco: any,
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
				const defaultParams =
					(
						DefaultCells as Record<
							string,
							{ parameters: QueryImportCellDef["parameters"] }
						>
					)[QueryImportCellConfig.widget]?.parameters || {};
				const config: NewCellAction["payload"]["config"] = {
					widget: QueryImportCellConfig.widget,
					parameters: {
						...defaultParams,
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
		<Dialog
			open={true}
			onOpenChange={(open) => !open && setIsQueryImportModalOpen(false)}
		>
			<DialogContent
				style={{ maxWidth: "70vw", width: "70vw" }}
				className="flex max-h-[90vh] flex-col overflow-hidden"
			>
				<DialogHeader className="px-6 pt-6">
					<div className="flex items-center gap-4">
						<DialogTitle>Query Import From</DialogTitle>
						<Select
							value={selectedDatabase}
							onValueChange={(value) => {
								setSelectedDatabase(value);
								setShowTablePreview(false);
								setPreviewError(null);
							}}
						>
							<SelectTrigger className="w-[220px]">
								<SelectValue placeholder="Select Database" />
							</SelectTrigger>
							<SelectContent>
								{userDatabases.ids.map(
									(databaseId, dbIndex) => (
										<SelectItem
											value={databaseId}
											key={`${dbIndex}-${databaseId}`}
										>
											{userDatabases.display[
												databaseId
											] ?? ""}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>
				</DialogHeader>

				{selectedDatabase && (
					<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-6">
						<div
							className="flex flex-col overflow-hidden transition-[height] duration-300"
							style={{
								height: showPreview ? "30vh" : "100%",
							}}
						>
							<div className="flex flex-1 flex-row gap-2 overflow-hidden">
								<div className="flex w-1/4 flex-col gap-1 overflow-y-auto border-border border-r pr-1 pl-1">
									<DatabaseAccordions
										databaseId={selectedDatabase}
									/>
								</div>

								<div className="flex w-3/4 flex-col gap-1 overflow-y-auto">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1">
											<Button
												onClick={() => setSqlQuery("")}
												size="sm"
												variant="outline"
											>
												<RotateCcw className="mr-1 size-4" />
												Clear
											</Button>
										</div>
										<div className="flex items-center gap-1">
											<Select
												value={frameType}
												onValueChange={(value) =>
													setFrameType(
														value as
															| "NATIVE"
															| "PY"
															| "R"
															| "GRID",
													)
												}
											>
												<SelectTrigger className="h-[30px] w-[140px]">
													<FilePenLine className="mr-2 size-4" />
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{Object.values(
														DATA_FRAME_TYPES,
													).map((frame, i) => (
														<SelectItem
															key={`${i}-${frame.value}`}
															value={frame.value}
														>
															{frame.display}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Input
												title="Set Frame Variable Name"
												value={frameVariableName ?? ""}
												placeholder="Frame Name"
												onChange={(e) =>
													setFrameVariableName(
														e.target.value,
													)
												}
												className="h-[30px] w-[160px]"
											/>
											<div className="flex min-w-[180px] items-center">
												<div className="flex items-center gap-2">
													<Checkbox
														id={batchingCheckboxId}
														checked={enableBatching}
														onCheckedChange={(
															checked,
														) => {
															setEnableBatching(
																!!checked,
															);
														}}
													/>
													<Label
														htmlFor={
															batchingCheckboxId
														}
														className="text-sm"
													>
														Enable Batching
													</Label>
												</div>
												{enableBatching && (
													<Input
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
														className="ml-1 h-[30px] w-[130px]"
													/>
												)}
											</div>
										</div>
									</div>
									<div className="flex-1 overflow-hidden rounded border border-gray-300">
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
									</div>
								</div>
							</div>
						</div>

						{showPreview && (
							<div
								className="flex flex-col overflow-hidden"
								style={{ height: "30vh" }}
							>
								<div
									className="flex h-full flex-col bg-white"
									style={{
										marginBottom: "20px",
									}}
								>
									<h3 className="mt-4 mb-5 ml-4 font-semibold text-lg">
										Preview
									</h3>
									{!sqlQuery.trim() ||
									sqlQuery.trim().toLowerCase() ===
										"--select * from..." ? (
										<div className="mx-4 mb-4 rounded border border-gray-200 bg-gray-50 p-4 text-center">
											<p className="text-muted-foreground text-sm">
												Enter a SQL query to view
												preview
											</p>
										</div>
									) : isDatabaseLoading ? (
										<div className="flex min-h-[200px] items-center justify-center">
											<Loader2 className="size-8 animate-spin text-primary" />
										</div>
									) : previewError ? (
										<div className="mx-4 mb-4 rounded border border-red-200 bg-red-50 p-4">
											<p className="text-red-600 text-sm">
												<strong>Error:</strong>{" "}
												{previewError}
											</p>
										</div>
									) : databaseTableHeaders.length === 0 ||
										databaseTableRows.length === 0 ? (
										<p className="p-10 text-center font-bold text-lg">
											No Rows
										</p>
									) : (
										<div
											className="flex-1 overflow-y-scroll"
											style={{ maxHeight: "350px" }}
										>
											<Table className="bg-white">
												<TableBody>
													<TableRow>
														{databaseTableHeaders.map(
															(
																headers,
																headerIdx,
															) => (
																<TableCell
																	key={`${headerIdx}-${headers}`}
																>
																	<strong>
																		{
																			headers
																		}
																	</strong>
																</TableCell>
															),
														)}
													</TableRow>
													{databaseTableRows.map(
														(rows, rowIdx) => (
															<TableRow
																key={`${rowIdx}-${rows}`}
															>
																{rows.map(
																	(
																		value,
																		valueIdx,
																	) => (
																		<TableCell
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
																		</TableCell>
																	),
																)}
															</TableRow>
														),
													)}
												</TableBody>
											</Table>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{!selectedDatabase && (
					<div className="p-4 text-center">
						<p className="text-muted-foreground text-sm">
							Select a Database for Import
						</p>
					</div>
				)}

				<DialogFooter className="border-t p-4">
					<Button
						variant="outline"
						onClick={() => setIsQueryImportModalOpen(false)}
					>
						Cancel
					</Button>
					<Button
						variant="outline"
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
							sqlQuery.trim().toLowerCase() ===
								"--select * from..."
						}
					>
						<Maximize2 className="mr-2 size-4" />
						{showPreview ? "Hide Preview" : "Show Preview"}
					</Button>
					<Button
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
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
