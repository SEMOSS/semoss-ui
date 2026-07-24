/**
 * QueryParameters — define `{{token}}` parameters for a SQL query.
 *
 * Shared by the main app (NewDashboardPage) and the portal EditMode so the
 * editing experience is 1:1.
 *
 *   • Live-detects `{{token}}` references in the query.
 *   • Flags tokens used in the query that have no parameter defined ("Add").
 *   • Flags parameters that are defined but no longer referenced ("not in query").
 *   • Each parameter is a collapsible row: a compact summary by default, an
 *     editor when expanded — so a long list never feels overwhelming.
 *
 * The parent owns the query textarea, so token insertion is delegated via
 * `onInsertToken`. Parameter state is fully controlled via `parameters`/`onChange`.
 */
import {
	AlertTriangle,
	ChevronDown,
	Database,
	Loader2,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox, Input, Select } from "@/components/ui";
import { escapeSqlForPixel } from "@/lib/pixel";
import { ParamControl } from "./ParamControl";

export interface QueryParam {
	id: string;
	name: string;
	label: string;
	defaultValue: string;
	inputType?: "text" | "dropdown" | "multiselect" | "date";
	required?: boolean;
	options?: string[];
	optionsQuery?: string;
	optionsDatabaseId?: string;
}

interface Props {
	query: string;
	parameters: QueryParam[];
	onChange: (next: QueryParam[]) => void;
	/** Insert `{{name}}` at the query cursor (parent owns the textarea). */
	onInsertToken: (name: string) => void;
	/** Database the query runs against — used as the default for SQL-sourced options. */
	databaseId?: string;
	/** All databases the user can query — for picking the SQL-options source. */
	databases?: { id: string; label: string }[];
	/** Runs a pixel and returns the output (used to preview SQL-sourced options). */
	runPixel?: (pixel: string) => Promise<any>;
}

const TYPE_LABEL: Record<NonNullable<QueryParam["inputType"]>, string> = {
	text: "Text",
	dropdown: "Dropdown",
	multiselect: "Multi-select",
	date: "Date",
};

/** Pull the distinct first-column values out of a SEMOSS query result. */
function firstColumn(output: any): string[] {
	const values =
		output?.data?.values ??
		output?.values ??
		(Array.isArray(output?.data) ? output.data : []);
	if (!Array.isArray(values)) return [];
	const out: string[] = [];
	const seen = new Set<string>();
	for (const row of values) {
		const v = Array.isArray(row) ? row[0] : row;
		const s = v == null ? "" : String(v);
		if (s && !seen.has(s)) {
			seen.add(s);
			out.push(s);
		}
	}
	return out;
}

// Matches the exact form the query resolver replaces: `{{name}}` (no inner spaces).
const TOKEN_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g;

/** Unique `{{token}}` names in the query, in first-seen order. */
export function detectTokens(query: string): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	let m: RegExpExecArray | null;
	TOKEN_RE.lastIndex = 0;
	while ((m = TOKEN_RE.exec(query)) !== null) {
		if (!seen.has(m[1])) {
			seen.add(m[1]);
			out.push(m[1]);
		}
	}
	return out;
}

const newId = () =>
	typeof crypto !== "undefined" && crypto.randomUUID
		? crypto.randomUUID()
		: `p_${Math.random().toString(36).slice(2)}`;

const FIELD =
	"w-full px-2.5 py-1.5 text-[13px] border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";

