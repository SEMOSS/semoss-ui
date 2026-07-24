/**
 * DataProductModal — build a cross-source "data product": two or more SQL queries
 * (each against its own database) joined into one dataset. Each leg is materialized
 * into an in-memory frame and merged via {@link buildQueryPixel} (Import + Merge),
 * so joins work even across different databases. A live preview shows the joined
 * columns the chart will bind to.
 *
 * Output is written back onto the visualization's shared query as `sources` + `joins`
 * (see DashboardQuery). The single-source `query`/`databaseId` fields are ignored for
 * execution while a data product is active.
 */

import { Database, GitMerge, Loader2, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@semoss/ui/next";
import {
	Button,
	buttonClasses,
	cx,
	Input,
	Select,
	Textarea,
} from "@/components/ui";
import { buildQueryPixel, resolveLegColumns } from "@/lib/queryPixel";

export interface DPLeg {
	id: string;
	alias: string;
	databaseId: string;
	databaseName: string;
	query: string;
}
export interface DPJoin {
	id: string;
	leftAlias: string;
	leftColumn: string;
	rightAlias: string;
	rightColumn: string;
	type: "inner" | "left" | "right";
}

interface LegPreview {
	headers?: string[];
	rows?: unknown[][];
	error?: string;
	loading?: boolean;
}

interface Props {
	open: boolean;
	onClose: () => void;
	databases: { id: string; label: string }[];
	runPixel: (pixel: string) => Promise<any>;
	value: { sources?: DPLeg[]; joins?: DPJoin[] };
	onApply: (sources: DPLeg[], joins: DPJoin[]) => void;
}

const uid = () =>
	crypto?.randomUUID
		? crypto.randomUUID()
		: `id-${Math.random().toString(36).slice(2)}`;
const JOIN_LABELS: { value: DPJoin["type"]; label: string }[] = [
	{ value: "inner", label: "Inner (matches only)" },
	{ value: "left", label: "Left (keep left rows)" },
	{ value: "right", label: "Right (keep right rows)" },
];

function makeLeg(i: number): DPLeg {
	return {
		id: uid(),
		alias: `s${i}`,
		databaseId: "",
		databaseName: "",
		query: "",
	};
}

export function DataProductModal({
	open,
	onClose,
	databases,
	runPixel,
	value,
	onApply,
}: Props) {
	const [legs, setLegs] = useState<DPLeg[]>([]);
	const [joins, setJoins] = useState<DPJoin[]>([]);
	const [legPreview, setLegPreview] = useState<Record<string, LegPreview>>(
		{},
	);
	const [joined, setJoined] = useState<LegPreview | null>(null);

	// Silently load a leg's output columns (a 1-row sample) so the join column pickers
	// are populated dropdowns. No spinner/rows — just headers.
	const loadLegColumns = async (leg: DPLeg) => {
		if (!leg.databaseId || !leg.query.trim()) return;
		try {
			const out = await runPixel(
				buildQueryPixel(
					{ databaseId: leg.databaseId, query: leg.query },
					{ collect: 1 },
				),
			);
			const hs: string[] = out?.data?.headers ?? out?.headers ?? [];
			if (hs.length)
				setLegPreview((p) => ({
					...p,
					[leg.id]: { ...p[leg.id], headers: hs },
				}));
		} catch {
			/* ignore — the picker falls back to free text until the SQL is valid */
		}
	};

	// Seed from the current query whenever the modal opens, and pre-load columns for
	// any seeded leg so joins start with real column dropdowns.
	useEffect(() => {
		if (!open) return;
		const seedLegs = value.sources?.length
			? value.sources.map((l) => ({ ...l }))
			: [makeLeg(1), makeLeg(2)];
		setLegs(seedLegs);
		setJoins((value.joins ?? []).map((j) => ({ ...j })));
		setLegPreview({});
		setJoined(null);
		seedLegs.forEach((l) => void loadLegColumns(l));
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	const headersFor = (alias: string): string[] => {
		const leg = legs.find((l) => l.alias === alias);
		return (leg && legPreview[leg.id]?.headers) || [];
	};

	// A column field for a join: a dropdown of that leg's previewed headers, or a
	// free-text input when the leg hasn't been previewed yet. Rendered as a call (not
	// a nested component) so the input keeps focus while typing.
	const colField = (
		alias: string,
		col: string,
		onCol: (v: string) => void,
	) => {
		const opts = headersFor(alias);
		return opts.length ? (
			<Select
				value={col}
				onChange={(e) => onCol(e.target.value)}
				className="w-40 py-1 text-xs"
			>
				<option value="">column…</option>
				{opts.map((h) => (
					<option key={h} value={h}>
						{h}
					</option>
				))}
			</Select>
		) : (
			<Input
				value={col}
				onChange={(e) => onCol(e.target.value)}
				placeholder="column"
				className="w-40 py-1 text-xs"
			/>
		);
	};

	const updateLeg = (id: string, patch: Partial<DPLeg>) =>
		setLegs((prev) =>
			prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
		);

	const addLeg = () => setLegs((prev) => [...prev, makeLeg(prev.length + 1)]);
	const removeLeg = (id: string) => {
		setLegs((prev) => prev.filter((l) => l.id !== id));
		const alias = legs.find((l) => l.id === id)?.alias;
		if (alias)
			setJoins((prev) =>
				prev.filter(
					(j) => j.leftAlias !== alias && j.rightAlias !== alias,
				),
			);
	};

	const addJoin = () =>
		setJoins((prev) => [
			...prev,
			{
				id: uid(),
				leftAlias: legs[0]?.alias ?? "",
				leftColumn: "",
				rightAlias:
					legs[prev.length + 1]?.alias ?? legs[1]?.alias ?? "",
				rightColumn: "",
				type: "inner",
			},
		]);
	const updateJoin = (id: string, patch: Partial<DPJoin>) =>
		setJoins((prev) =>
			prev.map((j) => (j.id === id ? { ...j, ...patch } : j)),
		);
	const removeJoin = (id: string) =>
		setJoins((prev) => prev.filter((j) => j.id !== id));

	const previewLeg = async (leg: DPLeg) => {
		if (!leg.databaseId || !leg.query.trim()) return;
		setLegPreview((p) => ({
			...p,
			[leg.id]: { ...p[leg.id], loading: true, error: undefined },
		}));
		try {
			const pixel = buildQueryPixel(
				{ databaseId: leg.databaseId, query: leg.query },
				{ collect: 20 },
			);
			const out = await runPixel(pixel);
			const headers: string[] = out?.data?.headers ?? out?.headers ?? [];
			const rows: unknown[][] = out?.data?.values ?? out?.values ?? [];
			setLegPreview((p) => ({
				...p,
				[leg.id]: { headers, rows, loading: false },
			}));
		} catch (e: any) {
			setLegPreview((p) => ({
				...p,
				[leg.id]: { loading: false, error: String(e?.message ?? e) },
			}));
		}
	};

	const validLegs = useMemo(
		() => legs.filter((l) => l.databaseId && l.query.trim()),
		[legs],
	);
	const canApply =
		validLegs.length >= 2 &&
		new Set(legs.map((l) => l.alias.trim())).size === legs.length;

	// Ensure we know each leg's output columns (needed to alias reserved-word columns
	// like `Group` that would otherwise break SEMOSS's merge). Fetches a 1-row sample
	// for any leg that hasn't been previewed yet.
	const collectHeaders = async (): Promise<Record<string, string[]>> => {
		const map: Record<string, string[]> = {};
		await Promise.all(
			legs.map(async (leg) => {
				let hs = legPreview[leg.id]?.headers;
				if (!hs && leg.databaseId && leg.query.trim()) {
					try {
						const out = await runPixel(
							buildQueryPixel(
								{
									databaseId: leg.databaseId,
									query: leg.query,
								},
								{ collect: 1 },
							),
						);
						hs = out?.data?.headers ?? out?.headers ?? [];
						setLegPreview((p) => ({
							...p,
							[leg.id]: { ...p[leg.id], headers: hs },
						}));
					} catch {
						hs = [];
					}
				}
				map[leg.alias] = hs ?? [];
			}),
		);
		return map;
	};

	// Wrap each leg's SQL so (a) columns shared across legs get alias-prefixed (so the
	// merge keeps both sides instead of colliding) and (b) reserved/non-identifier
	// columns get safe aliases; then remap join columns to the resolved names. Frames
	// then carry unique, merge-safe column names.
	const resolveForRun = (headersByAlias: Record<string, string[]>) => {
		const { sqlByAlias, renameByAlias } = resolveLegColumns(
			legs,
			headersByAlias,
		);
		const outLegs = legs.map((leg) => ({
			...leg,
			query: sqlByAlias[leg.alias] ?? leg.query,
		}));
		const outJoins = joins.map((j) => ({
			...j,
			leftColumn:
				renameByAlias[j.leftAlias]?.[j.leftColumn] ?? j.leftColumn,
			rightColumn:
				renameByAlias[j.rightAlias]?.[j.rightColumn] ?? j.rightColumn,
		}));
		return { legs: outLegs, joins: outJoins };
	};

	const previewJoined = async () => {
		setJoined({ loading: true });
		try {
			const hmap = await collectHeaders();
			const r = resolveForRun(hmap);
			const pixel = buildQueryPixel(
				{ databaseId: "", query: "", sources: r.legs, joins: r.joins },
				{ collect: 20 },
			);
			const out = await runPixel(pixel);
			const headers: string[] = out?.data?.headers ?? out?.headers ?? [];
			const rows: unknown[][] = out?.data?.values ?? out?.values ?? [];
			setJoined({ headers, rows, loading: false });
		} catch (e: any) {
			setJoined({ loading: false, error: String(e?.message ?? e) });
		}
	};

	const apply = async () => {
		if (!canApply) return;
		const hmap = await collectHeaders();
		const r = resolveForRun(hmap);
		const clean = r.legs.filter((l) => l.databaseId && l.query.trim());
		const aliases = new Set(clean.map((l) => l.alias));
		onApply(
			clean,
			r.joins.filter(
				(j) =>
					aliases.has(j.leftAlias) &&
					aliases.has(j.rightAlias) &&
					j.leftColumn &&
					j.rightColumn,
			),
		);
		onClose();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o: boolean) => {
				if (!o) onClose();
			}}
		>
			<DialogContent className="flex h-[86vh] w-[min(1000px,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0">
				{/* Header (DialogContent renders its own close ✕ — don't add another) */}
				<div className="flex flex-shrink-0 items-center gap-2 border-stone-200 border-b px-4 py-3 pr-10">
					<GitMerge className="h-4 w-4 text-indigo-500" />
					<div className="min-w-0 flex-1">
						<h2 className="font-semibold text-sm text-stone-800">
							Join sources — data product
						</h2>
						<p className="text-[11px] text-stone-500">
							Combine two or more queries (even from different
							databases) into one dataset.
						</p>
					</div>
				</div>

				<div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
					{/* ── Sources ── */}
					<section className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
								Sources
							</h3>
							<Button
								variant="secondary"
								size="sm"
								onClick={addLeg}
							>
								<Plus className="h-3.5 w-3.5" /> Add source
							</Button>
						</div>
						{legs.map((leg, i) => {
							const pv = legPreview[leg.id];
							return (
								<div
									key={leg.id}
									className="space-y-2 rounded-lg border border-stone-200 bg-white p-3"
								>
									<div className="flex items-center gap-2">
										<span className="rounded bg-indigo-50 px-1.5 py-0.5 font-semibold text-[11px] text-indigo-700">
											#{i + 1}
										</span>
										<label className="text-[11px] text-stone-500">
											Alias
										</label>
										<Input
											value={leg.alias}
											onChange={(e) =>
												updateLeg(leg.id, {
													alias: e.target.value.replace(
														/[^A-Za-z0-9_]/g,
														"",
													),
												})
											}
											className="w-28 py-1 text-xs"
											placeholder="s1"
										/>
										<div className="flex items-center gap-1.5">
											<Database className="h-3.5 w-3.5 text-stone-400" />
											<Select
												value={leg.databaseId}
												onChange={(e) => {
													const db = databases.find(
														(d) =>
															d.id ===
															e.target.value,
													);
													const next = {
														...leg,
														databaseId:
															db?.id ?? "",
														databaseName:
															db?.label ?? "",
													};
													updateLeg(leg.id, {
														databaseId:
															next.databaseId,
														databaseName:
															next.databaseName,
													});
													void loadLegColumns(next); // refresh column dropdowns
												}}
												className="w-52 py-1 text-xs"
											>
												<option value="">
													Select a database…
												</option>
												{databases.map((db) => (
													<option
														key={db.id}
														value={db.id}
													>
														{db.label}
													</option>
												))}
											</Select>
										</div>
										<div className="flex-1" />
										{legs.length > 2 && (
											<button
												onClick={() =>
													removeLeg(leg.id)
												}
												className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
												title="Remove source"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
									<Textarea
										value={leg.query}
										onChange={(e) =>
											updateLeg(leg.id, {
												query: e.target.value,
											})
										}
										onBlur={() => void loadLegColumns(leg)}
										placeholder="SELECT … FROM … (may use {{param}} tokens)"
										spellCheck={false}
										className="h-20 resize-y font-mono text-[12px]"
									/>
									<div className="flex items-center gap-2">
										<Button
											variant="secondary"
											size="sm"
											onClick={() => void previewLeg(leg)}
											disabled={
												!leg.databaseId ||
												!leg.query.trim() ||
												pv?.loading
											}
										>
											{pv?.loading ? (
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
											) : (
												<Play className="h-3.5 w-3.5" />
											)}
											Preview
										</Button>
										{pv?.error && (
											<span className="truncate text-[11px] text-red-500">
												{pv.error}
											</span>
										)}
										{pv?.headers && !pv.error && (
											<span className="truncate text-[11px] text-stone-500">
												{pv.headers.length} cols:{" "}
												{pv.headers.join(", ")}
											</span>
										)}
									</div>
								</div>
							);
						})}
					</section>

					{/* ── Joins ── */}
					<section className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
								Joins
							</h3>
							<Button
								variant="secondary"
								size="sm"
								onClick={addJoin}
								disabled={legs.length < 2}
							>
								<Plus className="h-3.5 w-3.5" /> Add join
							</Button>
						</div>
						{joins.length === 0 && (
							<p className="text-[12px] text-stone-400">
								Add a join to link two sources on a shared key
								column.
							</p>
						)}
						{joins.map((j) => (
							<div
								key={j.id}
								className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white p-2"
							>
								<Select
									value={j.leftAlias}
									onChange={(e) =>
										updateJoin(j.id, {
											leftAlias: e.target.value,
										})
									}
									className="w-24 py-1 text-xs"
								>
									{legs.map((l) => (
										<option key={l.id} value={l.alias}>
											{l.alias}
										</option>
									))}
								</Select>
								{colField(j.leftAlias, j.leftColumn, (v) =>
									updateJoin(j.id, { leftColumn: v }),
								)}
								<Select
									value={j.type}
									onChange={(e) =>
										updateJoin(j.id, {
											type: e.target
												.value as DPJoin["type"],
										})
									}
									className="w-44 py-1 text-xs"
								>
									{JOIN_LABELS.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</Select>
								<Select
									value={j.rightAlias}
									onChange={(e) =>
										updateJoin(j.id, {
											rightAlias: e.target.value,
										})
									}
									className="w-24 py-1 text-xs"
								>
									{legs.map((l) => (
										<option key={l.id} value={l.alias}>
											{l.alias}
										</option>
									))}
								</Select>
								{colField(j.rightAlias, j.rightColumn, (v) =>
									updateJoin(j.id, { rightColumn: v }),
								)}
								<div className="flex-1" />
								<button
									onClick={() => removeJoin(j.id)}
									className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
									title="Remove join"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>
						))}
					</section>

					{/* ── Preview ── */}
					<section className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
								Joined preview
							</h3>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => void previewJoined()}
								disabled={!canApply || joined?.loading}
							>
								{joined?.loading ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Play className="h-3.5 w-3.5" />
								)}
								Preview result
							</Button>
						</div>
						{joined?.error && (
							<p className="text-[12px] text-red-500">
								{joined.error}
							</p>
						)}
						{joined?.headers && !joined.error && (
							<div className="overflow-auto rounded-lg border border-stone-200">
								<table className="w-full text-[11px]">
									<thead className="bg-stone-50 text-left text-stone-500">
										<tr>
											{joined.headers.map((h) => (
												<th
													key={h}
													className="px-2 py-1 font-semibold"
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{(joined.rows ?? [])
											.slice(0, 20)
											.map((row, ri) => (
												<tr
													key={ri}
													className="border-stone-100 border-t"
												>
													{(row as unknown[]).map(
														(c, ci) => (
															<td
																key={ci}
																className="px-2 py-1 text-stone-700"
															>
																{String(
																	c ?? "",
																)}
															</td>
														),
													)}
												</tr>
											))}
									</tbody>
								</table>
								<div className="px-2 py-1 text-[10px] text-stone-400">
									{(joined.rows ?? []).length} rows · these
									columns are what your chart will use.
								</div>
							</div>
						)}
					</section>
				</div>

				{/* Footer */}
				<div className="flex flex-shrink-0 items-center justify-end gap-2 border-stone-200 border-t px-4 py-3">
					{!canApply && (
						<span className="mr-auto text-[11px] text-stone-400">
							Add at least two sources (database + SQL) with
							unique aliases.
						</span>
					)}
					<button
						onClick={onClose}
						className={buttonClasses("secondary", "sm")}
					>
						Cancel
					</button>
					<button
						onClick={apply}
						disabled={!canApply}
						className={cx(
							buttonClasses("primary", "sm"),
							!canApply && "cursor-not-allowed opacity-50",
						)}
					>
						Apply data product
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
