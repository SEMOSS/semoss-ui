import {
	ChevronDown,
	ChevronRight,
	Database,
	Loader2,
	Search,
	Sparkles,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { FieldLabel, Input, Textarea } from "@semoss/ui/next";
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

	// Dev mode: AI SQL generation popup
	const [showAiPrompt, setShowAiPrompt] = useState(false);
	const [aiLoading, setAiLoading] = useState(false);

	// Business mode: "View SQL" disclosure
	const [showSql, setShowSql] = useState(false);

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

	const modelEngineIdRef = useRef<string | null | undefined>(undefined);

	const resolveModelEngine = async (): Promise<string | null> => {
		if (modelEngineIdRef.current !== undefined)
			return modelEngineIdRef.current;
		try {
			const res = await runPixel(`MyEngines(engineTypes=["MODEL"]);`);
			const engines = res.pixelReturn?.[0]?.output as Array<{
				engine_id: string;
			}> | null;
			modelEngineIdRef.current = engines?.[0]?.engine_id ?? null;
		} catch {
			modelEngineIdRef.current = null;
		}
		return modelEngineIdRef.current;
	};

	const handleAiGenerate = async (prompt: string) => {
		if (!prompt.trim() || !config.engineId) return;
		setAiLoading(true);
		try {
			const modelId = await resolveModelEngine();
			if (!modelId) return;
			const escaped = prompt
				.trim()
				.replace(/\\/g, "\\\\")
				.replace(/"/g, '\\"');
			const result = await runPixel(
				`TextToSQL(database=["${config.engineId}"], model=["${modelId}"], command=["${escaped}"]);`,
			);
			const output = result.pixelReturn?.[result.pixelReturn.length - 1]
				?.output as Record<string, string> | null;
			const sql = output?.sql?.trim();
			if (sql) {
				onChange({ ...config, expression: sql });
				if (!devMode) setShowSql(true);
				else setShowAiPrompt(false);
			}
		} catch {
			// leave expression unchanged
		} finally {
			setAiLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Database Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["DATABASE"]}
				onChange={(e) =>
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
					})
				}
			/>

			{devMode ? (
				/* Dev mode: SQL textarea is primary */
				<div className="flex flex-col gap-1">
					<BoundInput
						label="Database Query"
						value={config.expression}
						placeholder="e.g. SELECT * FROM CLAIMS WHERE STATUS = 'pending' LIMIT 100"
						onChange={(v) => onChange({ ...config, expression: v })}
						upstreamVars={upstreamVars}
						mono
						minRows={6}
					/>

					{config.engineId && !showAiPrompt && (
						<button
							type="button"
							onClick={() => setShowAiPrompt(true)}
							className="flex items-center gap-1 self-start text-[11px] text-muted-foreground transition-colors hover:text-primary"
						>
							<Sparkles className="h-3 w-3" />
							Help me write this query
						</button>
					)}

					{showAiPrompt && (
						<div className="mt-1 flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
							<p className="text-[11px] text-muted-foreground">
								Describe what data you need and the AI will
								write the SQL for you.
							</p>
							<Textarea
								value={config.nlPrompt ?? ""}
								onChange={(e) =>
									onChange({
										...config,
										nlPrompt: e.target.value,
									})
								}
								placeholder="e.g. Get all open claims submitted in the last 7 days, showing claim ID, status, and date"
								className="min-h-[60px] resize-none text-xs"
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										(e.metaKey || e.ctrlKey)
									) {
										handleAiGenerate(config.nlPrompt ?? "");
									}
								}}
							/>
							<div className="flex items-center gap-2">
								<button
									type="button"
									disabled={
										!config.nlPrompt?.trim() || aiLoading
									}
									onClick={() =>
										handleAiGenerate(config.nlPrompt ?? "")
									}
									className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-[11px] text-primary-foreground transition-opacity disabled:opacity-50"
								>
									{aiLoading ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<Sparkles className="h-3 w-3" />
									)}
									Generate
								</button>
								<button
									type="button"
									onClick={() => setShowAiPrompt(false)}
									className="text-[11px] text-muted-foreground hover:text-foreground"
								>
									Cancel
								</button>
							</div>
						</div>
					)}
				</div>
			) : (
				/* Business mode: NL prompt is primary, SQL is a collapsible disclosure */
				<div className="flex flex-col gap-2">
					<div>
						<FieldLabel className="text-xs">
							What data do you need?
						</FieldLabel>
						<Textarea
							value={config.nlPrompt ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									nlPrompt: e.target.value,
								})
							}
							placeholder="e.g. Get all open claims submitted in the last 7 days, showing claim ID, status, and date"
							className="mt-1 resize-none text-sm"
							rows={3}
						/>
					</div>

					{config.engineId && (
						<button
							type="button"
							disabled={!config.nlPrompt?.trim() || aiLoading}
							onClick={() =>
								handleAiGenerate(config.nlPrompt ?? "")
							}
							className="flex items-center gap-1.5 self-start rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs transition-opacity disabled:opacity-50"
						>
							{aiLoading ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Sparkles className="h-3.5 w-3.5" />
							)}
							Generate SQL
						</button>
					)}

					{config.nlPrompt?.trim() &&
						!config.expression &&
						!aiLoading && (
							<p className="text-[11px] text-amber-600 dark:text-amber-400">
								Click "Generate SQL" to prepare this step before
								running.
							</p>
						)}

					{config.expression && (
						<div className="rounded-lg border">
							<button
								type="button"
								onClick={() => setShowSql((p) => !p)}
								className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[11px] text-muted-foreground hover:text-foreground"
							>
								{showSql ? (
									<ChevronDown className="h-3 w-3 shrink-0" />
								) : (
									<ChevronRight className="h-3 w-3 shrink-0" />
								)}
								View SQL
							</button>
							{showSql && (
								<div className="border-t px-3 pt-2 pb-3">
									<BoundInput
										label=""
										value={config.expression}
										placeholder=""
										onChange={(v) =>
											onChange({
												...config,
												expression: v,
											})
										}
										upstreamVars={upstreamVars}
										mono
										minRows={4}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			)}

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