export function QueryParameters({
	query,
	parameters,
	onChange,
	onInsertToken,
	databaseId,
	databases,
	runPixel,
}: Props) {
	const tokens = detectTokens(query);
	const tokenSet = new Set(tokens);
	const definedNames = new Set(parameters.map((p) => p.name).filter(Boolean));
	const undefinedTokens = tokens.filter((t) => !definedNames.has(t));

	// Accordion: only one parameter is open at a time, so a long list stays readable.
	const [openId, setOpenId] = useState<string | null>(
		parameters.length === 1 ? parameters[0].id : null,
	);
	const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

	// Per-parameter SQL-options preview, lifted so the default-value picker can see it.
	const [sqlPreviews, setSqlPreviews] = useState<Record<string, string[]>>(
		{},
	);
	const setPreviewFor = (id: string, vals: string[] | null) =>
		setSqlPreviews((prev) => {
			if (vals == null) {
				if (!(id in prev)) return prev;
				const { [id]: _drop, ...rest } = prev;
				return rest;
			}
			return { ...prev, [id]: vals };
		});

	const addParam = (name = "") => {
		const id = newId();
		onChange([...parameters, { id, name, label: name, defaultValue: "" }]);
		setOpenId(id);
	};

	const addAllUndefined = () => {
		const next = undefinedTokens.map((name) => ({
			id: newId(),
			name,
			label: name,
			defaultValue: "",
		}));
		onChange([...parameters, ...next]);
		setOpenId(next[0]?.id ?? null);
	};

	const updateParam = (id: string, patch: Partial<QueryParam>) =>
		onChange(parameters.map((p) => (p.id === id ? { ...p, ...patch } : p)));

	const removeParam = (id: string) =>
		onChange(parameters.filter((p) => p.id !== id));

	return (
		<div className="space-y-3">
			{/* Undefined-token detector */}
			{undefinedTokens.length > 0 && (
				<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
					<AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
					<p className="min-w-0 flex-1 text-[12px] text-amber-700 leading-snug">
						Your query uses{" "}
						{undefinedTokens.map((t, i) => (
							<span key={t}>
								<code className="rounded bg-amber-100 px-1 font-mono">{`{{${t}}}`}</code>
								{i < undefinedTokens.length - 1 ? ", " : ""}
							</span>
						))}{" "}
						with no parameter defined.
					</p>
					<button
						type="button"
						onClick={addAllUndefined}
						className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-1 font-semibold text-[12px] text-amber-800 hover:bg-amber-200"
					>
						<Plus className="h-3.5 w-3.5" /> Define{" "}
						{undefinedTokens.length > 1 ? "all" : ""}
					</button>
				</div>
			)}

			{parameters.length === 0 ? (
				<div className="rounded-xl border border-stone-200 border-dashed bg-stone-50/50 px-6 py-8 text-center">
					<p className="text-[13px] text-stone-500">
						No parameters yet. Add one to make your query dynamic —
						reference it as{" "}
						<code className="rounded bg-stone-100 px-1 font-mono text-indigo-500">
							{"{{name}}"}
						</code>{" "}
						in the SQL.
					</p>
					<button
						type="button"
						onClick={() => addParam()}
						className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-[13px] text-white hover:bg-indigo-700"
					>
						<Plus className="h-4 w-4" /> Add parameter
					</button>
				</div>
			) : (
				<div className="space-y-2.5">
					{parameters.map((param, idx) => {
						const inUse =
							param.name !== "" && tokenSet.has(param.name);
						const isOpen = openId === param.id;
						const typeLabel = TYPE_LABEL[param.inputType ?? "text"];
						const inputType = param.inputType ?? "text";
						const sqlOptions = sqlPreviews[param.id] ?? [];
						const manualOptions = param.options ?? [];
						const mergedOptions = Array.from(
							new Set([...sqlOptions, ...manualOptions]),
						);
						const needsOptions =
							inputType === "dropdown" ||
							inputType === "multiselect";
						const hasOptionsSource =
							mergedOptions.length > 0 || !!param.optionsQuery;
						return (
							<div
								key={param.id}
								className={`overflow-hidden rounded-xl border bg-white transition-colors ${isOpen ? "border-indigo-300 shadow-soft ring-1 ring-indigo-100" : "border-stone-200"}`}
							>
								{/* ── Summary / header row ── */}
								<div
									className={`flex items-center gap-2 px-2.5 py-2 transition-colors ${isOpen ? "border-indigo-100 border-b bg-indigo-50/60" : "hover:bg-stone-50"}`}
								>
									<button
										type="button"
										onClick={() => toggle(param.id)}
										className="flex min-w-0 flex-1 items-center gap-2 text-left"
									>
										<span
											className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-md font-bold text-[11px] tabular-nums ${isOpen ? "bg-indigo-600 text-white" : "bg-stone-100 text-stone-500"}`}
										>
											{idx + 1}
										</span>
										<ChevronDown
											className={`h-4 w-4 flex-shrink-0 text-stone-400 transition-transform ${isOpen ? "" : "-rotate-90"}`}
										/>
										<code className="flex-shrink-0 rounded bg-stone-100 px-1.5 py-0.5 font-mono font-semibold text-[12px] text-stone-700">
											{param.name
												? `{{${param.name}}}`
												: "unnamed"}
										</code>
										<span className="flex-shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-[11px] text-indigo-600">
											{typeLabel}
										</span>
										<span
											className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${inUse ? "bg-emerald-500" : param.name ? "bg-amber-400" : "bg-stone-300"}`}
											title={
												inUse
													? "Referenced in query"
													: param.name
														? "Not referenced in the query"
														: "Unnamed"
											}
										/>
										{param.required && (
											<span className="flex-shrink-0 font-medium text-[11px] text-rose-500">
												required
											</span>
										)}
										{!isOpen && param.defaultValue && (
											<span className="truncate text-[12px] text-stone-400">
												= {param.defaultValue}
											</span>
										)}
									</button>
									<button
										type="button"
										onClick={() => removeParam(param.id)}
										title="Remove parameter"
										className="flex-shrink-0 rounded-md p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>

								{/* ── Editor (expanded) ── */}
								{isOpen && (
									<div className="space-y-3 px-3 py-3">
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
											<label className="block">
												<span className="mb-1 block font-medium text-[11px] text-stone-500">
													Variable
												</span>
												<div className="flex gap-1">
													<Input
														type="text"
														value={param.name}
														onChange={(e) =>
															updateParam(
																param.id,
																{
																	name: e.target.value.replace(
																		/\s+/g,
																		"_",
																	),
																},
															)
														}
														className={`${FIELD} font-mono`}
														placeholder="param_name"
													/>
													<button
														type="button"
														onClick={() =>
															onInsertToken(
																param.name,
															)
														}
														disabled={!param.name}
														title={`Insert {{${param.name || "name"}}} into the query`}
														className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-2 font-mono text-[11px] text-indigo-600 hover:bg-indigo-100 disabled:opacity-40"
													>
														{"{{}}"}
													</button>
												</div>
											</label>
											<label className="block">
												<span className="mb-1 block font-medium text-[11px] text-stone-500">
													Label
												</span>
												<Input
													type="text"
													value={param.label}
													onChange={(e) =>
														updateParam(param.id, {
															label: e.target
																.value,
														})
													}
													className={FIELD}
													placeholder="Display label"
												/>
											</label>
											<label className="block">
												<span className="mb-1 block font-medium text-[11px] text-stone-500">
													Default value
												</span>
												{inputType === "text" && (
													<Input
														type="text"
														value={
															param.defaultValue
														}
														onChange={(e) =>
															updateParam(
																param.id,
																{
																	defaultValue:
																		e.target
																			.value,
																},
															)
														}
														className={FIELD}
														placeholder="Default value"
													/>
												)}
												{inputType === "date" && (
													<Input
														type="date"
														value={
															param.defaultValue
														}
														onChange={(e) =>
															updateParam(
																param.id,
																{
																	defaultValue:
																		e.target
																			.value,
																},
															)
														}
														className={FIELD}
													/>
												)}
												{needsOptions &&
													(hasOptionsSource ? (
														mergedOptions.length >
														0 ? (
															<ParamControl
																param={{
																	name:
																		param.name ||
																		"value",
																	defaultValue:
																		"",
																	inputType,
																	required: false,
																}}
																value={
																	param.defaultValue
																}
																options={
																	mergedOptions
																}
																onChange={(v) =>
																	updateParam(
																		param.id,
																		{
																			defaultValue:
																				v,
																		},
																	)
																}
																size="sm"
															/>
														) : (
															<div
																className={`${FIELD} cursor-not-allowed bg-stone-50 text-stone-400`}
															>
																Click{" "}
																<span className="font-medium text-stone-500">
																	Load
																</span>{" "}
																below to see
																options
															</div>
														)
													) : (
														<div
															className={`${FIELD} cursor-not-allowed bg-stone-50 text-stone-400`}
														>
															Add options below
															first
														</div>
													))}
											</label>
										</div>

										<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
											<span className="font-medium text-[11px] text-stone-500">
												Input type
											</span>
											<div className="inline-flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5">
												{(
													[
														"text",
														"dropdown",
														"multiselect",
														"date",
													] as const
												).map((v) => (
													<button
														key={v}
														type="button"
														onClick={() => {
															const current =
																param.inputType ??
																"text";
															if (current === v)
																return;
															// Clear default so the user must re-pick a value valid for the new type.
															updateParam(
																param.id,
																{
																	inputType:
																		v,
																	defaultValue:
																		"",
																},
															);
														}}
														className={`rounded-md px-2.5 py-1 font-medium text-[12px] transition-colors ${
															(
																param.inputType ??
																	"text"
															) === v
																? "bg-white text-stone-800 shadow-soft"
																: "text-stone-500 hover:text-stone-700"
														}`}
													>
														{TYPE_LABEL[v]}
													</button>
												))}
											</div>
											<label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-stone-600">
												<Checkbox
													type="checkbox"
													checked={
														param.required ?? false
													}
													onChange={(e) =>
														updateParam(param.id, {
															required:
																e.target
																	.checked ||
																undefined,
														})
													}
													className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
												/>
												Required
											</label>
										</div>

										{param.inputType === "multiselect" && (
											<p className="text-[12px] text-stone-500">
												Use with{" "}
												<code className="rounded bg-stone-100 px-1 font-mono">
													IN (
													{`{{${param.name || "name"}}}`}
													)
												</code>{" "}
												— selected values become a SQL
												list.
											</p>
										)}
										{(param.inputType === "dropdown" ||
											param.inputType ===
												"multiselect") && (
											<DropdownConfig
												param={param}
												databaseId={databaseId}
												databases={databases}
												runPixel={runPixel}
												onPatch={(patch) =>
													updateParam(param.id, patch)
												}
												preview={
													sqlPreviews[param.id] ??
													null
												}
												onPreviewChange={(vals) =>
													setPreviewFor(
														param.id,
														vals,
													)
												}
											/>
										)}
									</div>
								)}
							</div>
						);
					})}

					<button
						type="button"
						onClick={() => addParam()}
						className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-300 border-dashed py-2 font-medium text-[13px] text-stone-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
					>
						<Plus className="h-4 w-4" /> Add parameter
					</button>
				</div>
			)}
		</div>
	);
}

