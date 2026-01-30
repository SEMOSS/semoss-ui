import {
	AccessTime,
	Add,
	Check,
	DateRange,
	Delete,
	Edit,
	ExpandMore,
	FontDownload,
	Numbers,
	TableChartOutlined,
} from "@mui/icons-material";
import { AccordionDetails, AccordionSummary, Tooltip } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Accordion,
	Box,
	Button,
	IconButton,
	LinearProgress,
	List,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";

const StyledScrollableContainer = styled(Box)(({ theme }) => ({
	maxHeight: "500px",
	overflowY: "auto",
	overflowX: "hidden",
	paddingRight: theme.spacing(3),
	paddingBottom: theme.spacing(1),
}));

const StyledAccordionSummary = styled(AccordionSummary)(() => ({
	backgroundColor: "#E3F2FD",
}));

const StyledTableName = styled(Typography)<{ $mode?: string }>(({ $mode }) => ({
	fontWeight: "bold",
	marginLeft: "8px",
	...($mode === "query" || $mode === "data-available"
		? {
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap",
				maxWidth: "175px",
			}
		: {}),
}));

const StyledColumnRow = styled(List.Item)(({ theme }) => ({
	paddingLeft: theme.spacing(0),
	paddingTop: theme.spacing(0),
	paddingBottom: theme.spacing(0),
}));

const StyledColumnName = styled(Typography)(() => ({
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
}));

