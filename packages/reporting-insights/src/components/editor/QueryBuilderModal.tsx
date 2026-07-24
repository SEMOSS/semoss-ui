/**
 * QueryBuilderModal — a visual SQL builder (legacy-SEMOSS style) for the create/edit
 * dashboard flow. Pick a database, drag columns from "Available Columns" into
 * "Selected Columns" (grouped by table), alias + aggregate them, add filters (AND/OR),
 * joins across tables, and calculated columns (aggregate / expression / conditional).
 * A live SQL preview updates as you build; "Test" runs it and "Apply" writes the SQL
 * back into the visualization's query.
 *
 * Output is standard, double-quoted ANSI SQL matching the app's SQL rules, so the AI
 * builder, parameter inference, and the portal renderer all keep working on it.
 */

import {
	ChevronDown,
	ChevronRight,
	Code2,
	Columns3,
	Filter as FilterIcon,
	FunctionSquare,
	Minus,
	Play,
	Plus,
	Search,
	Sigma,
	Table2,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Badge,
	Dialog,
	DialogContent,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { Button, buttonClasses, cx, Input, Select } from "@/components/ui";
import { escapeSqlForPixel } from "@/lib/pixel";
import { fetchMetamodel, type TableMeta } from "@/services/aiBuilder";

// ── Aggregations ──────────────────────────────────────────────────────────────
type AggKey =
	| "none"
	| "group"
	| "count"
	| "count_unique"
	| "sum"
	| "avg"
	| "avg_unique"
	| "min"
	| "max"
	| "median"
	| "stddev"
	| "concat";

const AGGREGATIONS: { key: AggKey; label: string }[] = [
	{ key: "none", label: "None" },
	{ key: "group", label: "Group" },
	{ key: "sum", label: "Sum" },
	{ key: "avg", label: "Average" },
	{ key: "avg_unique", label: "Average (Unique)" },
	{ key: "count", label: "Count" },
	{ key: "count_unique", label: "Count (Unique)" },
	{ key: "min", label: "Min" },
	{ key: "max", label: "Max" },
	{ key: "median", label: "Median" },
	{ key: "stddev", label: "Standard Deviation" },
	{ key: "concat", label: "Concat" },
];
const REAL_AGGS = new Set<AggKey>([
	"sum",
	"avg",
	"avg_unique",
	"count",
	"count_unique",
	"min",
	"max",
	"median",
	"stddev",
	"concat",
]);

const OPERATORS = [
	{ key: "=", label: "=" },
	{ key: "!=", label: "≠" },
	{ key: ">", label: ">" },
	{ key: ">=", label: "≥" },
	{ key: "<", label: "<" },
	{ key: "<=", label: "≤" },
	{ key: "LIKE", label: "contains" },
	{ key: "STARTS", label: "starts with" },
	{ key: "ENDS", label: "ends with" },
	{ key: "IN", label: "in (a,b,c)" },
] as const;

const EXPR_OPS = ["+", "-", "*", "/", "||"] as const;

// ── Data shapes ───────────────────────────────────────────────────────────────
interface SelectedCol {
	id: string;
	table: string;
	column: string;
	alias: string;
	agg: AggKey;
}
interface FilterRow {
	id: string;
	table: string;
	column: string;
	op: string;
	value: string;
	connector: "AND" | "OR";
}
interface JoinRow {
	id: string;
	type: "INNER" | "LEFT" | "RIGHT";
	leftTable: string;
	leftCol: string;
	rightTable: string;
	rightCol: string;
}

type Operand =
	| { kind: "column"; table: string; column: string }
	| { kind: "number"; value: string }
	| { kind: "text"; value: string };
interface ExprTerm {
	id: string;
	operand: Operand;
	operator: (typeof EXPR_OPS)[number];
}
type CalcMode = "aggregate" | "expression" | "condition";
interface CalcCol {
	id: string;
	name: string;
	mode: CalcMode;
	// aggregate
	aggTable: string;
	aggCol: string;
	agg: AggKey;
	// expression
	terms: ExprTerm[];
	// condition (CASE WHEN)
	whenTable: string;
	whenCol: string;
	whenOp: string;
	whenValue: string;
	thenOperand: Operand;
	elseOperand: Operand;
}

export interface QueryBuilderModalProps {
	open: boolean;
	onClose: () => void;
	databaseId: string;
	databaseName: string;
	databases: { id: string; label: string }[];
	runPixel: (pixel: string) => Promise<any>;
	onApply: (sql: string, dbId: string, dbName: string) => void;
}

/** Column reference. Identifiers are emitted UNQUOTED (SEMOSS frame queries reject
 *  quoted identifiers here). Single-table queries use the bare column name; only
 *  qualify (table.column) when joins/multiple tables make it necessary. */
type Ref = (t: string, c: string) => string;
const q: Ref = (t, c) => `${t}.${c}`;
const unq: Ref = (_t, c) => c;
const lit = (s: string) => `'${(s ?? "").replace(/'/g, "''")}'`;
const uid = () => Math.random().toString(36).slice(2, 10);

function autoAlias(agg: AggKey, column: string): string {
	const label = AGGREGATIONS.find((a) => a.key === agg)?.label ?? agg;
	return `${label}_${column}`
		.replace(/[^a-z0-9]+/gi, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");
}

function aggExpr(agg: AggKey, base: string): string {
	switch (agg) {
		case "count":
			return `COUNT(${base})`;
		case "count_unique":
			return `COUNT(DISTINCT ${base})`;
		case "sum":
			return `SUM(${base})`;
		case "avg":
			return `AVG(${base})`;
		case "avg_unique":
			return `AVG(DISTINCT ${base})`;
		case "min":
			return `MIN(${base})`;
		case "max":
			return `MAX(${base})`;
		case "median":
			return `MEDIAN(${base})`;
		case "stddev":
			return `STDDEV(${base})`;
		case "concat":
			return `GROUP_CONCAT(${base})`;
		default:
			return base;
	}
}

function operandSql(o: Operand, ref: Ref): string {
	if (o.kind === "column")
		return o.table && o.column ? ref(o.table, o.column) : "";
	if (o.kind === "number") return o.value.trim() === "" ? "" : o.value.trim();
	return o.value.trim() === "" ? "" : lit(o.value);
}

function calcSql(c: CalcCol, ref: Ref = unq): string {
	if (c.mode === "aggregate") {
		if (!c.aggTable || !c.aggCol) return "";
		return aggExpr(c.agg, ref(c.aggTable, c.aggCol));
	}
	if (c.mode === "expression") {
		const parts: string[] = [];
		c.terms.forEach((t, i) => {
			const s = operandSql(t.operand, ref);
			if (!s) return;
			if (i > 0 && parts.length) parts.push(t.operator);
			parts.push(s);
		});
		return parts.join(" ");
	}
	// condition
	if (!c.whenTable || !c.whenCol) return "";
	const cond = `${ref(c.whenTable, c.whenCol)} ${c.whenOp} ${(() => {
		const v = c.whenValue.trim();
		const numeric = v !== "" && !Number.isNaN(Number(v));
		return numeric ? v : lit(v);
	})()}`;
	const thenS = operandSql(c.thenOperand, ref) || "''";
	const elseS = operandSql(c.elseOperand, ref) || "''";
	return `CASE WHEN ${cond} THEN ${thenS} ELSE ${elseS} END`;
}

/** Tables a calculation references (so they're included in FROM even with no plain columns). */
function calcTables(c: CalcCol): string[] {
	const out: string[] = [];
	const addOp = (o: Operand) => {
		if (o.kind === "column" && o.table) out.push(o.table);
	};
	if (c.mode === "aggregate") {
		if (c.aggTable && c.aggCol) out.push(c.aggTable);
	} else if (c.mode === "expression") {
		c.terms.forEach((t) => addOp(t.operand));
	} else {
		if (c.whenTable && c.whenCol) out.push(c.whenTable);
		addOp(c.thenOperand);
		addOp(c.elseOperand);
	}
	return out;
}

/** True when a join row is complete and cross-table (self-joins produce ambiguous SQL). */
function isValidJoin(j: JoinRow): boolean {
	return (
		!!j.leftTable &&
		!!j.rightTable &&
		!!j.leftCol &&
		!!j.rightCol &&
		j.leftTable !== j.rightTable
	);
}

function filterClause(f: FilterRow, ref: Ref): string {
	const col = ref(f.table, f.column);
	const v = f.value.trim();
	switch (f.op) {
		case "LIKE":
			return `${col} LIKE ${lit(`%${v}%`)}`;
		case "STARTS":
			return `${col} LIKE ${lit(`${v}%`)}`;
		case "ENDS":
			return `${col} LIKE ${lit(`%${v}`)}`;
		case "IN": {
			const items = v
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
				.map(lit)
				.join(", ");
			return `${col} IN (${items || "''"})`;
		}
		default: {
			const numeric = v !== "" && !Number.isNaN(Number(v));
			return `${col} ${f.op} ${numeric ? v : lit(v)}`;
		}
	}
}

// ── Column-type → badge color ─────────────────────────────────────────────────
function typeTone(type: string): string {
	const t = (type || "").toUpperCase();
	if (/(INT|DOUBLE|DECIMAL|FLOAT|NUMBER|NUMERIC|LONG)/.test(t))
		return "bg-emerald-50 text-emerald-700 border-emerald-200";
	if (/(DATE|TIME)/.test(t))
		return "bg-violet-50 text-violet-700 border-violet-200";
	if (/(BOOL)/.test(t)) return "bg-amber-50 text-amber-700 border-amber-200";
	return "bg-sky-50 text-sky-700 border-sky-200";
}

export function QueryBuilderModal({
	open,
	onClose,
	databaseId,
	databaseName,
	databases,
	runPixel,
	onApply,
}: QueryBuilderModalProps) {
	const [dbId, setDbId] = useState(databaseId);
	const [dbName, setDbName] = useState(databaseName);
	const [tables, setTables] = useState<TableMeta[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [tab, setTab] = useState("columns");

	const [selected, setSelected] = useState<SelectedCol[]>([]);
	const [filters, setFilters] = useState<FilterRow[]>([]);
	const [joins, setJoins] = useState<JoinRow[]>([]);
	const [calcs, setCalcs] = useState<CalcCol[]>([]);
	const [distinct, setDistinct] = useState(false);
	const [limit, setLimit] = useState("");

	const [running, setRunning] = useState(false);
	const [runResult, setRunResult] = useState<{
		ok: boolean;
		message: string;
	} | null>(null);

	useEffect(() => {
		if (!open) return;
		setDbId(databaseId);
		setDbName(databaseName);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	useEffect(() => {
		if (!open || !dbId) {
			setTables([]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		fetchMetamodel(runPixel, dbId)
			.then((m) => {
				if (cancelled) return;
				setTables(m);
				setExpanded(
					Object.fromEntries(
						m.slice(0, 1).map((t) => [t.table, true]),
					),
				);
			})
			.catch(() => !cancelled && setTables([]))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [open, dbId, runPixel]);

	const addColumn = (table: string, column: string) => {
		setSelected((p) => [
			...p,
			{ id: uid(), table, column, alias: "", agg: "none" },
		]);
		setRunResult(null);
		setTab("columns");
	};

	// Remove the LAST-added instance of a column (a column can be added more than once
	// with different aggregations, e.g. Sum and Average of the same field).
	const removeColumn = (table: string, column: string) => {
		setSelected((p) => {
			for (let i = p.length - 1; i >= 0; i--) {
				if (p[i].table === table && p[i].column === column)
					return p.filter((_, idx) => idx !== i);
			}
			return p;
		});
		setRunResult(null);
	};

	const usedTables = useMemo(() => {
		const s = new Set<string>();
		selected.forEach((c) => s.add(c.table));
		filters.forEach((f) => f.table && s.add(f.table));
		calcs.forEach((c) => calcTables(c).forEach((t) => s.add(t)));
		joins.forEach((j) => {
			if (isValidJoin(j)) {
				s.add(j.leftTable);
				s.add(j.rightTable);
			}
		});
		return Array.from(s);
	}, [selected, filters, joins, calcs]);

	const selectedByTable = useMemo(() => {
		const map = new Map<string, SelectedCol[]>();
		for (const c of selected) {
			if (!map.has(c.table)) map.set(c.table, []);
			map.get(c.table)!.push(c);
		}
		return Array.from(map.entries());
	}, [selected]);

	const selectedKeys = useMemo(
		() => new Set(selected.map((s) => `${s.table}.${s.column}`)),
		[selected],
	);

	// ── Generate SQL ──────────────────────────────────────────────────────────
	const sql = useMemo(() => {
		// Qualify column names only when >1 table is involved (joins); otherwise SEMOSS
		// frame queries reject "Table"."Column" for a single table.
		const ref: Ref = usedTables.length > 1 ? q : unq;
		const selectParts: string[] = [];
		for (const sc of selected) {
			const expr = aggExpr(sc.agg, ref(sc.table, sc.column));
			const isAgg = REAL_AGGS.has(sc.agg);
			const alias =
				sc.alias.trim() || (isAgg ? autoAlias(sc.agg, sc.column) : "");
			selectParts.push(alias ? `${expr} AS ${alias}` : expr);
		}
		for (const c of calcs) {
			const e = calcSql(c, ref);
			if (c.name.trim() && e)
				selectParts.push(`(${e}) AS ${c.name.trim()}`);
		}
		if (!selectParts.length) return "";

		const fromTable = usedTables[0];
		if (!fromTable) return "";
		let fromClause = fromTable;
		const joined = new Set<string>([fromTable]);
		for (const j of joins) {
			if (!isValidJoin(j)) continue;
			const newTable = joined.has(j.leftTable)
				? j.rightTable
				: j.leftTable;
			fromClause += `\n  ${j.type} JOIN ${newTable} ON ${q(j.leftTable, j.leftCol)} = ${q(j.rightTable, j.rightCol)}`;
			joined.add(newTable);
		}
		for (const t of usedTables.slice(1))
			if (!joined.has(t)) {
				fromClause += `, ${t}`;
				joined.add(t);
			}

		let out = `SELECT ${distinct ? "DISTINCT " : ""}${selectParts.join(", ")}\nFROM ${fromClause}`;

		const wheres = filters.filter(
			(f) =>
				f.table && f.column && (f.value.trim() !== "" || f.op === "IN"),
		);
		if (wheres.length)
			out += `\nWHERE ${wheres.map((f, i) => (i === 0 ? filterClause(f, ref) : `${f.connector} ${filterClause(f, ref)}`)).join(" ")}`;

		if (selected.some((s) => REAL_AGGS.has(s.agg))) {
			const groupCols = selected
				.filter((s) => !REAL_AGGS.has(s.agg))
				.map((s) => q(s.table, s.column));
			if (groupCols.length) out += `\nGROUP BY ${groupCols.join(", ")}`;
		}

		const lim = Number(limit);
		if (limit.trim() && Number.isFinite(lim) && lim > 0)
			out += `\nLIMIT ${Math.floor(lim)}`;
		return out;
	}, [selected, calcs, filters, joins, distinct, limit, usedTables]);

	const runTest = async () => {
		if (!sql || !dbId) return;
		setRunning(true);
		setRunResult(null);
		try {
			// runPixel returns the reactor OUTPUT directly (not the full pixelReturn).
			// A successful Query returns { data: { headers, values } }; an error comes
			// back as a plain string message.
			const out: any = await runPixel(
				`Database(database=["${dbId}"]) | Query("${escapeSqlForPixel(sql)}") | Collect(100);`,
			);
			if (typeof out === "string") {
				setRunResult({ ok: false, message: out });
			} else {
				const headers: string[] =
					out?.data?.headers ?? out?.headers ?? [];
				const rows: number = (out?.data?.values ?? out?.values ?? [])
					.length;
				setRunResult({
					ok: true,
					message: `OK — ${rows} row(s)${headers.length ? ` · ${headers.join(", ")}` : ""}`,
				});
			}
		} catch (e: any) {
			setRunResult({ ok: false, message: String(e?.message ?? e) });
		} finally {
			setRunning(false);
		}
	};

	const filteredTables = useMemo(() => {
		const s = search.trim().toLowerCase();
		if (!s) return tables;
		return tables
			.map((t) => ({
				...t,
				columns: t.columns.filter(
					(c) =>
						c.column.toLowerCase().includes(s) ||
						t.table.toLowerCase().includes(s),
				),
			}))
			.filter(
				(t) => t.columns.length || t.table.toLowerCase().includes(s),
			);
	}, [tables, search]);

	const counts = {
		columns: selected.length,
		filters: filters.length,
		joins: joins.length,
		calcs: calcs.length,
	};

	return (
		<Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
			<DialogContent
				style={{
					width: "min(96vw, 1280px)",
					maxWidth: "none",
					height: "88vh",
				}}
				className="flex flex-col overflow-hidden p-0 sm:max-w-none"
			>
				{/* Header */}
				<div className="flex items-center justify-between gap-4 border-stone-200 border-b px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
							<Table2 className="h-5 w-5" />
						</div>
						<div>
							<h2 className="font-semibold text-[15px] text-stone-800">
								Query Builder
							</h2>
							<p className="text-[12px] text-stone-500">
								Compose SQL visually — columns, aggregations,
								filters, joins & calculations.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-medium text-[12px] text-stone-500">
							Database
						</span>
						<Select
							value={dbId}
							onChange={(e) => {
								const d = databases.find(
									(x) => x.id === e.target.value,
								);
								setDbId(d?.id ?? "");
								setDbName(d?.label ?? "");
								setSelected([]);
								setFilters([]);
								setJoins([]);
								setCalcs([]);
								setRunResult(null);
							}}
							className="w-52 py-1.5 text-[13px]"
						>
							<option value="">Select a database…</option>
							{databases.map((d) => (
								<option key={d.id} value={d.id}>
									{d.label}
								</option>
							))}
						</Select>
					</div>
				</div>

				{/* Body */}
				<div className="flex min-h-0 flex-1">
					{/* Left: available columns */}
					<aside className="flex w-[340px] shrink-0 flex-col border-stone-200 border-r bg-stone-50/60">
						<div className="px-5 pt-4 pb-3">
							<p className="mb-2 font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
								Available Columns
							</p>
							<div className="relative">
								<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-stone-400" />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search tables / columns…"
									className="pl-9 text-[13px]"
								/>
							</div>
						</div>
						<div className="min-h-0 flex-1 overflow-auto px-3 pb-4">
							{!dbId && (
								<p className="px-3 py-6 text-center text-[13px] text-stone-400">
									Select a database to browse its tables.
								</p>
							)}
							{dbId && loading && (
								<p className="px-3 py-6 text-center text-[13px] text-stone-400">
									Loading schema…
								</p>
							)}
							{dbId && !loading && !filteredTables.length && (
								<p className="px-3 py-6 text-center text-[13px] text-stone-400">
									No matches.
								</p>
							)}
							{filteredTables.map((t) => {
								const isOpen = expanded[t.table] ?? false;
								return (
									<div
										key={t.table}
										className="mb-2 overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm"
									>
										<button
											onClick={() =>
												setExpanded((p) => ({
													...p,
													[t.table]: !isOpen,
												}))
											}
											className="flex w-full items-center gap-2 border-indigo-200 border-b bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2.5 text-left font-semibold text-[13px] text-white"
										>
											{isOpen ? (
												<ChevronDown className="h-4 w-4 text-white/80" />
											) : (
												<ChevronRight className="h-4 w-4 text-white/80" />
											)}
											<Table2 className="h-3.5 w-3.5 text-white/90" />
											<span className="truncate">
												{t.table}
											</span>
											<span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 font-semibold text-[10px] text-white">
												{t.columns.length}
											</span>
										</button>
										{isOpen && (
											<div className="border-stone-100 border-t">
												{t.columns.map((c) => {
													const added =
														selectedKeys.has(
															`${t.table}.${c.column}`,
														);
													return (
														<div
															key={c.column}
															className={cx(
																"group flex w-full items-center gap-2 px-3 py-2 text-[13px] text-stone-600",
																added &&
																	"bg-indigo-50/40",
															)}
														>
															<span className="truncate">
																{c.column}
															</span>
															{c.type && (
																<span
																	className={cx(
																		"ml-auto rounded border px-1.5 py-0.5 font-semibold text-[9px] uppercase",
																		typeTone(
																			c.type,
																		),
																	)}
																>
																	{c.type}
																</span>
															)}
															<div
																className={cx(
																	"flex items-center gap-0.5",
																	!c.type &&
																		"ml-auto",
																)}
															>
																<button
																	type="button"
																	onClick={() =>
																		removeColumn(
																			t.table,
																			c.column,
																		)
																	}
																	disabled={
																		!added
																	}
																	title="Remove from selected"
																	className="rounded-md p-1 text-stone-300 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-300"
																>
																	<Minus className="h-3.5 w-3.5" />
																</button>
																<button
																	type="button"
																	onClick={() =>
																		addColumn(
																			t.table,
																			c.column,
																		)
																	}
																	title="Add to selected"
																	className="rounded-md p-1 text-stone-400 hover:bg-indigo-100 hover:text-indigo-600"
																>
																	<Plus className="h-3.5 w-3.5" />
																</button>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</aside>

					{/* Right: tabbed builder */}
					<div className="flex min-w-0 flex-1 flex-col">
						<Tabs
							value={tab}
							onValueChange={setTab}
							className="flex min-h-0 flex-1 flex-col"
						>
							<div className="px-6 pt-4">
								<TabsList className="w-full justify-start">
									<TabsTrigger
										value="columns"
										className="gap-1.5"
									>
										<Columns3 className="h-3.5 w-3.5" />{" "}
										Columns{" "}
										{counts.columns > 0 && (
											<Badge
												variant="secondary"
												className="ml-1 rounded-full text-[10px]"
											>
												{counts.columns}
											</Badge>
										)}
									</TabsTrigger>
									<TabsTrigger
										value="filters"
										className="gap-1.5"
									>
										<FilterIcon className="h-3.5 w-3.5" />{" "}
										Filters{" "}
										{counts.filters > 0 && (
											<Badge
												variant="secondary"
												className="ml-1 rounded-full text-[10px]"
											>
												{counts.filters}
											</Badge>
										)}
									</TabsTrigger>
									<TabsTrigger
										value="joins"
										className="gap-1.5"
									>
										<Sigma className="h-3.5 w-3.5" /> Joins{" "}
										{counts.joins > 0 && (
											<Badge
												variant="secondary"
												className="ml-1 rounded-full text-[10px]"
											>
												{counts.joins}
											</Badge>
										)}
									</TabsTrigger>
									<TabsTrigger
										value="calcs"
										className="gap-1.5"
									>
										<FunctionSquare className="h-3.5 w-3.5" />{" "}
										Calculations{" "}
										{counts.calcs > 0 && (
											<Badge
												variant="secondary"
												className="ml-1 rounded-full text-[10px]"
											>
												{counts.calcs}
											</Badge>
										)}
									</TabsTrigger>
								</TabsList>
							</div>

							<div className="min-h-0 flex-1 overflow-auto px-6 py-4">
								{/* Columns */}
								<TabsContent
									value="columns"
									className="mt-0 space-y-4"
								>
									<div className="flex items-center justify-between">
										<p className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
											Selected Columns
										</p>
										<label className="flex items-center gap-2 text-[13px] text-stone-600">
											<input
												type="checkbox"
												checked={distinct}
												onChange={(e) =>
													setDistinct(
														e.target.checked,
													)
												}
												className="h-3.5 w-3.5"
											/>
											Distinct rows
										</label>
									</div>
									{!selected.length && (
										<div className="rounded-xl border border-stone-300 border-dashed px-6 py-10 text-center">
											<p className="text-[13px] text-stone-400">
												Add columns from the left with{" "}
												<Plus className="inline h-3.5 w-3.5" />{" "}
												— they’ll appear here grouped by
												table.
											</p>
										</div>
									)}
									{selectedByTable.map(([table, cols]) => (
										<div
											key={table}
											className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
										>
											<div className="flex items-center gap-2 border-stone-100 border-b bg-stone-50 px-4 py-2.5">
												<Table2 className="h-3.5 w-3.5 text-indigo-500" />
												<span className="font-semibold text-[13px] text-stone-700">
													{table}
												</span>
												<Badge
													variant="secondary"
													className="ml-auto rounded-full text-[10px]"
												>
													{cols.length}
												</Badge>
											</div>
											<div className="divide-y divide-stone-100">
												{cols.map((sc) => (
													<div
														key={sc.id}
														className="flex items-center gap-3 px-4 py-2.5"
													>
														<span
															className="w-36 shrink-0 truncate font-medium text-[13px] text-stone-700"
															title={sc.column}
														>
															{sc.column}
														</span>
														<Select
															value={sc.agg}
															onChange={(e) =>
																setSelected(
																	(p) =>
																		p.map(
																			(
																				x,
																			) =>
																				x.id ===
																				sc.id
																					? {
																							...x,
																							agg: e
																								.target
																								.value as AggKey,
																						}
																					: x,
																		),
																)
															}
															className="w-40 py-1.5 text-[12px]"
														>
															{AGGREGATIONS.map(
																(a) => (
																	<option
																		key={
																			a.key
																		}
																		value={
																			a.key
																		}
																	>
																		{
																			a.label
																		}
																	</option>
																),
															)}
														</Select>
														<Input
															value={sc.alias}
															onChange={(e) =>
																setSelected(
																	(p) =>
																		p.map(
																			(
																				x,
																			) =>
																				x.id ===
																				sc.id
																					? {
																							...x,
																							alias: e
																								.target
																								.value,
																						}
																					: x,
																		),
																)
															}
															placeholder={
																REAL_AGGS.has(
																	sc.agg,
																)
																	? autoAlias(
																			sc.agg,
																			sc.column,
																		)
																	: "alias (optional)"
															}
															className="flex-1 py-1.5 text-[12px]"
														/>
														<button
															onClick={() =>
																setSelected(
																	(p) =>
																		p.filter(
																			(
																				x,
																			) =>
																				x.id !==
																				sc.id,
																		),
																)
															}
															className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
															title="Remove"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												))}
											</div>
										</div>
									))}
								</TabsContent>

								{/* Filters */}
								<TabsContent
									value="filters"
									className="mt-0 space-y-3"
								>
									<div className="flex items-center justify-between">
										<p className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
											Filters (WHERE)
										</p>
										<Button
											size="sm"
											variant="secondary"
											onClick={() =>
												setFilters((p) => [
													...p,
													{
														id: uid(),
														table:
															usedTables[0] ??
															tables[0]?.table ??
															"",
														column: "",
														op: "=",
														value: "",
														connector: "AND",
													},
												])
											}
										>
											<Plus className="mr-1 h-3.5 w-3.5" />{" "}
											Add filter
										</Button>
									</div>
									{!filters.length && (
										<p className="rounded-xl border border-stone-300 border-dashed px-6 py-8 text-center text-[13px] text-stone-400">
											No filters — all rows are returned.
										</p>
									)}
									{filters.map((f, i) => (
										<div
											key={f.id}
											className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm"
										>
											{i > 0 ? (
												<Select
													value={f.connector}
													onChange={(e) =>
														setFilters((p) =>
															p.map((x) =>
																x.id === f.id
																	? {
																			...x,
																			connector:
																				e
																					.target
																					.value as
																					| "AND"
																					| "OR",
																		}
																	: x,
															),
														)
													}
													className="w-20 py-1.5 font-semibold text-[12px]"
												>
													<option value="AND">
														AND
													</option>
													<option value="OR">
														OR
													</option>
												</Select>
											) : (
												<span className="w-20 pl-1 font-semibold text-[12px] text-stone-400 uppercase">
													Where
												</span>
											)}
											<ColSelect
												tables={tables}
												table={f.table}
												column={f.column}
												onChange={(t, c) =>
													setFilters((p) =>
														p.map((x) =>
															x.id === f.id
																? {
																		...x,
																		table: t,
																		column: c,
																	}
																: x,
														),
													)
												}
											/>
											<Select
												value={f.op}
												onChange={(e) =>
													setFilters((p) =>
														p.map((x) =>
															x.id === f.id
																? {
																		...x,
																		op: e
																			.target
																			.value,
																	}
																: x,
														),
													)
												}
												className="w-32 py-1.5 text-[12px]"
											>
												{OPERATORS.map((o) => (
													<option
														key={o.key}
														value={o.key}
													>
														{o.label}
													</option>
												))}
											</Select>
											<Input
												value={f.value}
												onChange={(e) =>
													setFilters((p) =>
														p.map((x) =>
															x.id === f.id
																? {
																		...x,
																		value: e
																			.target
																			.value,
																	}
																: x,
														),
													)
												}
												placeholder="value"
												className="flex-1 py-1.5 text-[12px]"
											/>
											<button
												onClick={() =>
													setFilters((p) =>
														p.filter(
															(x) =>
																x.id !== f.id,
														),
													)
												}
												className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									))}
								</TabsContent>

								{/* Joins */}
								<TabsContent
									value="joins"
									className="mt-0 space-y-3"
								>
									<div className="flex items-center justify-between">
										<p className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
											Joins
										</p>
										<Button
											size="sm"
											variant="secondary"
											onClick={() => {
												const leftT =
													usedTables[0] ??
													tables[0]?.table ??
													"";
												const rightT =
													usedTables.find(
														(t) => t !== leftT,
													) ??
													tables.find(
														(t) =>
															t.table !== leftT,
													)?.table ??
													"";
												setJoins((p) => [
													...p,
													{
														id: uid(),
														type: "INNER",
														leftTable: leftT,
														leftCol: "",
														rightTable: rightT,
														rightCol: "",
													},
												]);
											}}
										>
											<Plus className="mr-1 h-3.5 w-3.5" />{" "}
											Add join
										</Button>
									</div>
									{usedTables.length > 1 && !joins.length && (
										<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
											You’ve used {usedTables.length}{" "}
											tables — add a join or they’ll be
											combined with a cross join.
										</div>
									)}
									{!joins.length &&
										usedTables.length <= 1 && (
											<p className="rounded-xl border border-stone-300 border-dashed px-6 py-8 text-center text-[13px] text-stone-400">
												Add columns from more than one
												table to join them.
											</p>
										)}
									{joins.map((j) => {
										const selfJoin =
											!!j.leftTable &&
											j.leftTable === j.rightTable;
										return (
											<div
												key={j.id}
												className={cx(
													"rounded-xl border bg-white px-3 py-2.5 shadow-sm",
													selfJoin
														? "border-amber-300"
														: "border-stone-200",
												)}
											>
												<div className="flex flex-wrap items-center gap-2">
													<Select
														value={j.type}
														onChange={(e) =>
															setJoins((p) =>
																p.map((x) =>
																	x.id ===
																	j.id
																		? {
																				...x,
																				type: e
																					.target
																					.value as JoinRow["type"],
																			}
																		: x,
																),
															)
														}
														className="w-24 py-1.5 text-[12px]"
													>
														<option value="INNER">
															Inner
														</option>
														<option value="LEFT">
															Left
														</option>
														<option value="RIGHT">
															Right
														</option>
													</Select>
													<ColSelect
														tables={tables}
														table={j.leftTable}
														column={j.leftCol}
														onChange={(t, c) =>
															setJoins((p) =>
																p.map((x) =>
																	x.id ===
																	j.id
																		? {
																				...x,
																				leftTable:
																					t,
																				leftCol:
																					c,
																			}
																		: x,
																),
															)
														}
													/>
													<span className="font-semibold text-stone-400">
														=
													</span>
													<ColSelect
														tables={tables}
														table={j.rightTable}
														column={j.rightCol}
														onChange={(t, c) =>
															setJoins((p) =>
																p.map((x) =>
																	x.id ===
																	j.id
																		? {
																				...x,
																				rightTable:
																					t,
																				rightCol:
																					c,
																			}
																		: x,
																),
															)
														}
													/>
													<button
														onClick={() =>
															setJoins((p) =>
																p.filter(
																	(x) =>
																		x.id !==
																		j.id,
																),
															)
														}
														className="ml-auto rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
												{selfJoin && (
													<p className="mt-1.5 text-[12px] text-amber-600">
														Pick two different
														tables — a join between
														a table and itself is
														ignored.
													</p>
												)}
											</div>
										);
									})}
								</TabsContent>

								{/* Calculations */}
								<TabsContent
									value="calcs"
									className="mt-0 space-y-3"
								>
									<div className="flex items-center justify-between">
										<p className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
											Calculated Columns
										</p>
										<Button
											size="sm"
											variant="secondary"
											onClick={() =>
												setCalcs((p) => [
													...p,
													newCalc(
														usedTables[0] ??
															tables[0]?.table ??
															"",
													),
												])
											}
										>
											<Plus className="mr-1 h-3.5 w-3.5" />{" "}
											Add calculation
										</Button>
									</div>
									{!calcs.length && (
										<p className="rounded-xl border border-stone-300 border-dashed px-6 py-8 text-center text-[13px] text-stone-400">
											Build a computed column — an
											aggregate, an arithmetic expression,
											or a conditional (CASE&nbsp;WHEN).
										</p>
									)}
									{calcs.map((c) => (
										<CalcBuilder
											key={c.id}
											calc={c}
											tables={tables}
											onChange={(patch) =>
												setCalcs((p) =>
													p.map((x) =>
														x.id === c.id
															? { ...x, ...patch }
															: x,
													),
												)
											}
											onRemove={() =>
												setCalcs((p) =>
													p.filter(
														(x) => x.id !== c.id,
													),
												)
											}
										/>
									))}
								</TabsContent>
							</div>
						</Tabs>

						{/* SQL preview */}
						<div className="border-stone-200 border-t bg-white">
							<div className="flex items-center justify-between px-6 pt-3 pb-2">
								<div className="flex items-center gap-1.5">
									<Code2 className="h-3.5 w-3.5 text-stone-400" />
									<p className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
										Generated SQL
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Input
										value={limit}
										onChange={(e) =>
											setLimit(
												e.target.value.replace(
													/[^0-9]/g,
													"",
												),
											)
										}
										placeholder="limit"
										className="w-20 py-1 text-[12px]"
									/>
									<button
										onClick={runTest}
										disabled={!sql || running || !dbId}
										className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-[12px] text-stone-600 hover:border-stone-300 hover:bg-stone-50 disabled:opacity-40"
									>
										<Play className="h-3 w-3" />{" "}
										{running ? "Testing…" : "Test query"}
									</button>
								</div>
							</div>
							<div className="px-6 pb-3">
								<pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-[12px] text-stone-700 leading-relaxed">
									{sql || "-- Add columns to build a query"}
								</pre>
								{runResult && (
									<p
										className={cx(
											"mt-1.5 flex items-center gap-1.5 text-[12px]",
											runResult.ok
												? "text-emerald-600"
												: "text-red-600",
										)}
									>
										<span
											className={cx(
												"inline-block h-1.5 w-1.5 rounded-full",
												runResult.ok
													? "bg-emerald-500"
													: "bg-red-500",
											)}
										/>
										{runResult.message}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-2 border-stone-200 border-t px-6 py-4">
					<button
						onClick={onClose}
						className={buttonClasses("secondary", "md")}
					>
						Cancel
					</button>
					<Button
						onClick={() => {
							if (sql) {
								onApply(sql, dbId, dbName);
								onClose();
							}
						}}
						disabled={!sql}
					>
						Apply to query
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function newCalc(table: string): CalcCol {
	return {
		id: uid(),
		name: "",
		mode: "aggregate",
		aggTable: table,
		aggCol: "",
		agg: "sum",
		terms: [
			{
				id: uid(),
				operand: { kind: "column", table, column: "" },
				operator: "+",
			},
		],
		whenTable: table,
		whenCol: "",
		whenOp: "=",
		whenValue: "",
		thenOperand: { kind: "number", value: "1" },
		elseOperand: { kind: "number", value: "0" },
	};
}

// ── Calculation builder (aggregate / expression / condition) ──────────────────
function CalcBuilder({
	calc,
	tables,
	onChange,
	onRemove,
}: {
	calc: CalcCol;
	tables: TableMeta[];
	onChange: (p: Partial<CalcCol>) => void;
	onRemove: () => void;
}) {
	const preview = calcSql(calc);
	return (
		<div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
			<div className="flex items-center gap-2 border-stone-100 border-b bg-stone-50 px-4 py-2.5">
				<FunctionSquare className="h-3.5 w-3.5 text-indigo-500" />
				<Input
					value={calc.name}
					onChange={(e) => onChange({ name: e.target.value })}
					placeholder="Calculated column name"
					className="max-w-xs py-1.5 font-medium text-[13px]"
				/>
				<Select
					value={calc.mode}
					onChange={(e) =>
						onChange({ mode: e.target.value as CalcMode })
					}
					className="ml-auto w-40 py-1.5 text-[12px]"
				>
					<option value="aggregate">Aggregate</option>
					<option value="expression">Expression</option>
					<option value="condition">Conditional (If)</option>
				</Select>
				<button
					onClick={onRemove}
					className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>

			<div className="space-y-2 px-4 py-3">
				{calc.mode === "aggregate" && (
					<div className="flex flex-wrap items-center gap-2 text-[12px]">
						<Select
							value={calc.agg}
							onChange={(e) =>
								onChange({ agg: e.target.value as AggKey })
							}
							className="w-44 py-1.5 text-[12px]"
						>
							{AGGREGATIONS.filter(
								(a) => a.key !== "none" && a.key !== "group",
							).map((a) => (
								<option key={a.key} value={a.key}>
									{a.label}
								</option>
							))}
						</Select>
						<span className="text-stone-400">of</span>
						<ColSelect
							tables={tables}
							table={calc.aggTable}
							column={calc.aggCol}
							onChange={(t, c) =>
								onChange({ aggTable: t, aggCol: c })
							}
						/>
					</div>
				)}

				{calc.mode === "expression" && (
					<div className="space-y-2">
						{calc.terms.map((term, i) => (
							<div
								key={term.id}
								className="flex flex-wrap items-center gap-2 text-[12px]"
							>
								{i > 0 && (
									<Select
										value={term.operator}
										onChange={(e) =>
											onChange({
												terms: calc.terms.map((x) =>
													x.id === term.id
														? {
																...x,
																operator: e
																	.target
																	.value as ExprTerm["operator"],
															}
														: x,
												),
											})
										}
										className="w-16 py-1.5 text-center font-semibold text-[13px]"
									>
										{EXPR_OPS.map((op) => (
											<option key={op} value={op}>
												{op === "||" ? "⋯ concat" : op}
											</option>
										))}
									</Select>
								)}
								<OperandEditor
									tables={tables}
									operand={term.operand}
									onChange={(operand) =>
										onChange({
											terms: calc.terms.map((x) =>
												x.id === term.id
													? { ...x, operand }
													: x,
											),
										})
									}
								/>
								{calc.terms.length > 1 && (
									<button
										onClick={() =>
											onChange({
												terms: calc.terms.filter(
													(x) => x.id !== term.id,
												),
											})
										}
										className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								)}
							</div>
						))}
						<button
							onClick={() =>
								onChange({
									terms: [
										...calc.terms,
										{
											id: uid(),
											operand: {
												kind: "column",
												table: calc.aggTable,
												column: "",
											},
											operator: "+",
										},
									],
								})
							}
							className="font-medium text-[12px] text-indigo-600 hover:text-indigo-700"
						>
							+ Add operand
						</button>
					</div>
				)}

				{calc.mode === "condition" && (
					<div className="space-y-2 text-[12px]">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-semibold text-stone-400 uppercase">
								If
							</span>
							<ColSelect
								tables={tables}
								table={calc.whenTable}
								column={calc.whenCol}
								onChange={(t, c) =>
									onChange({ whenTable: t, whenCol: c })
								}
							/>
							<Select
								value={calc.whenOp}
								onChange={(e) =>
									onChange({ whenOp: e.target.value })
								}
								className="w-28 py-1.5 text-[12px]"
							>
								{OPERATORS.filter(
									(o) =>
										![
											"LIKE",
											"STARTS",
											"ENDS",
											"IN",
										].includes(o.key),
								).map((o) => (
									<option key={o.key} value={o.key}>
										{o.label}
									</option>
								))}
							</Select>
							<Input
								value={calc.whenValue}
								onChange={(e) =>
									onChange({ whenValue: e.target.value })
								}
								placeholder="value"
								className="w-28 py-1.5 text-[12px]"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<span className="w-12 font-semibold text-stone-400 uppercase">
								Then
							</span>
							<OperandEditor
								tables={tables}
								operand={calc.thenOperand}
								onChange={(thenOperand) =>
									onChange({ thenOperand })
								}
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<span className="w-12 font-semibold text-stone-400 uppercase">
								Else
							</span>
							<OperandEditor
								tables={tables}
								operand={calc.elseOperand}
								onChange={(elseOperand) =>
									onChange({ elseOperand })
								}
							/>
						</div>
					</div>
				)}

				<div className="mt-1 rounded-lg bg-stone-50 px-3 py-1.5 font-mono text-[11px] text-stone-500">
					{calc.name.trim() && preview
						? `(${preview}) AS ${calc.name.trim()}`
						: "— incomplete —"}
				</div>
			</div>
		</div>
	);
}

// ── Operand editor (column / number / text) ───────────────────────────────────
function OperandEditor({
	tables,
	operand,
	onChange,
}: {
	tables: TableMeta[];
	operand: Operand;
	onChange: (o: Operand) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<Select
				value={operand.kind}
				onChange={(e) => {
					const kind = e.target.value as Operand["kind"];
					if (kind === "column")
						onChange({
							kind: "column",
							table: tables[0]?.table ?? "",
							column: "",
						});
					else if (kind === "number")
						onChange({ kind: "number", value: "" });
					else onChange({ kind: "text", value: "" });
				}}
				className="w-24 py-1.5 text-[12px]"
			>
				<option value="column">Column</option>
				<option value="number">Number</option>
				<option value="text">Text</option>
			</Select>
			{operand.kind === "column" ? (
				<ColSelect
					tables={tables}
					table={operand.table}
					column={operand.column}
					onChange={(t, c) =>
						onChange({ kind: "column", table: t, column: c })
					}
				/>
			) : (
				<Input
					value={operand.value}
					onChange={(e) =>
						onChange({
							...operand,
							value:
								operand.kind === "number"
									? e.target.value.replace(/[^0-9.-]/g, "")
									: e.target.value,
						})
					}
					placeholder={operand.kind === "number" ? "0" : "text"}
					className="w-40 py-1.5 text-[12px]"
				/>
			)}
		</div>
	);
}

// ── table.column picker ───────────────────────────────────────────────────────
function ColSelect({
	tables,
	table,
	column,
	onChange,
}: {
	tables: TableMeta[];
	table: string;
	column: string;
	onChange: (table: string, column: string) => void;
}) {
	const cols = tables.find((t) => t.table === table)?.columns ?? [];
	return (
		<div className="flex items-center gap-1.5">
			<Select
				value={table}
				onChange={(e) => onChange(e.target.value, "")}
				className="w-32 py-1.5 text-[12px]"
			>
				<option value="">table…</option>
				{tables.map((t) => (
					<option key={t.table} value={t.table}>
						{t.table}
					</option>
				))}
			</Select>
			<Select
				value={column}
				onChange={(e) => onChange(table, e.target.value)}
				className="w-32 py-1.5 text-[12px]"
			>
				<option value="">column…</option>
				{cols.map((c) => (
					<option key={c.column} value={c.column}>
						{c.column}
					</option>
				))}
			</Select>
		</div>
	);
}
