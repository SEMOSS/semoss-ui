/**
 * ParamSheet — the centralized parameter input panel rendered on the auto-created
 * "Parameters" sheet. Collects all parameter inputs from every query in the
 * dashboard, deduplicates shared param names, and provides a single "Run All"
 * button that triggers every parameterized (and loadAfterParams) query at once.
 */

import { Loader2, Play, SlidersHorizontal } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { ParamControl } from "@/components/ParamControl";
import { type QueryRunFn, useQueryRunner } from "@/components/QueryRunner";
import { type ParamGroup, resolveParamDefault } from "@/lib/resolveQuery";
import type { ParamSheetConfig } from "@/types/dashboard";

/** Distinct first-column values from a SEMOSS query result (for dropdown options). */
function firstColumnValues(output: any): string[] {
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

interface ParamSheetProps {
	paramGroups: ParamGroup[];
	values: Record<string, string>;
	onChangeValue: (name: string, val: string) => void;
	onRunAll: () => void;
	allSatisfied: boolean;
	config?: ParamSheetConfig;
	isRunning?: boolean;
	/** Called whenever the loaded options for any param change (keyed by param name). */
	onParamOptionsChange?: (opts: Record<string, string[]>) => void;
	/** Fallback query runner used when no QueryRunnerProvider is in the tree (e.g. portal). */
	queryRunner?: QueryRunFn;
}

export function ParamSheet({
	paramGroups,
	values,
	onChangeValue,
	onRunAll,
	allSatisfied,
	config,
	isRunning,
	onParamOptionsChange,
	queryRunner,
}: ParamSheetProps) {
	const providerRun = useQueryRunner();
	const sharedRun = providerRun ?? queryRunner ?? null;
	// SQL-sourced dropdown options keyed by param name (non-conditional params)
	const [paramOptions, setParamOptions] = useState<Record<string, string[]>>(
		{},
	);
	// Options for conditional params, re-fetched whenever the parent param value changes
	const [conditionalParamOptions, setConditionalParamOptions] = useState<
		Record<string, string[]>
	>({});

	// Notify parent whenever either options map changes so it can pre-expand empty multiselects
	useEffect(() => {
		if (!onParamOptionsChange) return;
		onParamOptionsChange({ ...paramOptions, ...conditionalParamOptions });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paramOptions, conditionalParamOptions]);

	// Effect A: fetch options for non-conditional params once on mount
	useEffect(() => {
		const toFetch = paramGroups.filter(
			(g) =>
				!g.conditionalOn &&
				(g.param.inputType === "dropdown" ||
					g.param.inputType === "multiselect") &&
				g.optionsQuery &&
				(g.optionsDatabaseId || g.databaseIdFallback),
		);
		if (!toFetch.length) return;
		let cancelled = false;
		void (async () => {
			const next: Record<string, string[]> = {};
			for (const g of toFetch) {
				try {
					const db = g.optionsDatabaseId || g.databaseIdFallback;
					let outputRaw: any;
					if (sharedRun) {
						const r = await sharedRun(db, g.optionsQuery ?? "", -1);
						outputRaw = r.raw;
					}
					if (outputRaw) next[g.name] = firstColumnValues(outputRaw);
				} catch {
					/* leave options empty; manual options still apply */
				}
			}
			if (!cancelled && Object.keys(next).length)
				setParamOptions((prev) => ({ ...prev, ...next }));
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paramGroups.map((g) => g.name).join(","), sharedRun]);

	// Effect B: re-fetch options for conditional params when their parent value changes
	const conditionalGroups = paramGroups.filter(
		(g) => g.conditionalOn && g.conditionalBranches?.length,
	);
	const conditionalDepKey = conditionalGroups
		.map((g) => `${g.name}:${values[g.conditionalOn ?? ""] ?? ""}`)
		.join("|");
	useEffect(() => {
		if (!conditionalGroups.length || !sharedRun) return;
		let cancelled = false;
		void (async () => {
			const next: Record<string, string[]> = {};
			for (const g of conditionalGroups) {
				const parentVal = values[g.conditionalOn!] ?? "";
				const branch = (g.conditionalBranches ?? []).find(
					(b) => b.whenValue === parentVal,
				);
				if (!branch) {
					// No branch matches — fall back to base optionsQuery/options if defined
					if (g.optionsQuery && sharedRun) {
						try {
							const db =
								g.optionsDatabaseId || g.databaseIdFallback;
							const r = await sharedRun(db, g.optionsQuery, -1);
							next[g.name] = [
								...firstColumnValues(r.raw),
								...g.mergedOptions,
							].filter((v, i, a) => a.indexOf(v) === i);
						} catch {
							next[g.name] = [...g.mergedOptions];
						}
					} else {
						next[g.name] = [...g.mergedOptions];
					}
					continue;
				}
				const db =
					branch.optionsDatabaseId ||
					g.optionsDatabaseId ||
					g.databaseIdFallback;
				const staticOpts = branch.options ?? [];
				if (branch.optionsQuery && sharedRun) {
					try {
						// Substitute the parent param value into the branch SQL if referenced
						const interpolated = branch.optionsQuery.replaceAll(
							`{{${g.conditionalOn}}}`,
							parentVal,
						);
						const r = await sharedRun(db, interpolated, -1);
						const fetched = firstColumnValues(r.raw);
						next[g.name] = [...fetched, ...staticOpts].filter(
							(v, i, a) => a.indexOf(v) === i,
						);
					} catch {
						next[g.name] = [...staticOpts];
					}
				} else {
					next[g.name] = [...staticOpts];
				}
			}
			if (!cancelled)
				setConditionalParamOptions((prev) => ({ ...prev, ...next }));
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conditionalDepKey, sharedRun]);

	const optionsFor = (g: ParamGroup): string[] => {
		if (g.conditionalOn && g.conditionalBranches?.length) {
			return conditionalParamOptions[g.name] ?? [];
		}
		const base = [...(paramOptions[g.name] ?? []), ...g.mergedOptions];
		if (
			g.param.defaultValue &&
			g.param.inputType !== "multiselect" &&
			g.param.inputType !== "date"
		) {
			base.push(g.param.defaultValue);
		}

		// Results
		return Array.from(new Set(base));
	};

	if (paramGroups.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
				<div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
					<SlidersHorizontal className="h-6 w-6" />
				</div>
				<p className="font-semibold text-slate-600 text-sm">
					No parameters
				</p>
				<p className="max-w-xs text-slate-400 text-xs">
					Add{" "}
					<code className="rounded bg-slate-100 px-1 font-mono">
						{"{{paramName}}"}
					</code>{" "}
					tokens to your queries to create parameter inputs here.
				</p>
			</div>
		);
	}

	const _alignment = config?.alignment ?? "center";
	const colCount = config?.columns ?? (paramGroups.length >= 3 ? 2 : 1);
	const gridStyle: React.CSSProperties =
		colCount === 1
			? {
					gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
					maxWidth: "24rem",
					// Single-column grids respect form alignment (narrow column, so centering matters)
					...(_alignment === "center"
						? { marginLeft: "auto", marginRight: "auto" }
						: _alignment === "right"
							? { marginLeft: "auto" }
							: {}),
				}
			: { gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` };
	// Header title row flex alignment — no width constraint on the container
	const headerJustify =
		_alignment === "center"
			? "justify-center"
			: _alignment === "right"
				? "justify-end"
				: "";
	// Description text alignment — left keeps the indent under the icon
	const descClass =
		_alignment === "center"
			? "text-center"
			: _alignment === "right"
				? "text-right"
				: "pl-10";
	const title = config?.title || "Query Parameters";
	const description =
		config?.description ||
		"Set values below, then click Run to load all charts.";
	const buttonLabel = config?.runButtonLabel || "Run All";

	// Button style derivations
	const btnAlignment = config?.runButtonAlignment ?? "full";
	const hasCustomBg = !!config?.runButtonColor;
	const showIcon = config?.runButtonShowIcon !== false;
	const btnContainerClass =
		btnAlignment === "left"
			? "flex justify-start"
			: btnAlignment === "center"
				? "flex justify-center"
				: btnAlignment === "right"
					? "flex justify-end"
					: "";
	const btnWidthClass = btnAlignment === "full" ? "w-full" : "min-w-[120px]";
	const btnWidthStyle: React.CSSProperties =
		btnAlignment !== "full" && config?.runButtonWidth
			? {
					width: `${config.runButtonWidth}${config.runButtonWidthUnit ?? "px"}`,
				}
			: {};
	const btnColorClass = hasCustomBg
		? "hover:opacity-90"
		: "bg-blue-600 hover:bg-blue-700";
	const btnColorStyle: React.CSSProperties = {
		...(config?.runButtonColor
			? { backgroundColor: config.runButtonColor }
			: {}),
		...(config?.runButtonFontColor
			? { color: config.runButtonFontColor }
			: {}),
	};

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{/* Header + inputs — full width, alignment applied per-element */}
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{/* Header */}
				<div className="flex-shrink-0 border-slate-100 border-b px-6 pt-6 pb-4">
					<div
						className={`mb-1 flex items-center gap-2.5 ${headerJustify}`}
					>
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
							<SlidersHorizontal className="h-4 w-4" />
						</div>
						<p className="font-semibold text-base text-slate-800">
							{title}
						</p>
					</div>
					<p className={`text-slate-400 text-xs ${descClass}`}>
						{description}
					</p>
				</div>

				{/* Scrollable param inputs */}
				<div className="relative flex-1 overflow-y-auto px-6 py-5">
					<div className="grid gap-4" style={gridStyle}>
						{paramGroups.map((g) => (
							<div key={g.name}>
								<label className="mb-1 block font-semibold text-slate-600 text-xs">
									{g.label || g.name}
									{g.param.required && (
										<span className="ml-0.5 text-red-500">
											*
										</span>
									)}
									{g.queryIds.length > 1 && (
										<span className="ml-1.5 font-normal text-[10px] text-slate-400">
											({g.queryIds.length} queries)
										</span>
									)}
								</label>
								<ParamControl
									param={g.param}
									value={
										values[g.name] ??
										resolveParamDefault(g.param)
									}
									options={optionsFor(g)}
									onChange={(v) => onChangeValue(g.name, v)}
									onEnter={() =>
										allSatisfied && !isRunning && onRunAll()
									}
								/>
							</div>
						))}
					</div>
					{isRunning && (
						<div className="absolute inset-0 flex items-center justify-center bg-white/70">
							<div className="flex flex-col items-center gap-2 text-slate-600 text-sm">
								{/* Wave bar animation */}
								<style>{`@keyframes query-wave{0%,100%{transform:scaleY(.2)}50%{transform:scaleY(1)}}`}</style>
								<div
									className="flex items-center gap-[3px]"
									style={{ height: "2.25rem" }}
								>
									{[0, 1, 2, 3, 4].map((i) => (
										<div
											key={i}
											className="w-1.5 rounded-full"
											style={{
												height: "100%",
												backgroundColor: "#32b4f5",
												transformOrigin: "center",
												animation:
													"query-wave 1s ease-in-out infinite",
												animationDelay: `${i * 0.15}s`,
											}}
										/>
									))}
								</div>
								Running queries…
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Pinned Run button — independent of form alignment, spans full parent width */}
			<div className="flex-shrink-0 border-slate-100 border-t px-6 pt-4 pb-6">
				{!allSatisfied && !isRunning && (
					<p
						className={`mb-2 text-[11px] text-red-500 ${
							btnAlignment === "left"
								? "text-left"
								: btnAlignment === "right"
									? "text-right"
									: "text-center"
						}`}
					>
						Fill in all required parameters (*) to run.
					</p>
				)}
				<div className={btnContainerClass}>
					<button
						type="button"
						onClick={onRunAll}
						disabled={!allSatisfied || !!isRunning}
						style={{ ...btnColorStyle, ...btnWidthStyle }}
						className={`${btnWidthClass} flex items-center justify-center gap-2 ${btnColorClass} rounded-lg py-2.5 font-semibold text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40`}
					>
						{isRunning ? (
							<>
								{showIcon && (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								)}
								Loading…
							</>
						) : (
							<>
								{showIcon && <Play className="h-3.5 w-3.5" />}
								{buttonLabel}
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
