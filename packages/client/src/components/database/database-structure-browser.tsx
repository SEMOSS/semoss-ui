/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import {
	ChevronDown,
	ChevronRight,
	Database,
	Loader2,
	RefreshCw,
	Search,
	X,
} from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import type { ColumnInterface, TableInterface } from "@semoss/sdk";
import { Button, CardContent, CardHeader, cn, Input, P } from "@semoss/ui/next";
import { DatabaseColumnIcon } from "@/components/database";

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
	// "Expand All/Collapse All" button in sync with expand/collapse icons
	const allExpanded = searchedStructure.length > 0 && searchedStructure.every((t) => !!expandedTables[t.table]);
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

	const hasSelectedColumns =
		activeTable && getSelectedColumnsForTable(activeTable).length > 0;

	return (
		<div
			className="flex h-full flex-col overflow-hidden"
			data-testid="database-structure-browser"
		>
			{/* Header */}
			<CardHeader className="flex flex-row items-center justify-between border-border/50 border-b-1 px-3 py-2.5">
				<h3
					className="font-semibold text-base text-foreground"
					data-testid="database-browser-title"
				>
					Data Columns
				</h3>
				<div className="flex items-center gap-2">
					{hasSelectedColumns && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClearColumnSelection}
							className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
							data-testid="database-clear-selection-btn"
						>
							Clear
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						onClick={refreshDatabaseStructure}
						disabled={isLoading}
						title="Refresh database structure"
						className="size-8 hover:bg-primary/10 hover:text-primary"
						data-testid="database-refresh-btn"
					>
						<RefreshCw
							className={cn(
								"size-4",
								isLoading && "animate-spin",
							)}
						/>
					</Button>
				</div>
			</CardHeader>

			{/* Search Section */}
			<div className="flex flex-shrink-0 items-center gap-2 border-border/50 border-b bg-muted/5 px-4 py-3">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						placeholder="Search tables and columns..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="h-9 pr-9 pl-9 text-sm"
						data-testid="database-search-input"
					/>
					{searchTerm && (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setSearchTerm("")}
							className="-translate-y-1/2 absolute top-1/2 right-1 size-7 hover:bg-muted"
							data-testid="database-search-clear-btn"
						>
							<X className="size-3.5" />
						</Button>
					)}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={toggleAllTables}
					className="h-9 whitespace-nowrap font-medium text-xs"
					data-testid="database-toggle-all-btn"
				>
					{allExpanded ? "Collapse All" : "Expand All"}
				</Button>
			</div>

			{/* Content Area */}
			<CardContent className="flex-1 overflow-auto p-0">
				{/* Refresh Message */}
				{refreshMessage && (
					<div
						className="slide-in-from-top-2 fade-in mx-3 mt-3 animate-in rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
						data-testid="database-refresh-message"
					>
						<div className="flex items-center gap-2">
							<div className="size-1.5 animate-pulse rounded-full bg-primary" />
							<P className="text-foreground text-xs">
								{refreshMessage}
							</P>
						</div>
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div
						className="flex items-center gap-2 px-4 py-3"
						data-testid="database-loading"
					>
						<Loader2 className="size-4 animate-spin text-muted-foreground" />
						<P className="text-muted-foreground text-sm">
							Loading database structure...
						</P>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div
						className="mx-3 mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
						data-testid="database-error"
					>
						<P className="text-destructive text-xs">{error}</P>
					</div>
				)}

				{/* Tables List */}
				{!isLoading && !error && (
					<div className="space-y-1 p-2">
						{searchedStructure.map((table: TableInterface) => {
							const isExpanded = expandedTables[table.table];
							const tableHasSelectedColumns =
								getSelectedColumnsForTable(table.table).length >
								0;

							return (
								<div
									key={table.table}
									className={cn(
										"overflow-hidden rounded-lg border border-border/40 bg-card transition-all duration-200",
										tableHasSelectedColumns &&
											"border-primary/40 bg-primary/5",
									)}
									data-testid={`database-table-${table.table}`}
								>
									{/* Table Header */}
									<div
										onClick={(e) =>
											handleTableHeaderClick(
												table.table,
												e,
											)
										}
										className={cn(
											"group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors",
											"hover:bg-muted/50",
											isExpanded &&
												"border-border/40 border-b bg-muted/30",
										)}
										title="Click to select all columns"
										data-testid={`database-table-header-${table.table}`}
									>
										<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 transition-colors group-hover:bg-primary/20">
											<Database className="size-4 text-primary" />
										</div>
										<div className="flex-1">
											<p className="font-semibold text-foreground text-sm">
												{table.table}
											</p>
											{tableHasSelectedColumns && (
												<p className="text-primary text-xs">
													{
														getSelectedColumnsForTable(
															table.table,
														).length
													}{" "}
													selected
												</p>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) =>
												handleExpandClick(
													table.table,
													e,
												)
											}
											title={
												isExpanded
													? "Collapse table"
													: "Expand table"
											}
											className="size-7 hover:bg-background"
											data-testid={`database-table-expand-${table.table}`}
										>
											{isExpanded ? (
												<ChevronDown className="size-4 text-muted-foreground transition-transform" />
											) : (
												<ChevronRight className="size-4 text-muted-foreground transition-transform" />
											)}
										</Button>
									</div>

									{/* Columns List */}
									{isExpanded && (
										<div className="bg-muted/5">
											{table.columns.map(
												(column: ColumnInterface) => {
													const isSelected =
														isColumnSelected(
															table.table,
															column.column,
														);
													return (
														<div
															key={`${table.table}-${column.column}`}
															onClick={(e) =>
																handleColumnClick(
																	table.table,
																	column.column,
																	e,
																)
															}
															className={cn(
																"group flex cursor-pointer items-center gap-3 border-border/20 border-t px-3 py-2 transition-all duration-150",
																"hover:bg-muted/50",
																isSelected &&
																	"bg-primary/10 hover:bg-primary/15",
															)}
															title={`Click to ${isSelected ? "deselect" : "select"} ${column.column} (${column.type})`}
															data-testid={`database-column-${table.table}-${column.column}`}
														>
															<div className="w-8" />
															<div className="flex flex-1 items-center gap-2.5">
																<DatabaseColumnIcon
																	type={
																		column.type
																	}
																/>
																<p
																	className={cn(
																		"text-sm transition-all",
																		isSelected
																			? "font-semibold text-primary"
																			: "font-normal text-foreground",
																	)}
																>
																	{
																		column.column
																	}
																</p>
															</div>
															{isSelected && (
																<div className="size-2 rounded-full bg-primary" />
															)}
														</div>
													);
												},
											)}
										</div>
									)}
								</div>
							);
						})}

						{searchedStructure.length === 0 && !isLoading && (
							<div className="flex flex-col items-center justify-center py-12">
								<Database className="size-12 text-muted-foreground/30" />
								<P className="mt-3 text-muted-foreground text-sm">
									{searchTerm
										? "No tables found"
										: "No tables available"}
								</P>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</div>
	);
};
