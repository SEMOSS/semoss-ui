import {
	AlertCircleIcon,
	ChevronDown,
	ChevronsUpDown,
	NetworkIcon,
	SearchIcon,
	Table,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
	DatabaseTableStructure,
	DatabaseWorkbenchMode,
} from "@semoss/engine-workbench";
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
import {
	getColumnActionGroups,
	getTableActionGroups,
} from "./database-script-templates";

interface DatabaseSchemaBrowserProps {
	mode: DatabaseWorkbenchMode;
	structure: DatabaseTableStructure[];
	status: "IDLE" | "LOADING" | "SUCCESS" | "ERROR";
	error?: string;
	onCreateQuery: (query: string, name?: string) => void;
}

export const DatabaseSchemaBrowser = ({
	mode,
	structure,
	status,
	error,
	onCreateQuery,
}: DatabaseSchemaBrowserProps) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedTables, setExpandedTables] = useState<
		Record<string, boolean>
	>({});

	useEffect(() => {
		setExpandedTables((current) =>
			Object.fromEntries(
				structure.map((table) => [
					table.table,
					current[table.table] ?? true,
				]),
			),
		);
	}, [structure]);

	const searchedStructure = useMemo(() => {
		if (!searchTerm) return structure;
		const search = searchTerm.replace(/ /g, "_").toLowerCase();
		return structure.flatMap((table) => {
			if (table.table.toLowerCase().includes(search)) return [table];
			const columns = table.columns.filter((column) =>
				column.column.toLowerCase().includes(search),
			);
			return columns.length ? [{ ...table, columns }] : [];
		});
	}, [searchTerm, structure]);

	const allExpanded =
		searchedStructure.length > 0 &&
		searchedStructure.every((table) => expandedTables[table.table]);
	const tableActionGroups = getTableActionGroups(mode);
	const columnActionGroups = getColumnActionGroups(mode);

	return (
		<div className="flex h-full flex-col overflow-hidden bg-card text-card-foreground">
			<div className="flex w-full shrink-0 flex-row gap-2 p-2">
				<InputGroup className="flex-1 bg-background">
					<InputGroupAddon>
						<SearchIcon className="size-4 text-muted-foreground" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Search columns"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
					/>
					{searchTerm ? (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								variant="ghost"
								onClick={() => setSearchTerm("")}
								aria-label="Clear search"
							>
								<X className="size-4" />
							</InputGroupButton>
						</InputGroupAddon>
					) : null}
				</InputGroup>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								const next = !allExpanded;
								setExpandedTables((current) => ({
									...current,
									...Object.fromEntries(
										searchedStructure.map((table) => [
											table.table,
											next,
										]),
									),
								}));
							}}
							aria-label={
								allExpanded ? "Collapse all" : "Expand all"
							}
						>
							<ChevronsUpDown className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{allExpanded ? "Collapse all" : "Expand all"}
					</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex-1 overflow-auto">
				{status === "LOADING" ? (
					<div className="flex h-full items-center justify-center">
						<Spinner className="size-4" />
					</div>
				) : null}
				{status === "ERROR" ? (
					<div className="flex h-full items-center justify-center p-2">
						<Alert variant="destructive">
							<AlertCircleIcon />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					</div>
				) : null}
				{status === "SUCCESS" ? (
					<div className="space-y-2 px-2 pb-2">
						{searchedStructure.map((table) => (
							<Collapsible
								key={table.table}
								open={expandedTables[table.table] ?? true}
								onOpenChange={(open) =>
									setExpandedTables((current) => ({
										...current,
										[table.table]: open,
									}))
								}
							>
								<div className="overflow-hidden rounded-md border border-border bg-background shadow-sm">
									<ContextMenu>
										<ContextMenuTrigger asChild>
											<CollapsibleTrigger asChild>
												<Button
													variant="secondary"
													className="w-full justify-between rounded-none has-[>svg]:px-3"
												>
													<span className="flex min-w-0 items-center gap-2">
														<Table className="size-4 text-muted-foreground" />
														<span className="truncate font-medium text-sm">
															{table.table}
														</span>
													</span>
													<span className="flex items-center gap-2">
														<Small className="text-muted-foreground text-xs">
															{
																table.columns
																	.length
															}
														</Small>
														<ChevronDown
															className={cn(
																"size-4 text-muted-foreground transition-transform",
																expandedTables[
																	table.table
																] &&
																	"rotate-180",
															)}
														/>
													</span>
												</Button>
											</CollapsibleTrigger>
										</ContextMenuTrigger>
										<ContextMenuContent>
											{tableActionGroups.map((group) => (
												<ContextMenuSub
													key={`${table.table}-${group.label}`}
												>
													<ContextMenuSubTrigger>
														{group.label}
													</ContextMenuSubTrigger>
													<ContextMenuSubContent>
														{group.actions.map(
															(action) => (
																<ContextMenuItem
																	key={
																		action.label
																	}
																	variant={
																		group.label ===
																		"Modify"
																			? "destructive"
																			: "default"
																	}
																	title={
																		action.description
																	}
																	onSelect={() =>
																		onCreateQuery(
																			action.query(
																				table.table,
																				table.columns.map(
																					(
																						column,
																					) =>
																						column.column,
																				),
																			),
																			`${action.label} ${table.table}`,
																		)
																	}
																>
																	{
																		action.label
																	}
																</ContextMenuItem>
															),
														)}
													</ContextMenuSubContent>
												</ContextMenuSub>
											))}
										</ContextMenuContent>
									</ContextMenu>
									<CollapsibleContent>
										<div className="space-y-1 border-border border-t px-2 py-2">
											{table.columns.map((column) => (
												<ContextMenu
													key={`${table.table}-${column.column}`}
												>
													<ContextMenuTrigger asChild>
														<div
															className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50"
															title="Right-click for column actions"
														>
															<DataTypeIcon
																type={
																	column.type
																}
															/>
															<span className="truncate text-sm">
																{column.column}
															</span>
														</div>
													</ContextMenuTrigger>
													<ContextMenuContent>
														{columnActionGroups.map(
															(group) => (
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
																						"Modify"
																							? "destructive"
																							: "default"
																					}
																					title={
																						action.description
																					}
																					onSelect={() =>
																						onCreateQuery(
																							action.query(
																								table.table,
																								column.column,
																							),
																							`${action.label} ${column.column}`,
																						)
																					}
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
											))}
										</div>
									</CollapsibleContent>
								</div>
							</Collapsible>
						))}
						{searchedStructure.length === 0 ? (
							<div className="px-2 py-4 text-center">
								<Muted>No results found</Muted>
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</div>
	);
};

export const DatabaseSchemaIcon = NetworkIcon;