const StyledColumnIcon = styled(Box)(() => ({
	color: "#1976D2",
	display: "flex",
	alignItems: "center",
	minWidth: "40px",
}));

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
			return <Numbers />;
		}

		if (
			upperType.includes("STRING") ||
			upperType.includes("TEXT") ||
			upperType.includes("VARCHAR") ||
			upperType.includes("CHAR")
		) {
			return <FontDownload />;
		}

		if (upperType.includes("DATETIME") || upperType.includes("TIMESTAMP")) {
			return <AccessTime />;
		}

		if (upperType.includes("DATE")) {
			return <DateRange />;
		}

		if (upperType.includes("TIME")) {
			return <AccessTime />;
		}

		return <FontDownload />;
	};

	// Build tables from selectedColumns in 'data-selected' mode
	useMemo(() => {
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
	useMemo(() => {
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

	const handleAccordionChange = (tableName: string) => {
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
		return <LinearProgress variant="indeterminate" />;
	}

	return (
		<Box>
			<Stack
				direction="row"
				spacing={1}
				sx={{ mb: 2, justifyContent: "space-between" }}
			>
				{(mode === "data-available" || mode === "query") && (
					<TextField
						size="small"
						placeholder="Search schema..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						disabled={isLoading || selectedTableName !== null}
					/>
				)}

				{mode === "data-selected" ? (
					<Button
						size="small"
						variant="text"
						onClick={handleClearAll}
						disabled={Object.keys(selectedColumns).length === 0}
					>
						Clear All
					</Button>
				) : (
					<Button
						size="small"
						variant="text"
						onClick={handleToggleAll}
						disabled={filteredTables.length === 0 || isLoading}
					>
						{hasExpandedAccordions ? "Collapse All" : "Expand All"}
					</Button>
				)}
			</Stack>
			{isLoading && <LinearProgress variant="indeterminate" />}
			{!isLoading && (
				<StyledScrollableContainer>
					{filteredTables.length === 0 ? (
						<Typography
							variant="body2"
							color="textSecondary"
							sx={{ textAlign: "center", py: 4 }}
						>
							{mode === "data-selected"
								? "No columns selected"
								: "No tables or columns match your search"}
						</Typography>
					) : (
						filteredTables.map((tableName) => (
							<Accordion
								key={tableName}
								expanded={expandedAccordions.has(tableName)}
								onChange={() =>
									handleAccordionChange(tableName)
								}
								sx={{ mb: 1 }}
							>
								<StyledAccordionSummary
									expandIcon={<ExpandMore />}
								>
									<Stack
										direction="row"
										alignItems="center"
										sx={{
											width: "100%",
											justifyContent: "space-between",
										}}
									>
										<Stack
											direction="row"
											alignItems="center"
										>
											<TableChartOutlined
												sx={{ color: "#1976D2" }}
											/>
											{mode === "query" ||
											mode === "data-available" ? (
												<Tooltip
													title={
														tableName.length > 20
															? tableName
															: ""
													}
													placement="top"
												>
													<span>
														<StyledTableName
															variant="body1"
															$mode={mode}
														>
															{tableName}
														</StyledTableName>
													</span>
												</Tooltip>
											) : (
												<StyledTableName
													variant="body1"
													$mode={mode}
												>
													{tableName}
												</StyledTableName>
											)}
										</Stack>
										{mode === "data-available" && (
											<Button
												size="small"
												variant="text"
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
									</Stack>
								</StyledAccordionSummary>
								<AccordionDetails
									sx={{ border: "2px solid #E3F2FD" }}
								>
									<List dense>
										{mode === "data-selected"
											? selectedColumns[tableName]?.map(
													(column, index) => {
														const rowKey = `${tableName}__${column.columnName}`;
														const isEditing =
															editingRows.has(
																rowKey,
															);
														return (
															<StyledColumnRow
																key={`${column.columnName}-${index}`}
															>
																<Stack
																	direction="row"
																	spacing={0}
																	justifyContent="space-between"
																	sx={{
																		width: "100%",
																	}}
																>
																	<Stack
																		direction="row"
																		alignItems="center"
																	>
																		<StyledColumnIcon>
																			{getIconForDataType(
																				column.columnType,
																			)}
																		</StyledColumnIcon>
																		{isEditing ? (
																			<TextField
																				size="small"
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
																				sx={{
																					mx: 1,
																					minWidth:
																						"150px",
																				}}
																				autoFocus
																			/>
																		) : (
																			<List.ItemText
																				primary={
																					<StyledColumnName variant="body2">
																						{
																							column.alias
																						}
																					</StyledColumnName>
																				}
																			/>
																		)}
																	</Stack>
																	<Stack
																		direction="row"
																		spacing={
																			0
																		}
																		justifyContent="space-between"
																		alignItems="center"
																	>
																		{isEditing ? (
																			<IconButton
																				size="small"
																				onClick={() =>
																					handleSaveClick(
																						tableName,
																						column.columnName,
																					)
																				}
																			>
																				<Check />
																			</IconButton>
																		) : (
																			<IconButton
																				size="small"
																				onClick={() =>
																					handleEditClick(
																						tableName,
																						column.columnName,
																						column.alias,
																					)
																				}
																			>
																				<Edit />
																			</IconButton>
																		)}
																		<IconButton
																			size="small"
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
																			<Delete />
																		</IconButton>
																	</Stack>
																</Stack>
															</StyledColumnRow>
														);
													},
												)
											: tables[tableName].columnNames.map(
													(columnName, index) => {
														const dataType =
															tables[tableName]
																.columnTypes[
																`${tableName}__${columnName}`
															];
														return (
															<StyledColumnRow
																key={`${index}-${columnName}`}
															>
																<StyledColumnIcon>
																	{getIconForDataType(
																		dataType,
																	)}
																</StyledColumnIcon>
																<List.ItemText
																	primary={
																		<StyledColumnName variant="body2">
																			{
																				columnName
																			}
																		</StyledColumnName>
																	}
																/>
																{mode ===
																	"data-available" && (
																	<IconButton
																		size="small"
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
																		<Add />
																	</IconButton>
																)}
															</StyledColumnRow>
														);
													},
												)}
									</List>
								</AccordionDetails>
							</Accordion>
						))
					)}
				</StyledScrollableContainer>
			)}
		</Box>
	);
};
