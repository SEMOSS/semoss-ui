import {
	ArrowLeftFromLine,
	ArrowRightFromLine,
	Loader2,
	Merge,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
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
import { DataImportCellConfig } from "../cell-defaults/data-import-cell";
import { DatabaseAccordions } from "../cell-defaults/query-import-cell/DatabaseAccordions";

const JOIN_ICONS = {
	inner: <Merge className="size-4" />,
	"right.outer": <ArrowRightFromLine className="size-4" />,
	"left.outer": <ArrowLeftFromLine className="size-4" />,
	outer: <Merge className="size-4" />,
};

type JoinElement = {
	leftTable: string;
	rightTable: string;
	joinType: string;
	leftKey: string;
	rightKey: string;
};

interface Column {
	columnName: string;
	columnType: string;
	alias: string;
}

export const DataImportFormModal = observer(
	(props: {
		query?: QueryState;
		previousCellId?: string;
		setIsDataImportModalOpen?: (open: boolean) => void;
		editMode?: boolean;
		cell?: {
			id: string;
			query: QueryState;
			parameters: {
				databaseId: string;
				rootTable: string;
				selectedColumns?: string[];
				columnAliases?: string[];
				joins?: JoinElement[];
				[key: string]: unknown;
			};
		};
	}): JSX.Element => {
		const {
			query,
			previousCellId,
			setIsDataImportModalOpen,
			editMode,
			cell,
		} = props;

		const { state, notebook } = useBlocks();

		// Database state
		const [userDatabases, setUserDatabases] = useState<
			{ database_id: string; app_name: string }[] | null
		>(null);
		const [selectedDatabaseId, setSelectedDatabaseId] = useState<
			string | null
		>(cell ? cell.parameters.databaseId : null);
		const getDatabases = usePixel("META | GetDatabaseList ( ) ;");

		// Column selection state - simplified from react-hook-form
		const [selectedColumns, setSelectedColumns] = useState<{
			[tableName: string]: Column[];
		}>({});
		const [selectedTableName, setSelectedTableName] = useState<
			string | null
		>(cell ? cell.parameters.rootTable : null);

		// Join state
		const [joins, setJoins] = useState<JoinElement[]>([]);
		const [joinTypeSelectIndex, setJoinTypeSelectIndex] = useState(-1);
		const [isJoinSelectOpen, setIsJoinSelectOpen] = useState(false);

		// Table edges for determining available joins
		const [tableEdges, setTableEdges] = useState<{
			[tableName: string]: {
				[relatedTable: string]: { leftKey: string; rightKey: string };
			};
		}>({});

		// Preview state
		const [showPreview, setShowPreview] = useState<boolean>(false);
		const [isDatabaseLoading, setIsDatabaseLoading] =
			useState<boolean>(false);
		const [databaseTableHeaders, setDatabaseTableHeaders] = useState<
			string[]
		>([]);
		const [databaseTableRows, setDatabaseTableRows] = useState<unknown[][]>(
			[],
		);

		// Refs for pixel queries
		const pixelStringRef = useRef<string>("");
		const pixelPartialRef = useRef<string>("");

		// Load databases
		useEffect(() => {
			if (getDatabases.status !== "SUCCESS") {
				return;
			}
			setUserDatabases(
				getDatabases.data as {
					database_id: string;
					app_name: string;
				}[],
			);
		}, [getDatabases.status, getDatabases.data]);

		// Load database schema when database is selected
		// biome-ignore lint/correctness/useExhaustiveDependencies: retrieveDatabaseTablesAndEdges is stable
		useEffect(() => {
			if (selectedDatabaseId) {
				retrieveDatabaseTablesAndEdges(selectedDatabaseId);
			}
		}, [selectedDatabaseId]);

		// Pre-populate form in edit mode
		// biome-ignore lint/correctness/useExhaustiveDependencies: prepopulateFormForEdit is stable
		useEffect(() => {
			if (editMode && cell && selectedDatabaseId) {
				prepopulateFormForEdit();
			}
		}, [editMode, cell, selectedDatabaseId]);
		// Update pixel ref when selected columns or joins change
		// biome-ignore lint/correctness/useExhaustiveDependencies: updatePixelRef is stable
		useEffect(() => {
			if (Object.keys(selectedColumns).length > 0) {
				updatePixelRef();
			}
		}, [selectedColumns, joins]);

		// Update joins when columns change (but not in edit mode during initial load)
		// biome-ignore lint/correctness/useExhaustiveDependencies: updateAvailableJoins is stable
		useEffect(() => {
			if (Object.keys(selectedColumns).length > 0 && !editMode) {
				updateAvailableJoins();
			}
		}, [selectedColumns]);

		const prepopulateFormForEdit = () => {
			if (!cell) {
				return;
			}

			// Build selected columns from cell parameters
			const newSelectedColumns: { [tableName: string]: Column[] } = {};
			const columnAliasMap: { [key: string]: string } = {};

			// Map aliases to columns
			cell.parameters.selectedColumns?.forEach(
				(selectedColumnTableCombinedString: string, idx: number) => {
					const alias =
						cell.parameters.columnAliases?.[idx] ||
						selectedColumnTableCombinedString.split("__")[1];
					columnAliasMap[selectedColumnTableCombinedString] = alias;
				},
			);

			// Build selectedColumns structure
			cell.parameters.selectedColumns?.forEach(
				(selectedColumnTableCombinedString: string) => {
					const [tableName, columnName] =
						selectedColumnTableCombinedString.split("__");
					const alias =
						columnAliasMap[selectedColumnTableCombinedString];

					if (!newSelectedColumns[tableName]) {
						newSelectedColumns[tableName] = [];
					}

					// Get column type from tableEdges or default to STRING
					const columnType = "STRING";
					// You would need to get this from the database schema
					// For now, we'll use a default

					newSelectedColumns[tableName].push({
						columnName,
						columnType,
						alias,
					});
				},
			);

			setSelectedColumns(newSelectedColumns);
			setSelectedTableName(cell.parameters.rootTable);
			setJoins(cell.parameters.joins || []);
		};

		const retrieveDatabaseTablesAndEdges = async (databaseId: string) => {
			setIsDatabaseLoading(true);
			const pixelString = `META|GetDatabaseTableStructure(database=[ "${databaseId}" ]);META|GetDatabaseMetamodel( database=[ "${databaseId}" ], options=["dataTypes","positions"]);`;

			try {
				const pixelResponse = await runPixel(pixelString);

				if (
					pixelResponse.pixelReturn[0]?.operationType.indexOf(
						"ERROR",
					) !== -1
				) {
					console.error("Error loading table structure");
					toast.error("Error loading database structure");
					setIsDatabaseLoading(false);
					return;
				}

				const responseTableEdgesStructure = pixelResponse.pixelReturn[1]
					?.output as
					| {
							edges?: Record<
								string,
								{
									source: string;
									target: string;
									fromAttribute: string;
									toAttribute: string;
								}
							>;
					  }
					| undefined;

				if (
					!responseTableEdgesStructure ||
					pixelResponse.pixelReturn[1]?.operationType.indexOf(
						"ERROR",
					) !== -1
				) {
					console.error("Error loading table edges");
				}

				// Process table edges
				const newTableEdges: {
					[tableName: string]: {
						[relatedTable: string]: {
							leftKey: string;
							rightKey: string;
						};
					};
				} = {};

				if (responseTableEdgesStructure?.edges) {
					const { edges } = responseTableEdgesStructure;
					Object.keys(edges).forEach((edgeKey) => {
						const edge = edges[edgeKey];
						const fromTable = edge.source;
						const toTable = edge.target;
						const fromColumn = edge.fromAttribute;
						const toColumn = edge.toAttribute;

						if (!newTableEdges[fromTable]) {
							newTableEdges[fromTable] = {};
						}
						if (!newTableEdges[toTable]) {
							newTableEdges[toTable] = {};
						}

						newTableEdges[fromTable][toTable] = {
							leftKey: fromColumn,
							rightKey: toColumn,
						};
						newTableEdges[toTable][fromTable] = {
							leftKey: toColumn,
							rightKey: fromColumn,
						};
					});
				}

				setTableEdges(newTableEdges);
				setIsDatabaseLoading(false);
			} catch (error) {
				console.error("Error loading database:", error);
				toast.error("Error loading database structure");
				setIsDatabaseLoading(false);
			}
		};

		const updateAvailableJoins = () => {
			if (!selectedTableName || Object.keys(selectedColumns).length < 2) {
				// Clear joins if we don't have multiple tables selected
				if (Object.keys(selectedColumns).length < 2) {
					setJoins([]);
				}
				return;
			}

			// Get all selected table names
			const selectedTableNames = Object.keys(selectedColumns);

			// Build joins automatically based on table edges
			const newJoins: JoinElement[] = [];
			const processedPairs = new Set<string>();

			selectedTableNames.forEach((leftTable) => {
				if (!tableEdges[leftTable]) return;

				selectedTableNames.forEach((rightTable) => {
					if (leftTable === rightTable) return;

					const pairKey = [leftTable, rightTable].sort().join("__");
					if (processedPairs.has(pairKey)) return;

					if (tableEdges[leftTable][rightTable]) {
						const edge = tableEdges[leftTable][rightTable];
						newJoins.push({
							leftTable,
							rightTable,
							joinType: "inner",
							leftKey: edge.leftKey,
							rightKey: edge.rightKey,
						});
						processedPairs.add(pairKey);
					}
				});
			});

			// Keep existing join types where possible
			const updatedJoins = newJoins.map((newJoin) => {
				const existingJoin = joins.find(
					(j) =>
						j.leftTable === newJoin.leftTable &&
						j.rightTable === newJoin.rightTable,
				);
				return existingJoin
					? { ...newJoin, joinType: existingJoin.joinType }
					: newJoin;
			});

			setJoins(updatedJoins);
		};

		const updatePixelRef = () => {
			if (Object.keys(selectedColumns).length === 0) return;

			const selectedTableNames = Object.keys(selectedColumns);
			const columnsList: string[] = [];
			const aliasesList: string[] = [];

			selectedTableNames.forEach((tableName) => {
				selectedColumns[tableName].forEach((col) => {
					columnsList.push(`${tableName}__${col.columnName}`);
					aliasesList.push(col.alias);
				});
			});

			// Build pixel query
			let pixelQuery = `Database(database=["${selectedDatabaseId}"])|Select(`;

			// Add columns (unquoted)
			pixelQuery += columnsList.join(", ");
			pixelQuery += ")";

			// Chain aliases to Select
			if (aliasesList.length > 0) {
				pixelQuery += `.as([${aliasesList.join(", ")}])`;
			}

			// Add joins
			if (joins.length > 0) {
				joins.forEach((join) => {
					pixelQuery += `|Join(join=["${join.leftTable}__${join.leftKey}"], comparator=["=="], to=["${join.rightTable}__${join.rightKey}"], joinType=["${join.joinType}"])`;
				});
			}

			// Add Distinct but NO Limit - that's added by preview or cell config
			pixelQuery += "|Distinct(false)";

			// Store without trailing semicolon or limit
			pixelPartialRef.current = `${pixelQuery}`;
		};

		const handleAddColumn = (
			tableName: string,
			columnName: string,
			columnType: string,
		) => {
			setSelectedColumns((prev) => {
				const updated = { ...prev };
				if (!updated[tableName]) {
					updated[tableName] = [];
				}

				// Check if column already exists
				const exists = updated[tableName].some(
					(col) => col.columnName === columnName,
				);
				if (exists) return prev;

				updated[tableName].push({
					columnName,
					columnType,
					alias: columnName, // Default alias to column name
				});

				return updated;
			});

			// Set root table if not set
			if (!selectedTableName) {
				setSelectedTableName(tableName);
			}
		};

		const handleAddAllColumns = (
			tableName: string,
			columns: { columnName: string; columnType: string }[],
		) => {
			setSelectedColumns((prev) => {
				const updated = { ...prev };
				updated[tableName] = columns.map((col) => ({
					columnName: col.columnName,
					columnType: col.columnType,
					alias: col.columnName,
				}));
				return updated;
			});

			// Set root table if not set
			if (!selectedTableName) {
				setSelectedTableName(tableName);
			}
		};

		const handleRemoveColumn = (tableName: string, columnName: string) => {
			setSelectedColumns((prev) => {
				const updated = { ...prev };
				if (updated[tableName]) {
					updated[tableName] = updated[tableName].filter(
						(col) => col.columnName !== columnName,
					);
					if (updated[tableName].length === 0) {
						delete updated[tableName];
					}
				}
				return updated;
			});
		};

		const handleAliasChange = (
			tableName: string,
			columnName: string,
			newAlias: string,
		) => {
			setSelectedColumns((prev) => {
				const updated = { ...prev };
				if (updated[tableName]) {
					const col = updated[tableName].find(
						(c) => c.columnName === columnName,
					);
					if (col) {
						col.alias = newAlias;
					}
				}
				return { ...updated };
			});
		};

		const handleClearTable = (tableName: string) => {
			setSelectedColumns((prev) => {
				const updated = { ...prev };
				delete updated[tableName];
				return updated;
			});
		};

		const retrievePreviewData = async () => {
			if (!pixelPartialRef.current) {
				updatePixelRef();
			}

			setIsDatabaseLoading(true);

			try {
				const previewPixel = `${pixelPartialRef.current}|Limit(50)|Import(frame=[CreateFrame(frameType=[NATIVE], override=[true]).as(["data_import_preview_frame"])]); META|Frame()|QueryAll()|Limit(50)|Collect(500);`;
				pixelStringRef.current = previewPixel;

				const response = await runPixel(previewPixel);

				const type = response.pixelReturn[0]?.operationType;
				if (type?.indexOf("ERROR") !== -1) {
					const error = response.pixelReturn[0]?.output;
					console.error(`${error}`);
					toast.error(`${error}`, { position: "top-right" });
					setIsDatabaseLoading(false);
					return;
				}

				const output = response.pixelReturn[1]?.output as {
					data: {
						values: unknown[][];
						headers: string[];
					};
				};

				setDatabaseTableHeaders(output.data?.headers || []);
				setDatabaseTableRows(output.data?.values || []);
				setIsDatabaseLoading(false);
			} catch (error) {
				console.error("Error in preview:", error);
				toast.error("Error running query preview", {
					position: "top-right",
				});
				setIsDatabaseLoading(false);
			}
		};

		const onImportDataSubmit = () => {
			if (
				!query ||
				!selectedTableName ||
				Object.keys(selectedColumns).length === 0
			)
				return;

			const selectedTableNames = Object.keys(selectedColumns);
			const columnsList: string[] = [];
			const aliasesList: string[] = [];

			selectedTableNames.forEach((tableName) => {
				selectedColumns[tableName].forEach((col) => {
					columnsList.push(`${tableName}__${col.columnName}`);
					aliasesList.push(col.alias);
				});
			});

			if (editMode && cell) {
				// Update existing cell
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: query.id,
						cellId: cell.id,
						path: "parameters.databaseId",
						value: selectedDatabaseId,
					},
				});

				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: query.id,
						cellId: cell.id,
						path: "parameters.tableNames",
						value: selectedTableNames,
					},
				});

				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: query.id,
						cellId: cell.id,
						path: "parameters.selectedColumns",
						value: columnsList,
					},
				});

				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: query.id,
						cellId: cell.id,
						path: "parameters.columnAliases",
						value: aliasesList,
					},
				});

				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: query.id,
						cellId: cell.id,
						path: "parameters.joins",
						value: joins,
					},
				});

				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: query.id,
						cellId: cell.id,
						path: "parameters.rootTable",
						value: selectedTableName,
					},
				});

				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: query.id,
						cellId: cell.id,
						path: "parameters.selectQuery",
						value: pixelPartialRef.current,
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
								{
									// biome-ignore lint/suspicious/noExplicitAny: DefaultCells has dynamic parameters
									parameters: any;
								}
							>
						)[DataImportCellConfig.widget]?.parameters || {};

					const config: NewCellAction["payload"]["config"] = {
						widget: DataImportCellConfig.widget,
						parameters: {
							...defaultParams,
							databaseId: selectedDatabaseId,
							tableNames: selectedTableNames,
							selectedColumns: columnsList,
							columnAliases: aliasesList,
							joins: joins,
							rootTable: selectedTableName,
							selectQuery: pixelPartialRef.current,
							dataLimit: -1,
						},
					};

					state
						.dispatch({
							message: ActionMessages.NEW_CELL,
							payload: {
								queryId: query.id,
								previousCellId: previousCellId ?? "",
								config: config as Omit<CellStateConfig, "id">,
							},
						})
						.then((newCellId: unknown) => {
							if (typeof newCellId !== "string") return;

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
						});
				} catch (e) {
					console.error(e);
				}
			}

			setIsDataImportModalOpen?.(false);
		};

		const closeImportModalHandler = () => {
			setIsDataImportModalOpen?.(false);
		};

		// Check for duplicate aliases
		const hasDuplicateAliases = () => {
			const aliases: string[] = [];
			Object.values(selectedColumns).forEach((cols) => {
				cols.forEach((col) => {
					aliases.push(col.alias);
				});
			});
			return (
				new Set(aliases).size !== aliases.length ||
				aliases.some((a) => !a || a.trim() === "")
			);
		};

		const totalSelectedColumns = Object.values(selectedColumns).reduce(
			(sum, cols) => sum + cols.length,
			0,
		);

		return (
			<Dialog
				open={true}
				onOpenChange={(open) => {
					if (!open) closeImportModalHandler();
				}}
			>
				<DialogContent
					style={{ maxWidth: "70vw", width: "70vw" }}
					className="flex max-h-[90vh] flex-col overflow-hidden"
				>
					<DialogHeader className="px-6 pt-6">
						<div className="flex items-center gap-4">
							<DialogTitle>Import Data From</DialogTitle>
							<Select
								disabled={editMode}
								value={selectedDatabaseId || ""}
								onValueChange={(value) => {
									setSelectedDatabaseId(value);
									setSelectedColumns({});
									setJoins([]);
									setSelectedTableName(null);
									setShowPreview(false);
								}}
							>
								<SelectTrigger className="w-[220px]">
									<SelectValue placeholder="Select Database" />
								</SelectTrigger>
								<SelectContent>
									{userDatabases?.map((db, idx) => (
										<SelectItem
											key={`${idx}-${db.database_id}`}
											value={db.database_id}
										>
											{db.app_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</DialogHeader>

					{!selectedDatabaseId && (
						<div className="p-4 text-center">
							<p className="text-muted-foreground text-sm">
								Select a Database for Import
							</p>
						</div>
					)}

					{isDatabaseLoading && (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="size-8 animate-spin text-primary" />
						</div>
					)}

					{selectedDatabaseId && !isDatabaseLoading && (
						<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-6">
							{/* Accordions section with dynamic height */}
							<div
								className="flex flex-col overflow-hidden transition-[height] duration-300"
								style={{
									height: showPreview ? "30vh" : "100%",
								}}
							>
								<div className="flex flex-1 flex-row gap-2 overflow-hidden">
									{/* Available Tables - 50% */}
									<div className="flex w-1/2 flex-col gap-1 overflow-y-auto border-border border-r pr-2">
										<h3 className="font-semibold text-sm">
											Available Tables
										</h3>
										<DatabaseAccordions
											databaseId={selectedDatabaseId}
											mode="data-available"
											selectedTableName={
												selectedTableName
											}
											onAddColumn={handleAddColumn}
											onAddAllColumns={
												handleAddAllColumns
											}
										/>
									</div>

									{/* Selected Columns - 50% */}
									<div className="flex w-1/2 flex-col gap-1 overflow-y-auto">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold text-sm">
												Selected Columns (
												{totalSelectedColumns})
											</h3>
										</div>
										{totalSelectedColumns > 0 ? (
											<DatabaseAccordions
												databaseId={selectedDatabaseId}
												mode="data-selected"
												selectedColumns={
													selectedColumns
												}
												onRemoveColumn={
													handleRemoveColumn
												}
												onAliasChange={
													handleAliasChange
												}
												onClearTable={handleClearTable}
											/>
										) : (
											<div className="py-8 text-center text-muted-foreground text-sm">
												No columns selected. Add columns
												from available tables.
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Joins Section */}
							{joins.length > 0 && (
								<div className="border-t pt-2">
									<h3 className="mb-2 font-semibold text-sm">
										Joins ({joins.length})
									</h3>
									<div className="flex flex-col gap-2">
										{joins.map((join, joinIndex) => (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: joins are stable during render
												key={`join-${joinIndex}`}
												className="flex items-center gap-2 rounded-md bg-muted/30 p-2"
											>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="cursor-default rounded-xl bg-primary/10 px-3 py-1 text-xs">
															{join.leftTable}
														</div>
													</TooltipTrigger>
													<TooltipContent>
														Left Table
													</TooltipContent>
												</Tooltip>

												<DropdownMenu
													open={
														isJoinSelectOpen &&
														joinTypeSelectIndex ===
															joinIndex
													}
													onOpenChange={(open) => {
														if (!open) {
															setIsJoinSelectOpen(
																false,
															);
															setJoinTypeSelectIndex(
																-1,
															);
														}
													}}
												>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => {
																setJoinTypeSelectIndex(
																	joinIndex,
																);
																setIsJoinSelectOpen(
																	true,
																);
															}}
														>
															{
																JOIN_ICONS[
																	join.joinType as keyof typeof JOIN_ICONS
																]
															}
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent>
														<DropdownMenuItem
															onClick={() => {
																setIsJoinSelectOpen(
																	false,
																);
																setJoins(
																	(prev) => {
																		const updated =
																			[
																				...prev,
																			];
																		updated[
																			joinIndex
																		].joinType =
																			"inner";
																		return updated;
																	},
																);
															}}
														>
															Inner Join
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																setIsJoinSelectOpen(
																	false,
																);
																setJoins(
																	(prev) => {
																		const updated =
																			[
																				...prev,
																			];
																		updated[
																			joinIndex
																		].joinType =
																			"left.outer";
																		return updated;
																	},
																);
															}}
														>
															Left Join
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																setIsJoinSelectOpen(
																	false,
																);
																setJoins(
																	(prev) => {
																		const updated =
																			[
																				...prev,
																			];
																		updated[
																			joinIndex
																		].joinType =
																			"right.outer";
																		return updated;
																	},
																);
															}}
														>
															Right Join
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																setIsJoinSelectOpen(
																	false,
																);
																setJoins(
																	(prev) => {
																		const updated =
																			[
																				...prev,
																			];
																		updated[
																			joinIndex
																		].joinType =
																			"outer";
																		return updated;
																	},
																);
															}}
														>
															Outer Join
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>

												<Tooltip>
													<TooltipTrigger asChild>
														<div className="cursor-default rounded-xl bg-[#DEF4F3] px-3 py-1 text-xs">
															{join.rightTable}
														</div>
													</TooltipTrigger>
													<TooltipContent>
														Right Table
													</TooltipContent>
												</Tooltip>

												<span className="text-muted-foreground text-xs">
													ON
												</span>

												<Tooltip>
													<TooltipTrigger asChild>
														<div className="cursor-default rounded-xl bg-primary/10 px-3 py-1 text-xs">
															{join.leftKey}
														</div>
													</TooltipTrigger>
													<TooltipContent>
														Left Key
													</TooltipContent>
												</Tooltip>

												<span className="text-muted-foreground text-xs">
													=
												</span>

												<Tooltip>
													<TooltipTrigger asChild>
														<div className="cursor-default rounded-xl bg-[#DEF4F3] px-3 py-1 text-xs">
															{join.rightKey}
														</div>
													</TooltipTrigger>
													<TooltipContent>
														Right Key
													</TooltipContent>
												</Tooltip>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Preview Panel */}
							{showPreview && (
								<div
									className="flex flex-col overflow-hidden"
									style={{ height: "30vh" }}
								>
									<div
										className="flex h-full flex-col bg-white"
										style={{ marginBottom: "20px" }}
									>
										<h3 className="mt-4 mb-5 ml-4 font-semibold text-lg">
											Preview
										</h3>
										<p className="mx-4 mb-3 border-b pb-3 text-muted-foreground text-sm">
											The preview uses a subset of your
											data and may not be accurately
											represented below.
										</p>
										{isDatabaseLoading ? (
											<div className="flex min-h-[200px] items-center justify-center">
												<Loader2 className="size-8 animate-spin text-primary" />
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
													<TableHeader>
														<TableRow>
															{databaseTableHeaders.map(
																(h, hIdx) => (
																	<TableHead
																		// biome-ignore lint/suspicious/noArrayIndexKey: headers are stable
																		key={`header-${hIdx}`}
																	>
																		{h}
																	</TableHead>
																),
															)}
														</TableRow>
													</TableHeader>
													<TableBody>
														{databaseTableRows.map(
															(r, rIdx) => (
																<TableRow
																	// biome-ignore lint/suspicious/noArrayIndexKey: rows are stable during render
																	key={`row-${rIdx}`}
																>
																	{(
																		r as unknown[]
																	).map(
																		(
																			v,
																			vIdx,
																		) => (
																			<TableCell
																				// biome-ignore lint/suspicious/noArrayIndexKey: cells are stable during render
																				key={`cell-${rIdx}-${vIdx}`}
																			>
																				{typeof v ===
																					"object" &&
																				v !==
																					null
																					? JSON.stringify(
																							v,
																						)
																					: String(
																							v ??
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

					<DialogFooter className="border-t p-4">
						<Button
							variant="outline"
							onClick={closeImportModalHandler}
						>
							Cancel
						</Button>
						{selectedDatabaseId && !isDatabaseLoading && (
							<Button
								variant="outline"
								onClick={() => {
									if (showPreview) {
										setShowPreview(false);
									} else {
										setShowPreview(true);
										retrievePreviewData();
									}
								}}
								disabled={totalSelectedColumns === 0}
							>
								{showPreview ? "Hide Preview" : "Show Preview"}
							</Button>
						)}
						<Button
							onClick={onImportDataSubmit}
							disabled={
								totalSelectedColumns === 0 ||
								hasDuplicateAliases()
							}
						>
							{editMode ? "Update Cell" : "Import"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
