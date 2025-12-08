import {
	ChevronRight,
	Clear,
	ExpandMore,
	Refresh,
	Search,
	Storage,
} from "@mui/icons-material";
import type React from "react";
import { useEffect } from "react";
import type { ColumnInterface, TableInterface } from "@semoss/sdk";
import {
	Box,
	Button,
	IconButton,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { DatabaseColumnIcon } from "@/components/database";

const StyledCard = styled("div")(({ theme }) => ({
	borderRadius: "12px",
	background: theme.palette.background.paper,
	boxShadow: `0px 4px 4px 0px rgba(0, 0, 0, 0.04)`,
	height: "100%",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
}));

const StyledCardHeader = styled("div")(({ theme }) => ({
	padding: theme.spacing(2),
	borderBottom: `1px solid ${theme.palette.divider}`,
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	flexShrink: 0,
}));

const StyledSearchSection = styled("div")(({ theme }) => ({
	padding: theme.spacing(2),
	borderBottom: `1px solid ${theme.palette.divider}`,
	flexShrink: 0,
}));

const StyledTablesList = styled("div")(() => ({
	flex: 1,
	overflow: "auto",
}));

const StyledTable = styled("table")(({ theme }) => ({
	width: "100%",
	borderCollapse: "collapse",
	"&:not(:last-child)": {
		marginBottom: theme.spacing(1),
	},
}));

const StyledTableHeaderRow = styled("tr")(({ theme }) => ({
	cursor: "pointer",
	"&:hover": {
		backgroundColor: theme.palette.grey[50],
	},
	"&.closed": {
		backgroundColor: "transparent",
	},
}));

const StyledTableHeaderCell = styled("td")(({ theme }) => ({
	padding: theme.spacing(1.5),
	borderBottom: `1px solid ${theme.palette.divider}`,
	"&.col-4": {
		width: "20%",
	},
	"&.center": {
		textAlign: "center",
	},
}));

const StyledColumnRow = styled("tr")<{ selected: boolean }>(
	({ theme, selected }) => ({
		cursor: "pointer",
		backgroundColor: selected ? theme.palette.primary.light : "transparent",
		color: "inherit",
		"&:hover": {
			backgroundColor: selected
				? theme.palette.primary.light
				: theme.palette.grey[50],
		},
	}),
);

const StyledTableCell = styled("td")(({ theme }) => ({
	padding: theme.spacing(1.5),
	"&.col-4": {
		width: "20%",
	},
	"&.center": {
		textAlign: "center",
	},
}));

const StyledTableContainer = styled("div")(({ theme }) => ({
	padding: theme.spacing(1),
}));

interface DatabaseStructureBrowserProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	searchedStructure: TableInterface[];
	expandedTables: Record<string, boolean>;
	toggleState: boolean;
	toggleTable: (tableName: string) => void;
	toggleAllTables: () => void;
	isLoading: boolean;
	error: string | null;
	refreshDatabaseStructure: () => void;
	refreshMessage: string | null;
	onTableClick?: (tableName: string) => void;
	selectedColumns?: Record<string, string[]>;
	activeTable?: string | null;
	onToggleColumnSelection?: (tableName: string, columnName: string) => void;
	onClearColumnSelection?: () => void;
	onGenerateQuery?: (query: string) => void;
	generateSelectedColumnsQuery?: () => string;
}

export const DatabaseStructureBrowser: React.FC<
	DatabaseStructureBrowserProps
