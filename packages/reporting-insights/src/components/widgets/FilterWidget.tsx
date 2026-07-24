/**
 * Filter widget — a placeable visualization that lets the viewer pick one or
 * more values for a column and applies them (client-side, SQL IN semantics) to a
 * chosen set of OTHER visualizations. Changing the selection only re-renders the
 * targeted visualizations (see src/lib/dashboardFilters.tsx).
 */
import { Check, Filter as FilterIcon, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui";
import {
	distinctValuesFor,
	useFilterStore,
	useTargetData,
	type VizData,
} from "@/lib/dashboardFilters";

interface Props {
	vizId: string;
	title: string;
	/** Column to filter on (must exist in the targeted frames' rows). */
	column: string;
	/** Visualization ids this filter applies to. */
	targets: string[];
	/** Optional rows from the widget's own query (legacy). Options are normally
	 *  derived from the TARGETS' loaded rows, so a query of its own is not needed. */
	rows?: Record<string, any>[];
	/** Values to pre-select when no store entry exists yet (saved from editor preview). */
	defaultValues?: string[];
	/** Called whenever the selection changes — the editor uses this to persist defaults. */
	onDefaultValuesChange?: (values: string[]) => void;
}

export function FilterWidget({
	vizId,
	title,
	column,
	targets,
	rows,
	defaultValues,
	onDefaultValuesChange,
}: Props) {
	const store = useFilterStore();
	// Prefer the live store value (persists across sheet switches); fall back to
	// saved defaults so the viewer starts with the author's pre-selected values.
	const [selected, setSelected] = useState<string[]>(
		() => store?.getFilter(vizId)?.values ?? defaultValues ?? [],
	);

	// Publish defaults into the store on mount so targeted vizzes filter immediately
	// even before the user interacts with this widget.
	useEffect(() => {
		if (!store || !column || !targets.length) return;
		if (store.getFilter(vizId)) return; // already set — don't override
		if (defaultValues?.length) {
			store.setFilter({
				id: vizId,
				column,
				values: defaultValues,
				targets,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const anchorRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<{
		top: number;
		left: number;
		width: number;
		maxH: number;
	} | null>(null);

	// Subscribe to the TARGETS' loaded data — options come from there (no own query
	// needed). Re-renders only when a target publishes new rows.
	const targetData = useTargetData(targets);
	const loadedCount = targetData.filter(
		(t) => (t.data?.rows?.length ?? 0) > 0,
	).length;

	// Distinct option values across the targets' loaded rows (falling back to the
	// widget's own rows if it happens to have a query).
	const options = useMemo(() => {
		const datasets: (VizData | undefined)[] = targetData.map((t) => t.data);
		if (rows?.length)
			datasets.push({ headers: Object.keys(rows[0]), rows });
		return distinctValuesFor(column, datasets);
	}, [targetData, rows, column]);

	const filtered = useMemo(
		() =>
			options
				.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()))
				.slice(0, 100),
		[options, q],
	);

	// Position the option list in a portal (fixed) so it overlays outside the panel
	// instead of clipping — no window resize needed to see a long list. Flips upward
	// when there isn't room below, and clamps to the viewport.
	const reposition = () => {
		const el = anchorRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const width = Math.max(r.width, 200);
		const rows = filtered.length || 1;
		const desired = Math.min(280, rows * 32 + 10);
		const spaceBelow = window.innerHeight - r.bottom - 8;
		const spaceAbove = r.top - 8;
		const below = spaceBelow >= desired || spaceBelow >= spaceAbove;
		const maxH = Math.max(
			120,
			Math.min(desired, below ? spaceBelow : spaceAbove),
		);
		const top = below ? r.bottom + 4 : r.top - maxH - 4;
		const left = Math.max(
			8,
			Math.min(r.left, window.innerWidth - width - 8),
		);
		setPos({ top, left, width, maxH });
	};
	useLayoutEffect(() => {
		if (open) reposition();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, filtered.length]);
	useEffect(() => {
		if (!open) return;
		const handle = () => reposition();
		window.addEventListener("resize", handle);
		window.addEventListener("scroll", handle, true);
		return () => {
			window.removeEventListener("resize", handle);
			window.removeEventListener("scroll", handle, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const apply = (next: string[]) => {
		setSelected(next);
		store?.setFilter({ id: vizId, column, values: next, targets });
		onDefaultValuesChange?.(next);
	};
	const toggle = (o: string) =>
		apply(
			selected.includes(o)
				? selected.filter((x) => x !== o)
				: [...selected, o],
		);
	const clearAll = () => apply([]);

	// NOTE: intentionally do NOT clear the filter on unmount. The filter widget
	// unmounts whenever its sheet isn't active, but the filter must keep applying
	// to targeted visualizations on other sheets. The store is per-dashboard-mount,
	// so it resets when the viewer leaves the dashboard.

	const selectedSet = new Set(selected);
	const misconfigured = !column || targets.length === 0;

	return (
		<div className="flex h-full w-full flex-col gap-2 p-2">
			<div className="flex items-center gap-1.5 font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
				<FilterIcon className="h-3.5 w-3.5" />
				{title || "Filter"}
			</div>

			{misconfigured ? (
				<p className="text-[12px] text-stone-400">
					{!column
						? "Choose a column to filter on"
						: "Select which visualizations this filter targets"}{" "}
					in the editor.
				</p>
			) : (
				<>
					<div className="flex items-center justify-between">
						<label className="text-[11px] text-stone-500">
							{column}
						</label>
						{selected.length > 0 && (
							<button
								type="button"
								onClick={clearAll}
								className="font-medium text-[11px] text-stone-400 hover:text-stone-700"
							>
								Clear
							</button>
						)}
					</div>

					{/* Chips + searchable checkbox dropdown */}
					<div className="relative">
						<div
							ref={anchorRef}
							onClick={() => setOpen(true)}
							className="flex cursor-text flex-wrap items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20"
						>
							{selected.map((s) => (
								<span
									key={s}
									className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-[12px] text-indigo-700"
								>
									{s}
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											toggle(s);
										}}
										className="text-indigo-400 hover:text-indigo-700"
									>
										<X className="h-3 w-3" />
									</button>
								</span>
							))}
							<Input
								className="min-w-[60px] flex-1 bg-transparent text-[13px] outline-none"
								value={q}
								placeholder={
									selected.length
										? ""
										: "All — pick one or more…"
								}
								onChange={(e) => {
									setQ(e.target.value);
									setOpen(true);
								}}
								onFocus={() => setOpen(true)}
								onBlur={() =>
									setTimeout(() => setOpen(false), 120)
								}
							/>
						</div>
						{open &&
							pos &&
							createPortal(
								<ul
									className="fixed z-[9999] overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-soft-lg"
									style={{
										top: pos.top,
										left: pos.left,
										width: pos.width,
										maxHeight: pos.maxH,
									}}
									onMouseDown={(e) => e.preventDefault()}
								>
									{filtered.length === 0 && (
										<li className="px-3 py-1.5 text-[12px] text-stone-400">
											No matches
										</li>
									)}
									{filtered.map((o) => {
										const on = selectedSet.has(o);
										return (
											<li key={o}>
												<button
													type="button"
													onMouseDown={(e) => {
														e.preventDefault();
														toggle(o);
													}}
													className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-stone-50 ${on ? "font-semibold text-indigo-600" : "text-stone-700"}`}
												>
													<span
														className={`grid h-4 w-4 flex-shrink-0 place-items-center rounded border ${on ? "border-indigo-500 bg-indigo-500 text-white" : "border-stone-300"}`}
													>
														{on && (
															<Check className="h-3 w-3" />
														)}
													</span>
													<span className="truncate">
														{o}
													</span>
												</button>
											</li>
										);
									})}
								</ul>,
								document.body,
							)}
					</div>

					<p className="text-[11px] text-stone-400">
						{selected.length
							? `${selected.length} value${selected.length === 1 ? "" : "s"} · filtering ${targets.length} visualization${targets.length === 1 ? "" : "s"}`
							: `Targets ${targets.length} visualization${targets.length === 1 ? "" : "s"}`}
					</p>

					{/* Hint ONLY when the filter genuinely has no values to offer. If
                        options exist, the data is clearly loaded — never nag in that case
                        (otherwise a single slow/cross-sheet target falsely reads "not loaded"
                        even though every chart on screen is populated). */}
					{column && options.length === 0 && (
						<p className="text-[11px] text-amber-600">
							{loadedCount === 0
								? `No data loaded from the targeted visualization${targets.length === 1 ? "" : "s"} yet — run ${targets.length === 1 ? "its query" : "their queries"} to populate filter options.`
								: `No values found for “${column}” in the loaded data — check the column exists in the targeted visualizations.`}
						</p>
					)}
				</>
			)}
		</div>
	);
}
