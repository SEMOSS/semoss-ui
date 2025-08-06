import {
	ChevronRight,
	Clear,
	ExpandMore,
	Refresh,
	Search,
	Storage,
} from "@mui/icons-material";
import React from "react";
import {
	Box,
	Button,
	Card,
	IconButton,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { DatabaseColumnIcon } from "./DatabaseColumnIcon";

// Main card wrapper
const StyledCard = styled(Card)(({ theme }) => ({
	borderRadius: "16px",
	background: theme.palette.background.paper,
	boxshadow: `0px 1px 2px 0px #00000014`,
	height: "100%",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
	border: `1px solid #C4C4C4`,
}));

// Header section
const StyledCardHeader = styled("div")(({ theme }) => ({
	backgroundColor: "#EBF4FE", // Pale baby blue
	padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
	borderBottom: `1px solid ${theme.palette.divider}`,
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
}));

// Search section
const StyledSearchSection = styled("div")(({ theme }) => ({
	padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
	flexShrink: 0,
}));

// Content area for tables list
const StyledTablesList = styled("div")(() => ({
	flex: 1,
	overflow: "auto",
	minHeight: 0,
}));

const StyledTable = styled("table")(({ theme }) => ({
	width: "100%",
	borderCollapse: "collapse",
	outline: "none",
	padding: theme.spacing(1),
	"& th": {
		borderColor: theme.palette.grey[300],
		borderBottom: "none",
		backgroundColor: theme.palette.grey[100],
	},
	"& td": {
		borderColor: theme.palette.grey[300],
	},
	"& th:not(:last-child), td:not(:last-child)": {
		borderRight: "none",
	},
	"& tr:not(:last-child) > td": {
		borderBottom: "none",
	},
}));

const StyledTableHeaderRow = styled("tr")(({ theme }) => ({
	cursor: "pointer",
	outline: "none",
	"&:hover": {
		backgroundColor: theme.palette.grey[100],
	},
	"&.closed": {
		"& th:first-of-type": {
			borderBottomLeftRadius: theme.shape.borderRadius,
		},
		"& th:last-child": {
			borderBottomRightRadius: theme.shape.borderRadius,
		},
	},
	"& th": {
		borderBottom: `1px solid ${theme.palette.grey[300]}`,
	},
}));

const StyledTableHeaderCell = styled("th")(({ theme }) => ({
	padding: theme.spacing(1.5),
	textAlign: "left",
	fontWeight: 600,
	"&.col-4": {
		width: "20%",
	},
}));

const StyledColumnRow = styled("tr")(({ theme }) => ({
	cursor: "pointer",
	"&:hover": {
		backgroundColor: theme.palette.grey[50],
	},
}));

const StyledTableCell = styled("td")(({ theme }) => ({
	padding: theme.spacing(1.5),
	"&.col-4": {
		width: "20%",
	},
}));

interface Column {
	column: string;
	type: string;
}

interface Table {
	table: string;
	columns: Column[];
}

interface DatabaseStructureBrowserProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	searchedStructure: Table[];
	expandedTables: Record<string, boolean>;
	toggleState: boolean;
	toggleTable: (tableName: string) => void;
	toggleAllTables: () => void;
	isLoading: boolean;
	error: string | null;
	refreshDatabaseStructure: () => void;
	refreshMessage: string | null;
	onTableClick?: (tableName: string) => void;
	onColumnClick?: (
		tableName: string,
		columnName: string,
		columnType: string,
	) => void;
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
	onColumnClick,
}) => {
	const handleTableHeaderClick = (
		tableName: string,
		event: React.MouseEvent,
	) => {
		event.preventDefault();

		// If shift key is held, visualize the table instead of toggling
		if (event.shiftKey && onTableClick) {
			onTableClick(tableName);
		} else {
			toggleTable(tableName);
		}
	};

	const handleColumnClick = (
		tableName: string,
		columnName: string,
		columnType: string,
		event: React.MouseEvent,
	) => {
		event.preventDefault();
		event.stopPropagation();

		if (onColumnClick) {
			onColumnClick(tableName, columnName, columnType);
		}
	};

	return (
		<StyledCard>
			{/* Header */}
			<StyledCardHeader>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					Data Columns
				</Typography>
				<IconButton
					size="small"
					onClick={refreshDatabaseStructure}
					title="Refresh database structure"
					disabled={isLoading}
				>
					<Refresh fontSize="small" />
				</IconButton>
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

				{/* Usage Instructions */}
				<Box
					sx={{
						mt: 1,
						p: 1,
						backgroundColor: "info.lighter",
						borderRadius: 1,
					}}
				>
					<Typography
						variant="caption"
						sx={{ fontSize: "0.75rem", color: "info.main" }}
					>
						Click table names to expand/collapse. Shift+Click tables
						or click columns to visualize as SELECT queries.
					</Typography>
				</Box>
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

				{searchedStructure.map((table: Table) => (
					<div key={table.table} style={{ padding: "8px" }}>
						<StyledTable>
							<thead>
								<StyledTableHeaderRow
									onClick={(e) =>
										handleTableHeaderClick(table.table, e)
									}
									title={`${table.table} (Shift+Click to visualize)`}
									className={
										!expandedTables[table.table]
											? "closed"
											: ""
									}
								>
									<StyledTableHeaderCell
										className="col-4"
										style={{ textAlign: "center" }}
									>
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
									<StyledTableHeaderCell
										className="col-4"
										style={{ textAlign: "center" }}
									>
										{expandedTables[table.table] ? (
											<ExpandMore fontSize="small" />
										) : (
											<ChevronRight fontSize="small" />
										)}
									</StyledTableHeaderCell>
								</StyledTableHeaderRow>
							</thead>

							{expandedTables[table.table] && (
								<tbody>
									{table.columns.map(
										(column: Column, index: number) => (
											<StyledColumnRow
												key={index}
												title={`Click to visualize ${column.column} (${column.type})`}
												onClick={(e) =>
													handleColumnClick(
														table.table,
														column.column,
														column.type,
														e,
													)
												}
											>
												<StyledTableCell
													className="col-4"
													style={{
														textAlign: "center",
													}}
												>
													<DatabaseColumnIcon
														type={column.type}
													/>
												</StyledTableCell>
												<StyledTableCell>
													<Typography
														variant="body2"
														sx={{
															fontSize:
																"0.875rem",
														}}
													>
														{column.column}
													</Typography>
												</StyledTableCell>
												<StyledTableCell className="col-4"></StyledTableCell>
											</StyledColumnRow>
										),
									)}
								</tbody>
							)}
						</StyledTable>
					</div>
				))}
			</StyledTablesList>
		</StyledCard>
	);
};