> = ({
	searchTerm,
	setSearchTerm,
	searchedStructure,
	expandedTables,
	toggleState,
	toggleTable,
	toggleAllTables,
	isLoading,
	error,
	refreshDatabaseStructure,
	refreshMessage,
	onTableClick,
	selectedColumns = {},
	activeTable,
	onToggleColumnSelection,
	onClearColumnSelection,
	onGenerateQuery,
	generateSelectedColumnsQuery,
}) => {
	const handleTableHeaderClick = (
		tableName: string,
		event: React.MouseEvent,
	) => {
		event.preventDefault();
		if (onTableClick) {
			onTableClick(tableName);
		}
	};

	const handleExpandClick = (tableName: string, event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		toggleTable(tableName);
	};

	const handleColumnClick = (
		tableName: string,
		columnName: string,
		event: React.MouseEvent,
	) => {
		event.preventDefault();
		event.stopPropagation();

		if (onToggleColumnSelection) {
			onToggleColumnSelection(tableName, columnName);
		}
	};

	const getSelectedColumnsForTable = (tableName: string): string[] => {
		return selectedColumns[tableName] || [];
	};

	const isColumnSelected = (
		tableName: string,
		columnName: string,
	): boolean => {
		const tableColumns = getSelectedColumnsForTable(tableName);
		return tableColumns.includes(columnName);
	};

	useEffect(() => {
		if (
			activeTable &&
			selectedColumns[activeTable] &&
			selectedColumns[activeTable].length > 0
		) {
			if (generateSelectedColumnsQuery && onGenerateQuery) {
				const query = generateSelectedColumnsQuery();
				if (query) {
					onGenerateQuery(query);
				}
			}
		}
	}, [
		selectedColumns,
		activeTable,
		generateSelectedColumnsQuery,
		onGenerateQuery,
	]);

	return (
		<StyledCard>
			{/* Header */}
			<StyledCardHeader>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					Data Columns
				</Typography>
				<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
					{activeTable &&
						getSelectedColumnsForTable(activeTable).length > 0 && (
							<Button
								size="small"
								onClick={onClearColumnSelection}
								sx={{ textTransform: "none", minWidth: "auto" }}
							>
								Clear
							</Button>
						)}
					<IconButton
						size="small"
						onClick={refreshDatabaseStructure}
						title="Refresh database structure"
						disabled={isLoading}
					>
						<Refresh fontSize="small" />
					</IconButton>
				</Box>
			</StyledCardHeader>

			{/* Search section */}
			<StyledSearchSection>
				<Stack
					direction="row"
					spacing={1}
					sx={{ width: "100%", alignItems: "center" }}
				>
					<TextField
						size="small"
						placeholder="Search"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						InputProps={{
							startAdornment: (
								<Search
									fontSize="small"
									sx={{ mr: 1, color: "secondary" }}
								/>
							),
							endAdornment: searchTerm && (
								<IconButton
									size="small"
									onClick={() => setSearchTerm("")}
									sx={{ mr: 1, color: "secondary" }}
								>
									<Clear fontSize="small" />
								</IconButton>
							),
						}}
						sx={{ flex: 1 }}
					/>
					<Button
						variant="text"
						size="small"
						onClick={toggleAllTables}
						sx={{
							textTransform: "none",
							p: 0,
							minWidth: "auto",
							whiteSpace: "nowrap",
						}}
					>
						{toggleState ? "Collapse All" : "Expand All"}
					</Button>
				</Stack>
			</StyledSearchSection>

			{/* Content area */}
			<StyledTablesList>
				{refreshMessage && (
					<Box
						sx={{
							padding: 2,
							backgroundColor: "info.light",
							mb: 1,
						}}
					>
						<Typography variant="body2" color="info">
							{refreshMessage}
						</Typography>
					</Box>
				)}

				{isLoading && (
					<Box sx={{ padding: 2 }}>
						<Typography variant="body2" color="secondary">
							Loading database structure...
						</Typography>
					</Box>
				)}

				{error && (
					<Box sx={{ padding: 2 }}>
						<Typography variant="body2" color="error">
							{error}
						</Typography>
					</Box>
				)}

				{searchedStructure.map((table: TableInterface) => (
					<StyledTableContainer key={table.table}>
						<StyledTable>
							<thead>
								<StyledTableHeaderRow
									onClick={(e) =>
										handleTableHeaderClick(table.table, e)
									}
									title={`Click to select all columns`}
									className={
										!expandedTables[table.table]
											? "closed"
											: ""
									}
								>
									<StyledTableHeaderCell className="col-4 center">
										<Storage
											fontSize="small"
											sx={{ color: "#666666" }}
										/>
									</StyledTableHeaderCell>
									<StyledTableHeaderCell>
										<Typography
											variant="subtitle2"
											sx={{
												fontSize: "0.875rem",
												fontWeight: 600,
											}}
										>
											{table.table}
										</Typography>
									</StyledTableHeaderCell>
									<StyledTableHeaderCell className="col-4 center">
										<IconButton
											size="small"
											onClick={(e) =>
												handleExpandClick(
													table.table,
													e,
												)
											}
											title={
												expandedTables[table.table]
													? "Collapse table"
													: "Expand table"
											}
											sx={{ p: 0.5 }}
										>
											{expandedTables[table.table] ? (
												<ExpandMore fontSize="small" />
											) : (
												<ChevronRight fontSize="small" />
											)}
										</IconButton>
									</StyledTableHeaderCell>
								</StyledTableHeaderRow>
							</thead>

							{expandedTables[table.table] && (
								<tbody>
									{table.columns.map(
										(column: ColumnInterface) => {
											const isSelected = isColumnSelected(
												table.table,
												column.column,
											);
											return (
												<StyledColumnRow
													key={`${table.table}-${column.column}`}
													selected={isSelected}
													title={`Click to ${isSelected ? "deselect" : "select"} ${column.column} (${column.type})`}
													onClick={(e) =>
														handleColumnClick(
															table.table,
															column.column,
															e,
														)
													}
												>
													<StyledTableCell className="col-4 center"></StyledTableCell>
													<StyledTableCell>
														<Box
															sx={{
																display: "flex",
																alignItems:
																	"center",
																gap: 1,
															}}
														>
															<DatabaseColumnIcon
																type={
																	column.type
																}
															/>
															<Typography
																variant="body2"
																sx={{
																	fontSize:
																		"0.875rem",
																	fontWeight:
																		isSelected
																			? 600
																			: 400,
																}}
															>
																{column.column}
															</Typography>
														</Box>
													</StyledTableCell>
													<StyledTableCell className="col-4"></StyledTableCell>
												</StyledColumnRow>
											);
										},
									)}
								</tbody>
							)}
						</StyledTable>
					</StyledTableContainer>
				))}
			</StyledTablesList>
		</StyledCard>
	);
};
