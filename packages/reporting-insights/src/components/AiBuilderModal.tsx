/**
 * AiBuilderModal — describe a dashboard (or compose charts/utilities with the quick
 * builder) and let the configured LLM design a draft grounded in a chosen database's
 * schema. On success it hands the generated Dashboard back to the caller (the editor)
 * to load for review — nothing is persisted until the user saves/publishes.
 */

import { ArrowLeft, Loader2, Plus, Sparkles, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk-react";
import { Button, Select } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { escapeSqlForPixel } from "@/lib/pixel";
import {
	fetchMetamodel,
	fetchModels,
	generateDashboard,
	type ModelEngine,
	type TableMeta,
} from "@/services/aiBuilder";
import type { Dashboard } from "@/types/dashboard";

interface DbOption {
	id: string;
	label: string;
}

/** Chart types offered by the quick builder (the AI can still use any type from free text). */
const BUILDER_CHARTS: {
	value: string;
	label: string;
	needsDimension: boolean;
}[] = [
	{ value: "bar chart", label: "Bar chart", needsDimension: true },
	{ value: "line chart", label: "Line chart", needsDimension: true },
	{ value: "area chart", label: "Area chart", needsDimension: true },
	{ value: "pie chart", label: "Pie chart", needsDimension: true },
	{ value: "stacked bar chart", label: "Stacked bar", needsDimension: true },
	{ value: "table", label: "Table", needsDimension: false },
	{ value: "KPI", label: "KPI (single value)", needsDimension: false },
];

const AGGS: { value: string; label: string; needsColumn: boolean }[] = [
	{ value: "count", label: "Count of records", needsColumn: false },
	{ value: "sum", label: "Sum", needsColumn: true },
	{ value: "average", label: "Average", needsColumn: true },
	{ value: "minimum", label: "Minimum", needsColumn: true },
	{ value: "maximum", label: "Maximum", needsColumn: true },
];

interface Props {
	/** Called with the generated draft — the manual editor loads it for review. */
	onGenerated: (dashboard: Dashboard) => void;
	/** Back / cancel — return to the create-dashboard chooser. */
	onCancel: () => void;
	/** Switch to building the dashboard manually instead. */
	onSwitchToManual: () => void;
}

export function AiBuilder({ onGenerated, onCancel, onSwitchToManual }: Props) {
	const { actions } = useInsight();
	const toast = useToast();

	const runPixel = useCallback(
		(pixel: string) =>
			actions.run(pixel).then((r: any) => r.pixelReturn[0].output),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const runSql = useCallback(
		async (
			dbId: string,
			sql: string,
		): Promise<{ ok: boolean; error?: string; headers?: string[] }> => {
			try {
				const pixel = `Database(database=["${dbId}"]) | Query("${escapeSqlForPixel(sql)}") | Collect(1);`;
				const { pixelReturn } =
					await actions.run<
						[{ output: any; operationType?: string[] }]
					>(pixel);
				const pr = pixelReturn[0];
				if (
					Array.isArray(pr.operationType) &&
					pr.operationType.includes("ERROR")
				) {
					return {
						ok: false,
						error: String(pr.output ?? "Query failed."),
					};
				}
				const result: any = pr.output;
				const headers: string[] =
					result?.data?.headers ?? result?.headers ?? [];
				return { ok: true, headers };
			} catch (e: any) {
				return { ok: false, error: String(e?.message ?? e) };
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const [databases, setDatabases] = useState<DbOption[]>([]);
	const [databaseId, setDatabaseId] = useState("");
	const [models, setModels] = useState<ModelEngine[]>([]);
	const [modelId, setModelId] = useState("");
	const [description, setDescription] = useState("");
	const [generating, setGenerating] = useState(false);
	const [status, setStatus] = useState("");

	// Quick-builder state.
	const [metamodel, setMetamodel] = useState<TableMeta[]>([]);
	const [bKind, setBKind] = useState<"chart" | "utility">("chart");
	const [bChart, setBChart] = useState("bar chart");
	const [bUtility, setBUtility] = useState("filter");
	const [bTable, setBTable] = useState("");
	const [bDimension, setBDimension] = useState("");
	const [bAgg, setBAgg] = useState("count");
	const [bMeasure, setBMeasure] = useState("");
	const [bFilterColumn, setBFilterColumn] = useState("");

	// Load databases on mount.
	useEffect(() => {
		if (databases.length) return;
		(async () => {
			try {
				const out = await runPixel(
					`MyEngines(engineTypes=['DATABASE'], sort=[{"ENGINENAME":"ASC"}], userT=[true], limit=[1000], offset=[0]);`,
				);
				const list: DbOption[] = (Array.isArray(out) ? out : []).map(
					(d: any) => ({
						id: d.app_id ?? d.database_id ?? d.engine_id,
						label: d.engine_name ?? d.app_name ?? d.app_id,
					}),
				);
				setDatabases(list.filter((d) => d.id));
				if (list.length) setDatabaseId((prev) => prev || list[0].id);
			} catch (e: any) {
				toast.error(
					e?.message ?? "Failed to load databases.",
					"Databases",
				);
			}
		})();
		// Load the model engines the user can pick from.
		(async () => {
			try {
				const list = await fetchModels(runPixel);
				setModels(list);
				if (list.length) setModelId((prev) => prev || list[0].id);
			} catch (e: any) {
				toast.error(e?.message ?? "Failed to load models.", "Models");
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Load schema for the quick builder whenever the database changes.
	useEffect(() => {
		if (!databaseId) return;
		let cancelled = false;
		fetchMetamodel(runPixel, databaseId)
			.then((m) => {
				if (cancelled) return;
				setMetamodel(m);
				setBTable(m[0]?.table ?? "");
			})
			.catch(() => {
				if (!cancelled) setMetamodel([]);
			});
		return () => {
			cancelled = true;
		};
	}, [databaseId, runPixel]);

	const builderColumns = useMemo(
		() => metamodel.find((t) => t.table === bTable)?.columns ?? [],
		[metamodel, bTable],
	);

	useEffect(() => {
		setBDimension("");
		setBMeasure("");
		setBFilterColumn("");
	}, [bTable]);

	const chartMeta = BUILDER_CHARTS.find((c) => c.value === bChart);
	const aggMeta = AGGS.find((a) => a.value === bAgg);

	const builderSentence = useMemo(() => {
		if (!bTable) return "";
		if (bKind === "utility") {
			if (bUtility === "filter") {
				return bFilterColumn
					? `A filter control on "${bFilterColumn}" (from ${bTable}) that filters the other visualizations.`
					: "";
			}
			return `A CSV export button that downloads the ${bTable} data.`;
		}
		const measure =
			aggMeta?.needsColumn && bMeasure
				? `${bAgg} of ${bMeasure}`
				: "count of records";
		const byDim =
			chartMeta?.needsDimension && bDimension ? ` by ${bDimension}` : "";
		return `A ${bChart} showing ${measure}${byDim} (from ${bTable}).`;
	}, [
		bKind,
		bUtility,
		bFilterColumn,
		bChart,
		bTable,
		bDimension,
		bAgg,
		bMeasure,
		aggMeta,
		chartMeta,
	]);

	const canAddBuilt = useMemo(() => {
		if (!bTable) return false;
		if (bKind === "utility")
			return (
				bUtility === "csvexport" ||
				(bUtility === "filter" && !!bFilterColumn)
			);
		return (
			(!chartMeta?.needsDimension || !!bDimension) &&
			(!aggMeta?.needsColumn || !!bMeasure)
		);
	}, [
		bKind,
		bUtility,
		bFilterColumn,
		bTable,
		bDimension,
		bMeasure,
		aggMeta,
		chartMeta,
	]);

	const addBuilt = () => {
		if (!canAddBuilt) return;
		setDescription((prev) =>
			prev.trim()
				? `${prev.trimEnd()}\n- ${builderSentence}`
				: `- ${builderSentence}`,
		);
	};

	const generate = async () => {
		if (generating) return;
		setGenerating(true);
		setStatus("");
		try {
			const databaseName =
				databases.find((d) => d.id === databaseId)?.label ?? databaseId;
			const dashboard = await generateDashboard({
				runPixel,
				runSql,
				modelId,
				description,
				databaseId,
				databaseName,
				onProgress: setStatus,
			});
			toast.success(
				"Draft ready — review, run the queries, then save or publish.",
				"Dashboard generated",
			);
			onGenerated(dashboard);
		} catch (e: any) {
			toast.error(e?.message ?? "Generation failed.", "AI Builder");
		} finally {
			setGenerating(false);
			setStatus("");
		}
	};

	const canGenerate =
		!!description.trim() && !!databaseId && !!modelId && !generating;

	return (
		<div className="mx-auto flex h-full w-full max-w-3xl flex-col">
			{/* Top nav */}
			<div className="flex flex-shrink-0 items-center justify-between gap-3 px-6 py-3">
				<button
					type="button"
					onClick={() => !generating && onCancel()}
					className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-[13px] text-stone-500 hover:bg-stone-100 hover:text-stone-700"
				>
					<ArrowLeft className="h-4 w-4" /> Back
				</button>
				<button
					type="button"
					onClick={() => !generating && onSwitchToManual()}
					className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-[13px] text-stone-600 hover:border-stone-300 hover:bg-stone-50"
				>
					<Wrench className="h-3.5 w-3.5" /> Switch to manual builder
				</button>
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
					{/* Header */}
					<div className="flex flex-shrink-0 items-center gap-2.5 border-stone-100 border-b px-5 py-3.5">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
							<Sparkles className="h-4.5 w-4.5 text-white" />
						</div>
						<div>
							<h2 className="font-bold text-base text-stone-900">
								AI Dashboard Builder
							</h2>
							<p className="text-stone-500 text-xs">
								The AI designs the queries, charts, and layout
								for you to review.
							</p>
						</div>
					</div>

					{/* Body */}
					<div className="flex-1 space-y-4 overflow-auto p-5">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
									Model
								</label>
								<Select
									value={modelId}
									onChange={(e) => setModelId(e.target.value)}
									disabled={generating}
								>
									{models.length === 0 && (
										<option value="">
											No models available
										</option>
									)}
									{models.map((m) => (
										<option key={m.id} value={m.id}>
											{m.name}
										</option>
									))}
								</Select>
							</div>
							<div>
								<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
									Database
								</label>
								<Select
									value={databaseId}
									onChange={(e) =>
										setDatabaseId(e.target.value)
									}
									disabled={generating}
								>
									{databases.length === 0 && (
										<option value="">Loading…</option>
									)}
									{databases.map((d) => (
										<option key={d.id} value={d.id}>
											{d.label}
										</option>
									))}
								</Select>
							</div>
						</div>

						<div>
							<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
								Describe your dashboard
							</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={generating}
								rows={5}
								placeholder="e.g. A sales overview with total revenue, monthly trend, and top products…"
								className="w-full resize-y rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
							/>
						</div>

						{/* Quick builder */}
						<div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
							<div className="mb-2 flex items-center justify-between">
								<p className="font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
									Add to dashboard
								</p>
								<div className="inline-flex rounded-md border border-stone-200 bg-white p-0.5 font-semibold text-[11px]">
									{(["chart", "utility"] as const).map(
										(k) => (
											<button
												key={k}
												type="button"
												disabled={generating}
												onClick={() => setBKind(k)}
												className={`rounded px-2.5 py-1 capitalize transition-colors ${
													bKind === k
														? "bg-indigo-600 text-white"
														: "text-stone-500 hover:text-stone-700"
												}`}
											>
												{k}
											</button>
										),
									)}
								</div>
							</div>

							<div className="grid grid-cols-2 gap-2">
								{bKind === "chart" ? (
									<label className="flex flex-col gap-1">
										<span className="font-medium text-[11px] text-stone-500">
											Chart type
										</span>
										<Select
											value={bChart}
											onChange={(e) =>
												setBChart(e.target.value)
											}
											disabled={generating}
											className="text-xs"
										>
											{BUILDER_CHARTS.map((c) => (
												<option
													key={c.value}
													value={c.value}
												>
													{c.label}
												</option>
											))}
										</Select>
									</label>
								) : (
									<label className="flex flex-col gap-1">
										<span className="font-medium text-[11px] text-stone-500">
											Utility
										</span>
										<Select
											value={bUtility}
											onChange={(e) =>
												setBUtility(e.target.value)
											}
											disabled={generating}
											className="text-xs"
										>
											<option value="filter">
												Filter control
											</option>
											<option value="csvexport">
												CSV export button
											</option>
										</Select>
									</label>
								)}

								<label className="flex flex-col gap-1">
									<span className="font-medium text-[11px] text-stone-500">
										Table
									</span>
									<Select
										value={bTable}
										onChange={(e) =>
											setBTable(e.target.value)
										}
										disabled={
											generating || !metamodel.length
										}
										className="text-xs"
									>
										{metamodel.length === 0 && (
											<option value="">Loading…</option>
										)}
										{metamodel.map((t) => (
											<option
												key={t.table}
												value={t.table}
											>
												{t.table}
											</option>
										))}
									</Select>
								</label>

								{bKind === "chart" && (
									<>
										<label className="flex flex-col gap-1">
											<span className="font-medium text-[11px] text-stone-500">
												Aggregate
											</span>
											<Select
												value={bAgg}
												onChange={(e) =>
													setBAgg(e.target.value)
												}
												disabled={generating}
												className="text-xs"
											>
												{AGGS.map((a) => (
													<option
														key={a.value}
														value={a.value}
													>
														{a.label}
													</option>
												))}
											</Select>
										</label>
										<label className="flex flex-col gap-1">
											<span className="font-medium text-[11px] text-stone-500">
												{aggMeta?.needsColumn
													? "Measure column"
													: "Measure column (n/a)"}
											</span>
											<Select
												value={bMeasure}
												onChange={(e) =>
													setBMeasure(e.target.value)
												}
												disabled={
													generating ||
													!aggMeta?.needsColumn ||
													!builderColumns.length
												}
												className="text-xs"
											>
												<option value="">
													Select…
												</option>
												{builderColumns.map((c) => (
													<option
														key={c.column}
														value={c.column}
													>
														{c.column}
													</option>
												))}
											</Select>
										</label>
										{chartMeta?.needsDimension && (
											<label className="col-span-2 flex flex-col gap-1">
												<span className="font-medium text-[11px] text-stone-500">
													Group by (category / x-axis)
												</span>
												<Select
													value={bDimension}
													onChange={(e) =>
														setBDimension(
															e.target.value,
														)
													}
													disabled={
														generating ||
														!builderColumns.length
													}
													className="text-xs"
												>
													<option value="">
														Select…
													</option>
													{builderColumns.map((c) => (
														<option
															key={c.column}
															value={c.column}
														>
															{c.column}
														</option>
													))}
												</Select>
											</label>
										)}
									</>
								)}

								{bKind === "utility" &&
									bUtility === "filter" && (
										<label className="col-span-2 flex flex-col gap-1">
											<span className="font-medium text-[11px] text-stone-500">
												Filter on column
											</span>
											<Select
												value={bFilterColumn}
												onChange={(e) =>
													setBFilterColumn(
														e.target.value,
													)
												}
												disabled={
													generating ||
													!builderColumns.length
												}
												className="text-xs"
											>
												<option value="">
													Select…
												</option>
												{builderColumns.map((c) => (
													<option
														key={c.column}
														value={c.column}
													>
														{c.column}
													</option>
												))}
											</Select>
										</label>
									)}
							</div>

							<div className="mt-2.5 flex items-center justify-between gap-3">
								<span className="truncate text-[11px] text-stone-500 italic">
									{builderSentence ||
										"Pick a table to start."}
								</span>
								<button
									type="button"
									onClick={addBuilt}
									disabled={!canAddBuilt || generating}
									className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-indigo-200 bg-white px-2.5 py-1 font-semibold text-indigo-600 text-xs hover:bg-indigo-50 disabled:opacity-50"
								>
									<Plus className="h-3.5 w-3.5" /> Add to
									prompt
								</button>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="flex flex-shrink-0 items-center justify-between gap-3 border-stone-100 border-t px-5 py-3.5">
						<span className="text-stone-400 text-xs">
							{generating
								? status
								: "Grounded in your schema — review before saving."}
						</span>
						<div className="flex items-center gap-2">
							<Button
								variant="secondary"
								size="sm"
								onClick={() => !generating && onCancel()}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={generate}
								disabled={!canGenerate}
							>
								{generating ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />{" "}
										Generating…
									</>
								) : (
									<>
										<Sparkles className="h-4 w-4" />{" "}
										Generate
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
