import {
	ChevronDown,
	ChevronRight,
	Database,
	Loader2,
	Search,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Input } from "@semoss/ui/next";
import type { DatabaseEngineConfig } from "../../../domain/automation.types";
import { getPlaygroundParamDescription } from "../../../domain/automation-utils";
import { EnginePickerField } from "./engine-picker-field";
import { BoundInput } from "./pill-input";

interface TableStructure {
	table: string;
	columns: { column: string; type: string }[];
}

export interface DatabaseEngineFormProps {
	/** Current node config */
	config: DatabaseEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: DatabaseEngineConfig) => void;
	/** Fields in this node's config currently marked as playground-fillable */
	playgroundFillable: string[];
	/** Called when the set of playground-fillable fields changes */
	onPlaygroundFieldsChange: (fields: string[]) => void;
	/** When false (business mode), schema browser and advanced fields are hidden */
	devMode?: boolean;
}

export function DatabaseEngineForm({
	config,
	upstreamVars,
	onChange,
	playgroundFillable,
	onPlaygroundFieldsChange,
	devMode = false,
}: DatabaseEngineFormProps) {
	const pgFillId = useId();
	const [structure, setStructure] = useState<TableStructure[]>([]);
	const [schemaLoading, setSchemaLoading] = useState(false);
	const [schemaError, setSchemaError] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedTables, setExpandedTables] = useState<
		Record<string, boolean>
	>({});

	useEffect(() => {
		if (!config.engineId) {
			setStructure([]);
			setSchemaError(false);
			return;
		}
		setSchemaLoading(true);
		setSchemaError(false);
		runPixel(
			`META|GetDatabaseTableStructure(database=["${config.engineId}"]);`,
		)
			.then((res) => {
				const rows = res.pixelReturn?.[0]?.output as unknown[][] | null;
				if (!Array.isArray(rows)) return;
				const byTable: Record<
					string,
					{ column: string; type: string }[]
				> = {};
				for (const row of rows) {
					if (!Array.isArray(row) || row.length < 3) continue;
					const t = String(row[5] ?? row[0] ?? "").trim();
					const c = String(row[4] ?? row[1] ?? "").trim();
					const type =
						String(row[2] ?? "UNKNOWN").trim() || "UNKNOWN";
					if (!t || !c) continue;
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
			.catch(() => {
				setStructure([]);
				setSchemaError(true);
			})
			.finally(() => setSchemaLoading(false));
	}, [config.engineId]);

	const searchedStructure = useMemo(() => {
		if (!searchTerm) return structure;
		const term = searchTerm.toLowerCase();
		return structure.filter(
			(t) =>
				t.table.toLowerCase().includes(term) ||
				t.columns.some((c) => c.column.toLowerCase().includes(term)),
		);
	}, [structure, searchTerm]);

	const toggleTable = (table: string) =>
		setExpandedTables((prev) => ({ ...prev, [table]: !prev[table] }));

	const insertTable = (table: string) =>
		onChange({ ...config, expression: `SELECT * FROM ${table}` });

	const insertColumn = (table: string, column: string) =>
		onChange({ ...config, expression: `SELECT ${column} FROM ${table}` });

	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Database Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["DATABASE"]}
				required
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
					})
				}
			/>

			<BoundInput
				label="SQL Query"
				required
				value={config.expression}
				placeholder="-- I want to find open claims from the last 7 days"
				onChange={(v) => onChange({ ...config, expression: v })}
				upstreamVars={upstreamVars}
				mono
				minRows={6}
			/>

			{devMode && (
				<>
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id={pgFillId}
							checked={playgroundFillable.includes("expression")}
							onChange={(e) => {
								const next = e.target.checked
									? [...playgroundFillable, "expression"]
									: playgroundFillable.filter(
											(f) => f !== "expression",
										);
								onPlaygroundFieldsChange(next);
							}}
							className="h-3.5 w-3.5 cursor-pointer accent-primary"
						/>
						<label
							htmlFor={pgFillId}
							className="cursor-pointer text-muted-foreground text-xs"
							title={getPlaygroundParamDescription(
								"database-engine",
								"expression",
							)}
						>
							Let Playground fill this field
						</label>
					</div>
					{playgroundFillable.includes("expression") &&
						config.expression && (
							<p className="text-amber-600 text-xs dark:text-amber-400">
								Current value will be overwritten if Playground
								provides input
							</p>
						)}
				</>
			)}

			{devMode && config.engineId && (
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
								{schemaError
									? "Failed to load schema"
									: "No tables found"}
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
