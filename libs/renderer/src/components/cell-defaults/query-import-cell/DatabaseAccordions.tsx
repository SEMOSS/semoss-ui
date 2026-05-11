import {
	Calendar,
	Check,
	Clock,
	Hash,
	Pencil,
	Plus,
	Table,
	Trash2,
	Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	cn,
	Input,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface Column {
	columnName: string;
	columnType: string;
	alias: string;
}

interface DatabaseAccordionsProps {
	databaseId: string;
	mode?: "query" | "data-available" | "data-selected";
	selectedColumns?: { [tableName: string]: Column[] };
	selectedTableName?: string | null;
	onAddColumn?: (
		tableName: string,
		columnName: string,
		columnType: string,
	) => void;
	onAddAllColumns?: (
		tableName: string,
		columns: { columnName: string; columnType: string }[],
	) => void;
	onRemoveColumn?: (tableName: string, columnName: string) => void;
	onAliasChange?: (
		tableName: string,
		columnName: string,
		alias: string,
	) => void;
	onClearTable?: (tableName: string) => void;
}

export const DatabaseAccordions = (props: DatabaseAccordionsProps) => {
	const {
		databaseId,
		mode = "query",
		selectedColumns = {},
		selectedTableName = null,
		onAddColumn,
		onAddAllColumns,
		onRemoveColumn,
		onAliasChange,
		onClearTable,
	} = props;

	const [tables, setTables] = useState<
		Record<
			string,
			{ columnNames: string[]; columnTypes: Record<string, string> }
		>
	>({});
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
		new Set(),
	);
	const [hasExpandedAccordions, setHasExpandedAccordions] =
		useState<boolean>(false);
	const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
	const [editingValues, setEditingValues] = useState<{
		[key: string]: string;
	}>({});

	// Only fetch data if not in 'data-selected' mode
	const databaseMetamodel = usePixel<{
		dataTypes: Record<
			string,
			"INT" | "DOUBLE" | "STRING" | "DATE" | "DATETIME" | "TIME"
		>;
		nodes: { propSet: string[]; conceptualName: string }[];
	}>(
		(mode !== "data-selected"
			? `GetDatabaseMetamodel( database=["${databaseId}"], options=["dataTypes"]); `
			: null) as string,
	);

	const getIconForDataType = (dataType: string) => {
		const upperType = dataType?.toUpperCase() || "";

		if (
			upperType.includes("INT") ||
			upperType.includes("DOUBLE") ||
			upperType.includes("DECIMAL") ||
			upperType.includes("NUMBER") ||
			upperType.includes("FLOAT") ||
			upperType.includes("NUMERIC")
		) {
			return <Hash className="size-4" />;
		}

		if (
			upperType.includes("STRING") ||
			upperType.includes("TEXT") ||
			upperType.includes("VARCHAR") ||
			upperType.includes("CHAR")
		) {
			return <Type className="size-4" />;
		}

		if (upperType.includes("DATETIME") || upperType.includes("TIMESTAMP")) {
			return <Clock className="size-4" />;
		}

		if (upperType.includes("DATE")) {
			return <Calendar className="size-4" />;
		}

		if (upperType.includes("TIME")) {
			return <Clock className="size-4" />;
		}

		return <Type className="size-4" />;
	};

	// Build tables from selectedColumns in 'data-selected' mode
	useEffect(() => {
		if (mode === "data-selected") {
			const retrievedTables: Record<
				string,
				{
					columnNames: string[];
					columnTypes: Record<string, string>;
				}
			> = {};

			Object.keys(selectedColumns).forEach((tableName) => {
				const columns = selectedColumns[tableName] || [];
				const columnNames = columns.map((col) => col.columnName);
				const columnTypes = columns.reduce<Record<string, string>>(
					(acc, col) => {
						acc[`${tableName}__${col.columnName}`] = col.columnType;
						return acc;
					},
					{},
				);

				retrievedTables[tableName] = {
					columnNames,
					columnTypes,
				};
			});
			setTables(retrievedTables);
			setIsLoading(false);
			setExpandedAccordions(new Set(Object.keys(retrievedTables)));
			return;
		}
	}, [mode, selectedColumns]);

	// If databaseMetamodel changes, set loading to true
	// Then update tables & column and set all accordions to expanded
	useEffect(() => {
		if (mode === "data-selected") return;

		if (databaseMetamodel.status !== "SUCCESS") {
			setIsLoading(true);
			return;
		}
		const { nodes = [], dataTypes = {} } = databaseMetamodel.data;
		const retrievedTables: Record<
			string,
			{
				columnNames: string[];
				columnTypes: Record<string, string>;
			}
		> = {};

		nodes.forEach((n) => {
			const tableName = n.conceptualName;
			const filteredDataTypes = Object.keys(dataTypes).filter((colName) =>
				colName.includes(`${tableName}__`),
			);
			retrievedTables[n.conceptualName] = {
				columnNames: [...n.propSet],
				columnTypes: filteredDataTypes.reduce<Record<string, string>>(
					(acc, colName) => {
						acc[colName] = dataTypes[colName];
						return acc;
					},
					{},
				),
			};
		});
		setTables(retrievedTables);
		setIsLoading(false);
		// Set all accordions to expanded by default
		setExpandedAccordions(new Set(Object.keys(retrievedTables)));
	}, [databaseMetamodel.status, databaseMetamodel.data, mode]);

	// Filter tables based on search query (column names and table names) and selectedTableName
	const filteredTables = useMemo(() => {
		let tablesToFilter = Object.keys(tables);

		// If in data-available mode and a table is selected, only show that table
		if (mode === "data-available" && selectedTableName) {
			tablesToFilter = tablesToFilter.filter(
				(tableName) => tableName === selectedTableName,
			);
		}

		// Apply search query filter
		if (!searchQuery.trim()) {
			return tablesToFilter;
		}

		return tablesToFilter.filter((tableName) => {
			const tableMatches = tableName
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const columnMatches = tables[tableName].columnNames.some(
				(colName) =>
					colName.toLowerCase().includes(searchQuery.toLowerCase()),
			);
			return tableMatches || columnMatches;
		});
	}, [tables, searchQuery, mode, selectedTableName]);

	// Update hasExpandedAccordions state when expandedAccordions changes
	useEffect(() => {
		setHasExpandedAccordions(expandedAccordions.size > 0);
	}, [expandedAccordions]);

	const handleToggleAll = () => {
		if (hasExpandedAccordions) {
			setExpandedAccordions(new Set());
		} else {
			setExpandedAccordions(new Set(Object.keys(tables)));
		}
	};

	const handleClearAll = () => {
		Object.keys(selectedColumns).forEach((tableName) => {
			if (onClearTable) {
				onClearTable(tableName);
			}
		});
	};

	const _handleAccordionChange = (tableName: string) => {
		setExpandedAccordions((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(tableName)) {
				newSet.delete(tableName);
			} else {
				newSet.add(tableName);
			}
			return newSet;
		});
	};

	const handleAddAllColumns = (tableName: string) => {
		if (!onAddAllColumns) return;

		const columns = tables[tableName].columnNames.map((columnName) => {
			const dataType =
				tables[tableName].columnTypes[`${tableName}__${columnName}`];
			return {
				columnName,
				columnType: dataType,
			};
		});
		onAddAllColumns(tableName, columns);
	};

	const handleEditClick = (
		tableName: string,
		columnName: string,
		currentAlias: string,
	) => {
		const key = `${tableName}__${columnName}`;
		setEditingRows((prev) => new Set(prev).add(key));
		setEditingValues((prev) => ({ ...prev, [key]: currentAlias }));
	};

	const handleSaveClick = (tableName: string, columnName: string) => {
		const key = `${tableName}__${columnName}`;
		const newAlias = editingValues[key];
		if (onAliasChange && newAlias !== undefined) {
			onAliasChange(tableName, columnName, newAlias);
		}
		setEditingRows((prev) => {
			const newSet = new Set(prev);
			newSet.delete(key);
			return newSet;
		});
	};

	const handleEditingValueChange = (key: string, value: string) => {
		setEditingValues((prev) => ({ ...prev, [key]: value }));
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-4">
				<Spinner className="size-6" />
			</div>
		);
	}

	return (
		<div>
			<div className="mb-4 flex flex-row items-center justify-between gap-2">
				{(mode === "data-available" || mode === "query") && (
					<Input
						placeholder="Search schema..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						disabled={isLoading || selectedTableName !== null}
						className="flex-1"
					/>
				)}

				{mode === "data-selected" ? (
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={handleClearAll}
						disabled={Object.keys(selectedColumns).length === 0}
					>
						Clear All
					</Button>
				) : (
					<Button
						size="sm"
						variant="ghost"
						onClick={handleToggleAll}
						disabled={filteredTables.length === 0 || isLoading}
					>
						{hasExpandedAccordions ? "Collapse All" : "Expand All"}
					</Button>
				)}
			</div>
			{isLoading && (
				<div className="flex items-center justify-center py-4">
					<Spinner className="size-6" />
				</div>
			)}
			{!isLoading && (
				<div className="max-h-[500px] overflow-y-auto overflow-x-hidden pr-6 pb-2">
					{filteredTables.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							{mode === "data-selected"
								? "No columns selected"
								: "No tables or columns match your search"}
						</p>
					) : (
						<Accordion
							type="multiple"
							value={Array.from(expandedAccordions)}
							onValueChange={(values) =>
								setExpandedAccordions(new Set(values))
							}
						>
							{filteredTables.map((tableName) => (
								<AccordionItem
									key={tableName}
									value={tableName}
									className="mb-2"
								>
									<AccordionTrigger className="rounded-md bg-blue-50 px-4 py-3 hover:bg-blue-100 hover:no-underline dark:bg-blue-950/30 dark:hover:bg-blue-950/50">
										<div className="flex w-full items-center justify-between pr-2">
											<div className="flex items-center gap-2">
												<Table className="size-5 text-blue-600" />
												{mode === "query" ||
												mode === "data-available" ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<span
																className={cn(
																	"ml-2 font-bold",
																	tableName.length >
																		20 &&
																		"max-w-[175px] overflow-hidden text-ellipsis whitespace-nowrap",
																)}
															>
																{tableName}
															</span>
														</TooltipTrigger>
														{tableName.length >
															20 && (
															<TooltipContent>
																{tableName}
															</TooltipContent>
														)}
													</Tooltip>
												) : (
													<span className="ml-2 font-bold">
														{tableName}
													</span>
												)}
											</div>
											{mode === "data-available" && (
												<Button
													type="button"
													size="sm"
													variant="ghost"
													onClick={(e) => {
														e.stopPropagation();
														handleAddAllColumns(
															tableName,
														);
													}}
												>
													Add All
												</Button>
											)}
										</div>
									</AccordionTrigger>
									<AccordionContent className="border-2 border-blue-50 px-0 dark:border-blue-950/30">
										<ul className="space-y-0">
											{mode === "data-selected"
												? selectedColumns[
														tableName
													]?.map((column, index) => {
														const rowKey = `${tableName}__${column.columnName}`;
														const isEditing =
															editingRows.has(
																rowKey,
															);
														return (
															<li
																key={`${column.columnName}-${index}`}
																className="flex items-center justify-between px-4 py-2"
															>
																<div className="flex items-center gap-2">
																	<div className="flex min-w-[40px] items-center text-blue-600">
																		{getIconForDataType(
																			column.columnType,
																		)}
																	</div>
																	{isEditing ? (
																		<Input
																			value={
																				editingValues[
																					rowKey
																				] ||
																				column.alias
																			}
																			onChange={(
																				e,
																			) =>
																				handleEditingValueChange(
																					rowKey,
																					e
																						.target
																						.value,
																				)
																			}
																			className="mx-2 min-w-[150px]"
																			autoFocus
																		/>
																	) : (
																		<span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
																			{
																				column.alias
																			}
																		</span>
																	)}
																</div>
																<div className="flex items-center gap-0">
																	{isEditing ? (
																		<Button
																			type="button"
																			size="icon-sm"
																			variant="ghost"
																			onClick={() =>
																				handleSaveClick(
																					tableName,
																					column.columnName,
																				)
																			}
																		>
																			<Check className="size-4" />
																		</Button>
																	) : (
																		<Button
																			type="button"
																			size="icon-sm"
																			variant="ghost"
																			onClick={() =>
																				handleEditClick(
																					tableName,
																					column.columnName,
																					column.alias,
																				)
																			}
																		>
																			<Pencil className="size-4" />
																		</Button>
																	)}
																	<Button
																		type="button"
																		size="icon-sm"
																		variant="ghost"
																		onClick={() => {
																			if (
																				onRemoveColumn
																			) {
																				onRemoveColumn(
																					tableName,
																					column.columnName,
																				);
																			}
																		}}
																	>
																		<Trash2 className="size-4" />
																	</Button>
																</div>
															</li>
														);
													})
												: tables[
														tableName
													].columnNames.map(
														(columnName, index) => {
															const dataType =
																tables[
																	tableName
																].columnTypes[
																	`${tableName}__${columnName}`
																];
															return (
																<li
																	key={`${index}-${columnName}`}
																	className="flex items-center justify-between px-4 py-2"
																>
																	<div className="flex items-center gap-2">
																		<div className="flex min-w-[40px] items-center text-blue-600">
																			{getIconForDataType(
																				dataType,
																			)}
																		</div>
																		<span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
																			{
																				columnName
																			}
																		</span>
																	</div>
																	{mode ===
																		"data-available" && (
																		<Button
																			type="button"
																			size="icon-sm"
																			variant="ghost"
																			onClick={() => {
																				if (
																					onAddColumn
																				) {
																					onAddColumn(
																						tableName,
																						columnName,
																						dataType,
																					);
																				}
																			}}
																		>
																			<Plus className="size-4" />
																		</Button>
																	)}
																</li>
															);
														},
													)}
										</ul>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					)}
				</div>
			)}
		</div>
	);
};
