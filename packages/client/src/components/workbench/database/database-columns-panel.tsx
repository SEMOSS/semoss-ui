import {
	AlertCircleIcon,
	ChevronDown,
	ChevronsUpDown,
	RefreshCw,
	SearchIcon,
	Table,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnInterface, TableInterface } from "@semoss/sdk";
import { DataTypeIcon } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Muted,
	Small,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useEngine } from "@/hooks/useEngine";
import {
	type DatabaseColumnAction,
	type DatabaseTableAction,
	type DatabaseType,
	getColumnActionGroups,
	getTableActionGroups,
} from "./database-script-templates";
import { DatabaseUploadCsv } from "./database-upload-file";

function getActionKey(action: { label: string }): string {
	return action.label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

interface DatabaseColumnPanelProps {
	/** Mode of the engine */
	mode: DatabaseType;

	/** Track loading state of the database structure */
	isLoading: boolean;

	/** Error message if fetching the database structure failed */
	error: string;

	/** Refresh the structure */
	refresh: () => void;

	/** Structure */
	structure: {
		table: string;
		columns: ColumnInterface[];
	}[];

	/** Opens a new query panel with generated script text */
	onCreateQueryPanel: (query: string, name: string) => void;
}

export const DatabaseColumnsPanel: React.FC<DatabaseColumnPanelProps> = ({
	mode,
	isLoading,
	error,
	refresh,
	structure,
	onCreateQueryPanel,
}) => {
	const { permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedTables, setExpandedTables] = useState<
		Record<string, boolean>
	>({});
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [uploadTargetTable, setUploadTargetTable] = useState("");

	// Sync expanded state when the structure changes — new tables default to expanded,
	// and tables no longer in the structure are dropped from state.
	useEffect(() => {
		setExpandedTables((prev) => {
			const next: Record<string, boolean> = {};
			for (const table of structure) {
				next[table.table] = prev[table.table] ?? true;
			}
			return next;
		});
	}, [structure]);

	// Filter structure by search term, matching against table names and column names.
	// Spaces in the search term are treated as underscores to match database naming conventions.
	const searchedStructure = useMemo(() => {
		if (!searchTerm) {
			return structure;
		}

		const cleanedSearch = searchTerm.replace(/ /g, "_").toLowerCase();
		const searched: TableInterface[] = [];

		for (const table of structure) {
			const tableMatches = table.table
				.toLowerCase()
				.includes(cleanedSearch);

			if (tableMatches) {
				searched.push(table);
				continue;
			}

			const matchedColumns = table.columns.filter((column) =>
				column.column.toLowerCase().includes(cleanedSearch),
			);

			if (matchedColumns.length > 0) {
				searched.push({
					table: table.table,
					columns: matchedColumns,
				});
			}
		}

		return searched;
	}, [structure, searchTerm]);

	// Context-menu action groups vary by query language (SQL vs SPARQL). In
	// read-only mode only the "Query" group is exposed so users can generate
	// SELECT-style queries but not data/schema mutations (Insert/Update/DROP…).
	const tableActionGroups = getTableActionGroups(mode).filter(
		(group) => !readOnly || group.label === "Query",
	);
	const columnActionGroups = getColumnActionGroups(mode).filter(
		(group) => !readOnly || group.label === "Query",
	);

	const allExpanded =
		searchedStructure.length > 0 &&
		searchedStructure.every((t) => !!expandedTables[t.table]);

	// Toggles all currently visible (searched) tables between expanded and collapsed.
	const toggleAllTables = () => {
		setExpandedTables((prev) => {
			const areAllExpanded =
				searchedStructure.length > 0 &&
				searchedStructure.every((table) => !!prev[table.table]);
			const nextExpandedState = !areAllExpanded;
			const next = { ...prev };
			for (const table of searchedStructure) {
				next[table.table] = nextExpandedState;
			}
			return next;
		});
	};

	// Generates a script from the selected table action and opens it in a new query panel.
	// Looks up the full column list from the unfiltered structure so all columns are available.
	const handleTableAction = useCallback(
		(tableName: string, action: DatabaseTableAction) => {
			const columns =
				structure
					.find((table) => table.table === tableName)
					?.columns.map((column) => column.column) ?? [];
			const script = action.query(tableName, columns);

			onCreateQueryPanel(script, `${action.label} ${tableName}`);
		},
		[onCreateQueryPanel, structure],
	);

	// Generates a script from the selected column action and opens it in a new query panel.
	const handleColumnAction = useCallback(
		(
			tableName: string,
			columnName: string,
			action: DatabaseColumnAction,
		) => {
			const script = action.query(tableName, columnName);
			onCreateQueryPanel(script, `${action.label} ${columnName}`);
		},
		[onCreateQueryPanel],
	);

	// Updates the expanded/collapsed state for a single table.
	const handleTableOpenChange = useCallback(
		(tableName: string, open: boolean) => {
			setExpandedTables((prev) => ({
				...prev,
				[tableName]: open,
			}));
		},
		[],
	);

	return (
		<>
			<div
				className="flex h-full flex-col overflow-hidden bg-card text-card-foreground"
				data-testid="database-columns--browser"
			>
				<div className="flex w-full shrink-0 flex-row gap-2 p-2">
					<InputGroup className="flex-1 bg-background">
						<InputGroupAddon>
							<SearchIcon className="size-4 text-muted-foreground" />
						</InputGroupAddon>
						<InputGroupInput
							placeholder={"Search columns"}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							data-testid="database-columns--search-input"
						/>
						{searchTerm && (
							<InputGroupAddon align="inline-end">
								<InputGroupButton
									size="icon-xs"
									variant="ghost"
									onClick={() => setSearchTerm("")}
									aria-label="Clear search"
									data-testid="database-columns--search-clear-btn"
								>
									<X className="size-4" />
								</InputGroupButton>
							</InputGroupAddon>
						)}
					</InputGroup>
					<div className="flex flex-row items-center gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={toggleAllTables}
									aria-label={
										allExpanded
											? "Collapse all"
											: "Expand all"
									}
									data-testid="database-columns--toggle-all-btn"
								>
									<ChevronsUpDown className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{allExpanded ? "Collapse all" : "Expand all"}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => refresh()}
									disabled={isLoading}
									data-testid="database-columns--refresh-btn"
								>
									<RefreshCw
										className={cn(
											"size-3",
											isLoading && "animate-spin",
										)}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								Refresh database structure
							</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div className="flex-1 overflow-auto p-0">
					{isLoading && (
						<div className="flex h-full w-full items-center justify-center">
							<Spinner className="size-4" />
						</div>
					)}

					{error && (
						<div className="flex h-full w-full items-center justify-center">
							<Alert variant="destructive" className="max-w-md">
								<AlertCircleIcon />
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						</div>
					)}

					{!isLoading && !error && (
						<div className="space-y-1 px-2 pb-2">
							{searchedStructure.length > 0 && (
								<div className="space-y-2">
									{searchedStructure.map((table) => (
										<Collapsible
											key={table.table}
											open={
												expandedTables[table.table] ??
												true
											}
											onOpenChange={(open) =>
												handleTableOpenChange(
													table.table,
													open,
												)
											}
										>
											<div
												className="overflow-hidden rounded-md border border-border bg-background shadow-sm"
												data-testid={`database-columns--table-${table.table}`}
											>
												<ContextMenu>
													<ContextMenuTrigger asChild>
														<CollapsibleTrigger
															asChild
														>
															<Button
																variant="secondary"
																className="w-full justify-between rounded-none has-[>svg]:px-3"
																title="Right-click for table actions"
																data-testid={`database-columns--table-header-${table.table}`}
															>
																<span className="flex min-w-0 items-center gap-2">
																	<Table className="size-4 text-muted-foreground" />
																	<span className="truncate font-medium text-sm">
																		{
																			table.table
																		}
																	</span>
																</span>
																<span className="flex items-center gap-2">
																	<Small className="text-muted-foreground text-xs">
																		{
																			table
																				.columns
																				.length
																		}
																	</Small>
																	<ChevronDown
																		className={cn(
																			"size-4 text-muted-foreground transition-transform",
																			expandedTables[
																				table
																					.table
																			] &&
																				"rotate-180",
																		)}
																	/>
																</span>
															</Button>
														</CollapsibleTrigger>
													</ContextMenuTrigger>
													<ContextMenuContent
														data-testid={`database-columns--table-menu-${table.table}`}
													>
														{mode === "SQL" &&
															!readOnly && (
																<>
																	<ContextMenuItem
																		title={
																			"Upload CSV"
																		}
																		onSelect={() => {
																			setUploadTargetTable(
																				table.table,
																			);
																			setUploadDialogOpen(
																				true,
																			);
																		}}
																		data-testid={`database-columns--table-action-${table.table}-upload-csv}`}
																	>
																		Upload
																	</ContextMenuItem>
																	<ContextMenuSeparator />
																</>
															)}
														{tableActionGroups.map(
															(group) => (
																<ContextMenuSub
																	key={`${table.table}-${group.label}`}
																>
																	<ContextMenuSubTrigger>
																		{
																			group.label
																		}
																	</ContextMenuSubTrigger>
																	<ContextMenuSubContent>
																		{group.actions.map(
																			(
																				action,
																			) => (
																				<ContextMenuItem
																					key={
																						action.label
																					}
																					variant={
																						group.label ===
																						"Destructive"
																							? "destructive"
																							: "default"
																					}
																					title={
																						action.description
																					}
																					onSelect={() =>
																						handleTableAction(
																							table.table,
																							action,
																						)
																					}
																					data-testid={`database-columns--table-action-${table.table}-${getActionKey(action)}`}
																				>
																					{
																						action.label
																					}
																				</ContextMenuItem>
																			),
																		)}
																	</ContextMenuSubContent>
																</ContextMenuSub>
															),
														)}
													</ContextMenuContent>
												</ContextMenu>

												<CollapsibleContent>
													<div className="space-y-1 border-border border-t px-2 py-2">
														{table.columns.map(
															(column) => (
																<ContextMenu
																	key={`${table.table}-${column.column}`}
																>
																	<ContextMenuTrigger
																		asChild
																	>
																		<div
																			className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50"
																			title="Right-click for column actions"
																			data-testid={`database-columns--column-${table.table}-${column.column}`}
																		>
																			<DataTypeIcon
																				type={
																					column.type
																				}
																			/>
																			<span className="truncate text-sm">
																				{
																					column.column
																				}
																			</span>
																		</div>
																	</ContextMenuTrigger>
																	<ContextMenuContent
																		data-testid={`database-columns--column-menu-${table.table}-${column.column}`}
																	>
																		{columnActionGroups.map(
																			(
																				group,
																			) => (
																				<ContextMenuSub
																					key={`${table.table}-${column.column}-${group.label}`}
																				>
																					<ContextMenuSubTrigger>
																						{
																							group.label
																						}
																					</ContextMenuSubTrigger>
																					<ContextMenuSubContent>
																						{group.actions.map(
																							(
																								action,
																							) => (
																								<ContextMenuItem
																									key={
																										action.label
																									}
																									variant={
																										group.label ===
																										"Destructive"
																											? "destructive"
																											: "default"
																									}
																									title={
																										action.description
																									}
																									onSelect={() =>
																										handleColumnAction(
																											table.table,
																											column.column,
																											action,
																										)
																									}
																									data-testid={`database-columns--column-action-${table.table}-${column.column}-${getActionKey(action)}`}
																								>
																									{
																										action.label
																									}
																								</ContextMenuItem>
																							),
																						)}
																					</ContextMenuSubContent>
																				</ContextMenuSub>
																			),
																		)}
																	</ContextMenuContent>
																</ContextMenu>
															),
														)}
													</div>
												</CollapsibleContent>
											</div>
										</Collapsible>
									))}
								</div>
							)}

							{searchedStructure.length === 0 && !isLoading && (
								<div className="w-full px-2 py-4 text-center">
									<Muted>No results found</Muted>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<DatabaseUploadCsv
				structure={structure}
				table={uploadTargetTable}
				open={uploadDialogOpen}
				onClose={(success) => {
					if (success) {
						refresh();
					}

					setUploadDialogOpen(false);
				}}
			/>
		</>
	);
};