/**
 * Dropdown options editor: pull options from a SQL query (first column) and/or
 * add manual options. At view time the two lists are merged.
 */
function DropdownConfig({
	param,
	databaseId,
	databases,
	runPixel,
	onPatch,
	preview,
	onPreviewChange,
}: {
	param: QueryParam;
	databaseId?: string;
	databases?: { id: string; label: string }[];
	runPixel?: (pixel: string) => Promise<any>;
	onPatch: (patch: Partial<QueryParam>) => void;
	preview: string[] | null;
	onPreviewChange: (vals: string[] | null) => void;
}) {
	const [sql, setSql] = useState(param.optionsQuery ?? "");
	const [manual, setManual] = useState("");
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const manualOptions = param.options ?? [];

	const loadOptions = async () => {
		const db = param.optionsDatabaseId || databaseId;
		if (!runPixel || !db || !sql.trim()) {
			setErr(!db ? "Pick a database first." : "Enter a query.");
			return;
		}
		setLoading(true);
		setErr(null);
		try {
			const out = await runPixel(
				`Database(database=["${db}"]) | Query("${escapeSqlForPixel(sql.trim())}") | Collect(1000);`,
			);
			const vals = firstColumn(out);
			onPreviewChange(vals);
			onPatch({ optionsQuery: sql.trim(), optionsDatabaseId: db });
		} catch (e: any) {
			setErr(String(e?.message ?? e ?? "Query failed."));
			onPreviewChange(null);
		} finally {
			setLoading(false);
		}
	};

	// Auto-load saved SQL options once on mount so the default-value picker can use them.
	useEffect(() => {
		if (
			preview == null &&
			param.optionsQuery &&
			(param.optionsDatabaseId || databaseId) &&
			runPixel &&
			!loading
		) {
			void loadOptions();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const addManual = () => {
		const v = manual.trim();
		if (!v || manualOptions.includes(v)) {
			setManual("");
			return;
		}
		onPatch({ options: [...manualOptions, v] });
		setManual("");
	};

	const dirty = sql.trim() !== "" && param.optionsQuery !== sql.trim();

	return (
		<div className="space-y-3 rounded-lg border border-stone-200 bg-white p-3">
			{/* SQL-sourced options */}
			<div className="space-y-1.5">
				<div className="flex items-center gap-1.5 font-medium text-[11px] text-stone-500">
					<Database className="h-3.5 w-3.5" /> Options from a query
					(first column)
				</div>
				<div className="flex flex-col gap-1.5 sm:flex-row">
					{databases && databases.length > 0 && (
						<Select
							value={param.optionsDatabaseId ?? databaseId ?? ""}
							onChange={(e) => {
								onPatch({ optionsDatabaseId: e.target.value });
								onPreviewChange(null);
								setErr(null);
							}}
							aria-label="Database to query for options"
							className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-44"
						>
							<option value="">
								{databaseId
									? "Same as visualization"
									: "Select a database…"}
							</option>
							{databases.map((d) => (
								<option key={d.id} value={d.id}>
									{d.label}
								</option>
							))}
						</Select>
					)}
					<Input
						value={sql}
						onChange={(e) => setSql(e.target.value)}
						placeholder="SELECT DISTINCT region FROM sales ORDER BY region"
						className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 font-mono text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					/>
					<button
						type="button"
						onClick={() => void loadOptions()}
						disabled={loading || !sql.trim()}
						className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-[12px] text-white hover:bg-indigo-700 disabled:opacity-40"
					>
						{loading ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Database className="h-3.5 w-3.5" />
						)}{" "}
						Load
					</button>
				</div>
				{err && <p className="text-[12px] text-red-500">{err}</p>}
				{!err && dirty && (
					<p className="text-[11px] text-amber-500">
						Click Load to save these options.
					</p>
				)}
				{!err && !dirty && preview && (
					<p className="text-[12px] text-stone-500">
						{preview.length} option{preview.length !== 1 ? "s" : ""}{" "}
						loaded
						{preview.length
							? `: ${preview.slice(0, 6).join(", ")}${preview.length > 6 ? "…" : ""}`
							: ""}
					</p>
				)}
				{!err && !dirty && !preview && param.optionsQuery && (
					<p className="text-[12px] text-emerald-600">
						Saved — options load when the dashboard runs.
					</p>
				)}
			</div>

			{/* Manual options (merged with SQL ones) */}
			<div className="space-y-1.5 border-stone-100 border-t pt-3">
				<div className="font-medium text-[11px] text-stone-500">
					Or add options manually
				</div>
				<div className="flex gap-1.5">
					<Input
						value={manual}
						onChange={(e) => setManual(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addManual();
							}
						}}
						placeholder="Type a value, press Enter"
						className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					/>
					<button
						type="button"
						onClick={addManual}
						disabled={!manual.trim()}
						className="shrink-0 rounded-lg border border-stone-200 px-3 font-semibold text-[12px] text-stone-600 hover:bg-stone-50 disabled:opacity-40"
					>
						Add
					</button>
				</div>
				{manualOptions.length > 0 && (
					<div className="flex flex-wrap gap-1.5 pt-0.5">
						{manualOptions.map((o) => (
							<span
								key={o}
								className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[12px] text-stone-700"
							>
								{o}
								<button
									type="button"
									onClick={() =>
										onPatch({
											options: manualOptions.filter(
												(x) => x !== o,
											),
										})
									}
									className="text-stone-400 hover:text-red-500"
								>
									<X className="h-3 w-3" />
								</button>
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
