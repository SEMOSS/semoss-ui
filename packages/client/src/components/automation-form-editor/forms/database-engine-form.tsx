import {
	ChevronDown,
	ChevronRight,
	Database,
	Loader2,
	Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	DatabaseEngineConfig,
	EngineOption,
} from "@/pages/automation/automation.types";
import { BoundInput, EngineSelect } from "./shared";

interface TableStructure {
	table: string;
	columns: { column: string; type: string }[];
}

export function DatabaseEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: {
	config: DatabaseEngineConfig;
	engines: EngineOption[];
	upstreamVars: string[];
	onChange: (c: DatabaseEngineConfig) => void;
}) {
	const { monolithStore } = useRootStore();
	const [structure, setStructure] = useState<TableStructure[]>([]);
	const [schemaLoading, setSchemaLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedTables, setExpandedTables] = useState<
		Record<string, boolean>
	>({});

	useEffect(() => {
		if (!config.engineId) {
			setStructure([]);
			return;
		}
		setSchemaLoading(true);
		monolithStore
			.runQuery(
				`META|GetDatabaseTableStructure(database=["${config.engineId}"]);`,
			)
			.then((res) => {
				const rows = res.pixelReturn?.[0]?.output as
					| Record<string, unknown>[]
					| null;
				if (!rows) return;
				const byTable: Record<
					string,
					{ column: string; type: string }[]
				> = {};
				for (const row of rows) {
					const t = String(row.TABLE_NAME ?? "");
					const c = String(row.COLUMN_NAME ?? "");
					const type = String(row.TYPE ?? "");
					if (!t) continue;
					if (!byTable[t]) byTable[t] = [];
					byTable[t].push({ column: c, type });
				}
				setStructure(
					Object.entries(byTable).map(([table, columns]) => ({
						table,
						columns,
					})),
				);
			})
			.catch(() => setStructure([]))
			.finally(() => setSchemaLoading(false));
	}, [config.engineId, monolithStore]);

	const searchedStructure = searchTerm
		? structure.filter(
				(t) =>
					t.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
					t.columns.some((c) =>
						c.column
							.toLowerCase()
							.includes(searchTerm.toLowerCase()),
					),
			)
		: structure;

	const toggleTable = (table: string) =>
		setExpandedTables((prev) => ({ ...prev, [table]: !prev[table] }));

	const insertTable = (table: string) =>
		onChange({ ...config, expression: `SELECT * FROM ${table}` });

	const insertColumn = (table: string, column: string) =>
		onChange({ ...config, expression: `SELECT ${column} FROM ${table}` });

	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Database Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
				triggerClassName=""
				labelClassName=""
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as DatabaseEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="query">Query (SELECT)</SelectItem>
						<SelectItem value="write">
							Write (INSERT/UPDATE/DELETE)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="SQL Expression"
				value={config.expression}
				placeholder="SELECT * FROM table WHERE id = '${id}'"
				onChange={(v) => onChange({ ...config, expression: v })}
				upstreamVars={upstreamVars}
				mono
			/>
			{config.operation === "query" && (
				<Field>
					<FieldLabel>Row Limit</FieldLabel>
					<Input
						type="number"
						min={1}
						value={config.limit ?? 50}
						onChange={(e) =>
							onChange({
								...config,
								limit: Number(e.target.value),
							})
						}
						placeholder="50"
					/>
				</Field>
			)}

			{config.engineId && (
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<span className="font-medium text-muted-foreground text-xs">
							Schema
						</span>
						{schemaLoading && (
							<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
						)}
						<span className="ml-auto text-[10px] text-muted-foreground/60">
							click to insert
						</span>
					</div>

					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3 w-3 text-muted-foreground/60" />
						<Input
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Filter tables & columns…"
							className="h-7 pl-6 text-xs"
						/>
					</div>

					<div className="max-h-52 overflow-y-auto rounded border text-xs">
						{schemaLoading && searchedStructure.length === 0 ? (
							<div className="flex items-center justify-center py-6 text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : searchedStructure.length === 0 ? (
							<p className="py-4 text-center text-muted-foreground">
								No tables found
							</p>
						) : (
							searchedStructure.map((table) => (
								<div
									key={table.table}
									className="border-b last:border-0"
								>
									<div className="flex items-center">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												toggleTable(table.table);
											}}
											className="flex items-center px-1.5 py-1.5 text-muted-foreground hover:text-foreground"
										>
											{expandedTables[table.table] ? (
												<ChevronDown className="h-3 w-3" />
											) : (
												<ChevronRight className="h-3 w-3" />
											)}
										</button>
										<button
											type="button"
											onClick={() =>
												insertTable(table.table)
											}
											className="flex flex-1 items-center gap-1.5 py-1.5 pr-2 text-left hover:bg-muted/50"
											title={`SELECT * FROM ${table.table}`}
										>
											<Database className="h-3 w-3 shrink-0 text-blue-500" />
											<span className="font-medium">
												{table.table}
											</span>
										</button>
									</div>

									{expandedTables[table.table] && (
										<div className="border-t bg-muted/10">
											{table.columns.map((col) => (
												<button
													key={col.column}
													type="button"
													onClick={() =>
														insertColumn(
															table.table,
															col.column,
														)
													}
													className="flex w-full items-center gap-1.5 py-1 pr-2 pl-7 text-left hover:bg-muted/50"
													title={`SELECT ${col.column} FROM ${table.table}`}
												>
													<span className="flex-1 font-mono text-foreground/80">
														{col.column}
													</span>
													<span className="shrink-0 text-[10px] text-muted-foreground/60">
														{col.type}
													</span>
												</button>
											))}
										</div>
									)}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
