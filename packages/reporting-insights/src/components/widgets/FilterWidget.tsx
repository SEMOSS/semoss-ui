/**
 * Filter widget: A placeable visualization that lets the viewer pick one or
 * more values for a column and applies them (client-side, SQL IN semantics) to a
 * chosen set of OTHER visualizations. Changing the selection only re-renders the
 * targeted visualizations (see src/lib/dashboardFilters.tsx).
 *
 * Display types: dropdown (default), checklist, slider, typeahead, datepicker, button.
 */

import { Check, ChevronDown, Filter as FilterIcon, X } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { FilterVisualization } from "@/components/tools/shared/FilterVisualization";
import {
	distinctValuesFor,
	useFilterStore,
	useTargetData,
	type VizData,
} from "@/lib/dashboardFilters";
import {
	makeVizFilterGroup,
	type VizFilterGroup,
	vizFilterIsActive,
} from "@/lib/vizFilter";

type DisplayType =
	| "dropdown"
	| "checklist"
	| "slider"
	| "typeahead"
	| "datepicker"
	| "button"
	| "float";
type ButtonLayout = "horizontal" | "vertical";

interface Props {
	vizId: string;
	title: string;
	/** Column to filter on (must exist in the targeted frames' rows). */
	column: string;
	/** Visualization ids this filter applies to. */
	targets: string[];
	/** Optional rows from the widget's own query (legacy). Options are normally
	 *  derived from the TARGETS' loaded rows, so a query of its own is not needed. */
	rows?: Record<string, unknown>[];
	/** Values to pre-select when no store entry exists yet (saved from editor preview). */
	defaultValues?: string[];
	/** Called whenever the selection changes: The editor uses this to persist defaults. */
	onDefaultValuesChange?: (values: string[]) => void;
	/** How filter values are presented to the viewer. */
	displayType?: DisplayType;
	/** Arrange button options beside or above each other. */
	buttonLayout?: ButtonLayout;
	/** Allow selecting multiple values. Not applicable to typeahead. */
	multiSelect?: boolean;
	/** Apply filter immediately on selection. When false, shows Apply button. */
	autoRun?: boolean;
	/** Float display type: author-defined rule tree applied to all target visualizations. */
	filterFloatRules?: VizFilterGroup;
	/** Float: schema-level column names from target vizzes (available before queries run). */
	floatSchemaColumns?: string[];
	/** True when rendered inside the editor: Shows Save/Cancel in the float panel. */
	isEditing?: boolean;
	/** Called when the user saves float rules in the editor, so the config can be persisted. */
	onFloatRulesSave?: (rules: VizFilterGroup) => void;
}

export function FilterWidget({
	vizId,
	title,
	column,
	targets,
	rows,
	defaultValues,
	onDefaultValuesChange,
	displayType = "dropdown",
	buttonLayout = "horizontal",
	multiSelect = true,
	autoRun = true,
	filterFloatRules,
	floatSchemaColumns,
	isEditing = false,
	onFloatRulesSave,
}: Props) {
	const store = useFilterStore();
	// Prefer the live store value (persists across sheet switches); fall back to
	// saved defaults so the viewer starts with the author's pre-selected values.
	const [selected, setSelected] = useState<string[]>(
		() => store?.getFilter(vizId)?.values ?? defaultValues ?? [],
	);
	// Pending state buffers changes when autoRun=false (Apply button flow).
	const [pending, setPending] = useState<string[]>(selected);

	// Float: committed rules (applied to store) + draft for in-panel editing.
	const [floatRules, setFloatRules] = useState<VizFilterGroup>(
		() => filterFloatRules ?? makeVizFilterGroup("AND"),
	);
	const [draftRules, setDraftRules] = useState<VizFilterGroup>(floatRules);

	// Publish defaults into the store on mount so targeted vizzes filter immediately
	// even before the user interacts with this widget.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect — publishes editor-saved defaults once without re-running on every dependency change.
	useEffect(() => {
		if (!store || !targets.length) return;
		if (store.getFilter(vizId)) return; // already set — don't override
		if (displayType === "float") {
			// Push saved float rules (from config) so they apply immediately in view mode.
			if (vizFilterIsActive(floatRules)) {
				store.setFilter({
					id: vizId,
					column: "",
					values: [],
					targets,
					rules: floatRules,
				});
			}
		} else if (column && defaultValues?.length) {
			store.setFilter({
				id: vizId,
				column,
				values: defaultValues,
				targets,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Dropdown open/close state
	const [open, setOpen] = useState(false);
	// Search/type query. doubles as display value for typeahead
	const [q, setQ] = useState("");
	const anchorRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<{
		top: number;
		left: number;
		width: number;
		maxH: number;
	} | null>(null);

	// Float dropdown: trigger anchor + detached panel refs, open state, panel position.
	const floatTriggerRef = useRef<HTMLDivElement>(null);
	const floatPanelRef = useRef<HTMLDivElement>(null);
	const [floatOpen, setFloatOpen] = useState(false);
	const [floatPos, setFloatPos] = useState<{
		top: number;
		left: number;
		width: number;
		maxH: number;
	} | null>(null);

	// Slider state: lo/hi handle positions (index into numericOptions)
	const [sliderLo, setSliderLo] = useState<number>(0);
	const [sliderHi, setSliderHi] = useState<number>(0);

	// Date picker: start/end for the multi-select range mode
	const [dateRangeStart, setDateRangeStart] = useState("");
	const [dateRangeEnd, setDateRangeEnd] = useState("");

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

	// Slider: numeric detection and derived values
	const sortedNums = useMemo(() => {
		const nums = options.map(Number);
		if (nums.some(Number.isNaN)) return null;
		return [...new Set(nums)].sort((a, b) => a - b);
	}, [options]);
	const isNumeric = sortedNums !== null && sortedNums.length > 0;
	const numericMin = isNumeric ? sortedNums?.[0] : 0;
	const numericMax = isNumeric ? sortedNums?.[sortedNums?.length - 1] : 0;
	const numericStep = useMemo(() => {
		if (!isNumeric || sortedNums?.length < 2) return 1;
		const diffs = sortedNums?.slice(1).map((v, i) => v - sortedNums?.[i]);
		const minDiff = Math.min(...diffs);
		// Round to avoid floating-point noise
		return parseFloat(minDiff.toPrecision(6));
	}, [isNumeric, sortedNums]);

	// Initialise slider handles to full range when options/type first arrive
	useEffect(() => {
		if (displayType !== "slider" || options.length === 0) return;
		if (isNumeric) {
			setSliderLo(numericMin);
			setSliderHi(numericMax);
		} else {
			setSliderLo(0);
			setSliderHi(options.length - 1);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [displayType, isNumeric, numericMin, numericMax, options.length]);

	// Position the option list in a portal (fixed) so it overlays outside the panel
	// instead of clipping — no window resize needed to see a long list. Flips upward
	// when there isn't room below, and clamps to the viewport.
	const reposition = useCallback(() => {
		const el = anchorRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const width = Math.max(r.width, 200);
		const rowCount = filtered.length || 1;
		const desired = Math.min(280, rowCount * 32 + 10);
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
	}, [filtered.length]);
	useLayoutEffect(() => {
		if (open) reposition();
	}, [open, reposition]);
	useEffect(() => {
		if (!open) return;
		const handle = () => reposition();
		window.addEventListener("resize", handle);
		window.addEventListener("scroll", handle, true);
		return () => {
			window.removeEventListener("resize", handle);
			window.removeEventListener("scroll", handle, true);
		};
	}, [open, reposition]);

	// Push to store immediately() also persists defaults via onDefaultValuesChange).
	const apply = (next: string[]) => {
		setSelected(next);
		setPending(next);
		store?.setFilter({ id: vizId, column, values: next, targets });
		onDefaultValuesChange?.(next);
	};

	// Stage a change: push immediately when autoRun=true; buffer when false.
	const stage = (next: string[]) => {
		if (autoRun) {
			apply(next);
		} else {
			setPending(next);
		}
	};

	// Commit buffered pending selection to the store (Apply button).
	const commit = () => apply(pending);

	// Toggle a single value, respecting multiSelect.
	const toggleValue = (o: string) => {
		const current = pending;
		let next: string[];
		if (!multiSelect) {
			next = current.includes(o) ? [] : [o];
		} else {
			next = current.includes(o)
				? current.filter((x) => x !== o)
				: [...current, o];
		}
		stage(next);
	};

	// Clear all: reset both selected and pending, and push empty to store immediately.
	// Also resets date range inputs when in datepicker range mode.
	const clearAll = () => {
		setPending([]);
		apply([]);
		if (displayType === "datepicker" && multiSelect) {
			setDateRangeStart("");
			setDateRangeEnd("");
		}
	};

	// For slider: reset handles to full range (= no active filter)
	const resetSlider = () => {
		if (isNumeric) {
			setSliderLo(numericMin);
			setSliderHi(numericMax);
		} else {
			setSliderLo(0);
			setSliderHi(options.length - 1);
		}
		apply([]);
	};

	// Remove a single value from pending (used by chips and date chip removes)
	const removeValue = (o: string) => stage(pending.filter((x) => x !== o));

	// NOTE: intentionally do NOT clear the filter on unmount. The filter widget
	// unmounts whenever its sheet isn't active, but the filter must keep applying
	// to targeted visualizations on other sheets. The store is per-dashboard-mount,
	// so it resets when the viewer leaves the dashboard.

	// What the UI shows (pending when buffering; selected when auto-run)
	const displaySelected = autoRun ? selected : pending;
	const selectedSet = new Set(displaySelected);
	const misconfigured =
		displayType === "float"
			? targets.length === 0
			: !column || targets.length === 0;
	const hasPendingChange =
		!autoRun && JSON.stringify(pending) !== JSON.stringify(selected);

	// Slider helpers
	// Non-numeric: stage by index range
	const stageSliderIdx = (lo: number, hi: number) => {
		stage(options.slice(lo, hi + 1));
	};
	// Numeric: stage all options whose numeric value falls within [lo, hi]
	const stageSliderNum = (lo: number, hi: number) => {
		stage(
			options.filter((o) => {
				const n = Number(o);
				return n >= lo && n <= hi;
			}),
		);
	};

	// Shared range-input CSS
	// Circle thumb, hidden default track (custom track drawn behind the input).
	const THUMB_CSS = [
		"appearance-none bg-transparent h-full w-full",
		"[&::-webkit-slider-runnable-track]:opacity-0",
		"[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px]",
		"[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
		"[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md",
		"[&::-webkit-slider-thumb]:cursor-grab",
		"[&::-moz-range-track]:opacity-0 [&::-moz-range-thumb]:appearance-none",
		"[&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:w-[18px]",
		"[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white",
		"[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-indigo-600",
		"[&::-moz-range-thumb]:cursor-grab",
	].join(" ");
	// Single handle: normal pointer events
	const SINGLE_INPUT = `absolute inset-0 cursor-pointer ${THUMB_CSS}`;
	// Dual handle: pointer-events on thumb only
	const DUAL_INPUT = `pointer-events-none absolute inset-0 cursor-pointer ${THUMB_CSS} [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto`;

	// Date picker helpers
	// Filter options to those whose date value falls within [start, end].
	// Uses string comparison (YYYY-MM-DD is lexicographically ordered) with a
	// Date parse fallback for other date formats.
	const applyDateRange = (start: string, end: string) => {
		if (!start && !end) {
			stage([]);
			return;
		}
		const s = start ? new Date(start).getTime() : -Infinity;
		const e = end ? new Date(`${end}T23:59:59`).getTime() : Infinity;
		const inRange = options.filter((o) => {
			const t = new Date(o).getTime();
			return !Number.isNaN(t) && t >= s && t <= e;
		});
		// If nothing matches, stage a sentinel so the filter stays active (empty values = inactive).
		stage(inRange.length > 0 ? inRange : ["\x00"]);
	};
	// When the filter is externally cleared, reset the range inputs.
	useEffect(() => {
		if (displayType !== "datepicker" || !multiSelect) return;
		if (displaySelected.length === 0) {
			setDateRangeStart("");
			setDateRangeEnd("");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [displayType, multiSelect, displaySelected.length]);

	// Typeahead helpers
	const typeaheadSelect = (o: string) => {
		apply([o]);
		setQ(o);
		setOpen(false);
	};

	// Float helpers
	// Columns from all targets: runtime headers take precedence; schema columns
	// (cached from target vizzes' metadata) fill in before queries have run.
	const floatColumns = useMemo(() => {
		if (displayType !== "float") return [];
		const seen = new Set<string>();
		const runtimeCols = targetData.flatMap((t) => t.data?.headers ?? []);
		// Merge runtime + schema; runtime first so they win on duplicates.
		const merged = [...runtimeCols, ...(floatSchemaColumns ?? [])];
		return merged.filter((h) => {
			if (!h || seen.has(h)) return false;
			seen.add(h);
			return true;
		});
	}, [displayType, targetData, floatSchemaColumns]);
	const floatRows = useMemo(
		() =>
			displayType === "float"
				? (targetData.flatMap((t) => t.data?.rows ?? []) as Array<
						Record<string, unknown>
					>)
				: [],
		[displayType, targetData],
	);
	// Count leaf condition nodes in the committed rule tree (for the trigger label).
	const countConditions = (group: VizFilterGroup): number =>
		group.children.reduce(
			(sum, child) =>
				child.kind === "condition"
					? sum + 1
					: sum + countConditions(child),
			0,
		);
	const floatRuleCount = vizFilterIsActive(floatRules)
		? countConditions(floatRules)
		: 0;
	// Commit draft rules to the store and persist to config (editor), then close.
	const handleFloatSave = () => {
		setFloatRules(draftRules);
		if (vizFilterIsActive(draftRules)) {
			store?.setFilter({
				id: vizId,
				column: "",
				values: [],
				targets,
				rules: draftRules,
			});
		} else {
			store?.clearFilter(vizId);
		}
		onFloatRulesSave?.(draftRules);
		setFloatOpen(false);
	};
	// Clear committed rules from the trigger (also resets draft and persists the empty state).
	const handleFloatClear = () => {
		const empty = makeVizFilterGroup("AND");
		setFloatRules(empty);
		setDraftRules(empty);
		store?.clearFilter(vizId);
		onFloatRulesSave?.(empty);
	};
	// Open the panel: reset draft to current committed rules, compute position.
	const openFloat = () => {
		setDraftRules(floatRules);
		const el = floatTriggerRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const width = Math.max(r.width, 340);
		const left = Math.max(
			8,
			Math.min(r.left, window.innerWidth - width - 8),
		);
		const spaceBelow = window.innerHeight - r.bottom - 8;
		const spaceAbove = r.top - 8;
		const below = spaceBelow >= 200 || spaceBelow >= spaceAbove;
		const maxH = Math.max(
			120,
			Math.min(520, below ? spaceBelow : spaceAbove),
		);
		const top = below ? r.bottom + 4 : r.top - maxH - 4;
		setFloatPos({ top, left, width, maxH });
		setFloatOpen(true);
	};
	// Close when clicking outside both the trigger and the panel.
	useEffect(() => {
		if (!floatOpen) return;
		const handler = (e: MouseEvent) => {
			if (
				floatTriggerRef.current?.contains(e.target as Node) ||
				floatPanelRef.current?.contains(e.target as Node)
			)
				return;
			setFloatOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [floatOpen]);

	return (
		<div className="flex h-full w-full flex-col gap-2 p-2">
			<div className="flex items-center gap-1.5 font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
				<FilterIcon className="h-3.5 w-3.5" />
				{title || "Filter"}
			</div>

			{misconfigured ? (
				<p className="text-[12px] text-stone-400">
					{displayType === "float"
						? "Select which visualizations this filter targets in the editor."
						: !column
							? "Choose a column to filter on in the editor."
							: "Select which visualizations this filter targets in the editor."}
				</p>
			) : (
				<>
					{/* Float: dropdown trigger + portal panel with rule builder */}
					{displayType === "float" && (
						<div ref={floatTriggerRef}>
							{/* Trigger row */}
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() =>
										floatOpen
											? setFloatOpen(false)
											: openFloat()
									}
									className="flex flex-1 items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-left text-[13px] hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								>
									{floatRuleCount > 0 && (
										<span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
									)}
									<span className="flex-1 truncate text-stone-600">
										{floatRuleCount > 0
											? `${floatRuleCount} rule${floatRuleCount === 1 ? "" : "s"} active`
											: "Add rules…"}
									</span>
									<ChevronDown
										className={`h-3.5 w-3.5 flex-shrink-0 text-stone-400 transition-transform ${floatOpen ? "rotate-180" : ""}`}
									/>
								</button>
								{floatRuleCount > 0 && (
									<button
										type="button"
										onClick={handleFloatClear}
										className="font-medium text-[11px] text-stone-400 hover:text-stone-700"
									>
										Clear
									</button>
								)}
							</div>
							{/* Portal panel */}
							{floatOpen &&
								floatPos &&
								createPortal(
									<div
										ref={floatPanelRef}
										className="fixed z-[9999] flex flex-col rounded-lg border border-stone-200 bg-white shadow-soft-lg"
										style={{
											top: floatPos.top,
											left: floatPos.left,
											width: floatPos.width,
											maxHeight: floatPos.maxH,
										}}
									>
										{/* Panel header */}
										<div className="flex flex-shrink-0 items-center justify-between border-stone-100 border-b px-3 py-2">
											<span className="font-semibold text-[12px] text-stone-600">
												Filter Rules
											</span>
											<button
												type="button"
												onClick={() =>
													setFloatOpen(false)
												}
												className="rounded p-0.5 text-stone-400 hover:text-stone-600"
												title="Discard changes"
											>
												<X className="h-3.5 w-3.5" />
											</button>
										</div>
										{/* Float; view mode changes apply immediately */}
										<div className="flex-1 overflow-y-auto p-3">
											<FilterVisualization
												columns={floatColumns}
												rows={floatRows}
												value={draftRules}
												onChange={(next) => {
													setDraftRules(next);
													if (!isEditing) {
														// View mode: push every change straight to the store.
														setFloatRules(next);
														if (
															vizFilterIsActive(
																next,
															)
														) {
															store?.setFilter({
																id: vizId,
																column: "",
																values: [],
																targets,
																rules: next,
															});
														} else {
															store?.clearFilter(
																vizId,
															);
														}
													}
												}}
												onReset={() => {
													const empty =
														makeVizFilterGroup(
															"AND",
														);
													setDraftRules(empty);
													if (!isEditing) {
														setFloatRules(empty);
														store?.clearFilter(
															vizId,
														);
													}
												}}
											/>
										</div>
										{/* Panel footer: Save/Cancel in editor; Close only in view */}
										<div className="flex flex-shrink-0 items-center justify-end gap-2 border-stone-100 border-t px-3 py-2">
											{isEditing ? (
												<>
													<button
														type="button"
														onClick={() =>
															setFloatOpen(false)
														}
														className="rounded-lg border border-stone-200 px-3 py-1.5 font-medium text-[12px] text-stone-600 hover:bg-stone-50"
													>
														Cancel
													</button>
													<button
														type="button"
														onClick={
															handleFloatSave
														}
														className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-[12px] text-white hover:bg-indigo-700"
													>
														Save
													</button>
												</>
											) : (
												<button
													type="button"
													onClick={() =>
														setFloatOpen(false)
													}
													className="rounded-lg border border-stone-200 px-3 py-1.5 font-medium text-[12px] text-stone-600 hover:bg-stone-50"
												>
													Close
												</button>
											)}
										</div>
									</div>,
									document.body,
								)}
						</div>
					)}

					{/* Column label + Clear button (not shown for float) */}
					{displayType !== "float" && (
						<div className="flex items-center justify-between">
							<span className="text-[11px] text-stone-500">
								{column}
							</span>
							{(displaySelected.length > 0 ||
								(displayType === "datepicker" &&
									multiSelect &&
									(dateRangeStart || dateRangeEnd))) && (
								<button
									type="button"
									onClick={
										displayType === "slider"
											? resetSlider
											: clearAll
									}
									className="font-medium text-[11px] text-stone-400 hover:text-stone-700"
								>
									{displayType === "slider"
										? "Reset range"
										: "Clear"}
								</button>
							)}
						</div>
					)}

					{/*Display type renderers */}
					{displayType === "dropdown" && (
						<div className="relative">
							{/* biome-ignore lint/a11y/noStaticElementInteractions: the real interactive control is the nested <input>, which already opens on focus/keyboard; this click is a mouse convenience for the surrounding padding. */}
							{/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard access is handled by the nested <input>'s own focus/key handling. */}
							<div
								ref={anchorRef}
								onClick={() => setOpen(true)}
								className="flex cursor-text flex-wrap items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20"
							>
								{displaySelected.map((s) => (
									<span
										key={s}
										className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-[12px] text-indigo-700"
									>
										{s}
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												removeValue(s);
											}}
											className="text-indigo-400 hover:text-indigo-700"
										>
											<X className="h-3 w-3" />
										</button>
									</span>
								))}
								<input
									className="min-w-[60px] flex-1 bg-transparent text-[13px] outline-none"
									value={q}
									placeholder={
										displaySelected.length
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
															toggleValue(o);
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
					)}

					{displayType === "checklist" && (
						<div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
							<div className="border-stone-100 border-b px-2 py-1.5">
								<input
									value={q}
									onChange={(e) => setQ(e.target.value)}
									placeholder="Search…"
									className="w-full bg-transparent text-[13px] outline-none placeholder:text-stone-400"
								/>
							</div>
							<ul className="max-h-48 overflow-y-auto py-1">
								{filtered.length === 0 && (
									<li className="px-3 py-1.5 text-[12px] text-stone-400">
										No matches
									</li>
								)}
								{filtered.map((o) => {
									const on = selectedSet.has(o);
									return (
										<li key={o}>
											<label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-50">
												<input
													type="checkbox"
													checked={on}
													onChange={() =>
														toggleValue(o)
													}
													className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
												/>
												<span className="truncate">
													{o}
												</span>
											</label>
										</li>
									);
								})}
							</ul>
						</div>
					)}

					{displayType === "slider" && (
						<div className="space-y-3 pb-1">
							{options.length < 2 ? (
								<p className="text-[12px] text-stone-400">
									Not enough values to display a slider.
								</p>
							) : isNumeric ? (
								// ── Numeric slider — min/max are actual numeric bounds ────
								<>
									<div className="flex justify-between font-semibold text-[12px] text-stone-700">
										<span>{sliderLo}</span>
										{multiSelect &&
											sliderLo !== sliderHi && (
												<span>{sliderHi}</span>
											)}
									</div>
									<div className="relative flex h-5 items-center">
										{/* Grey track */}
										<div className="absolute right-0 left-0 h-1.5 rounded-full bg-stone-200" />
										{/* Active fill */}
										<div
											className="pointer-events-none absolute h-1.5 rounded-full bg-indigo-500"
											style={{
												left: `${((sliderLo - numericMin) / (numericMax - numericMin)) * 100}%`,
												right: `${((numericMax - sliderHi) / (numericMax - numericMin)) * 100}%`,
											}}
										/>
										{multiSelect ? (
											<>
												<input
													type="range"
													min={numericMin}
													max={numericMax}
													step={numericStep}
													value={sliderLo}
													onChange={(e) => {
														const lo = Math.min(
															Number(
																e.target.value,
															),
															sliderHi,
														);
														setSliderLo(lo);
														stageSliderNum(
															lo,
															sliderHi,
														);
													}}
													className={DUAL_INPUT}
													style={{
														zIndex:
															sliderLo >= sliderHi
																? 5
																: 3,
													}}
												/>
												<input
													type="range"
													min={numericMin}
													max={numericMax}
													step={numericStep}
													value={sliderHi}
													onChange={(e) => {
														const hi = Math.max(
															Number(
																e.target.value,
															),
															sliderLo,
														);
														setSliderHi(hi);
														stageSliderNum(
															sliderLo,
															hi,
														);
													}}
													className={DUAL_INPUT}
													style={{ zIndex: 4 }}
												/>
											</>
										) : (
											<input
												type="range"
												min={numericMin}
												max={numericMax}
												step={numericStep}
												value={sliderLo}
												onChange={(e) => {
													const val = Number(
														e.target.value,
													);
													setSliderLo(val);
													stageSliderNum(val, val);
												}}
												className={SINGLE_INPUT}
												style={{ zIndex: 4 }}
											/>
										)}
									</div>
									<div className="flex justify-between text-[11px] text-stone-400">
										<span>{numericMin}</span>
										<span>{numericMax}</span>
									</div>
								</>
							) : (
								// ── Non-numeric slider — index-based, unreachable ends ────
								// The grey track extends full-width; the thumb range is inset
								// by 12px on each side so the leftmost/rightmost positions are
								// visually clear of the container edge ("unreachable ends").
								<>
									<div className="flex justify-between font-semibold text-[12px] text-stone-700">
										<span>{options[sliderLo]}</span>
										{multiSelect &&
											sliderLo !== sliderHi && (
												<span>{options[sliderHi]}</span>
											)}
									</div>

									{/* Outer container: full-width grey track bleeds to edges */}
									<div className="relative flex h-6 items-center">
										{/* Full-width grey track — includes unreachable zones */}
										<div className="absolute right-0 left-0 h-1.5 rounded-full bg-stone-200" />

										{/* Inset area: thumbs + ticks + active fill live here */}
										<div className="absolute inset-x-3 flex h-full items-center">
											{/* Active fill */}
											<div
												className="pointer-events-none absolute h-1.5 rounded-full bg-indigo-500"
												style={{
													left: `${(sliderLo / (options.length - 1)) * 100}%`,
													right: `${((options.length - 1 - sliderHi) / (options.length - 1)) * 100}%`,
												}}
											/>

											{/* Tick marks — one per value, sitting on the track */}
											{options.map((o, i) => (
												<div
													key={o}
													className="pointer-events-none absolute h-3 w-px bg-stone-400/60"
													style={{
														left: `${(i / (options.length - 1)) * 100}%`,
														top: "50%",
														transform:
															"translateX(-50%) translateY(-50%)",
													}}
												/>
											))}

											{/* Range inputs */}
											{multiSelect ? (
												<>
													<input
														type="range"
														min={0}
														max={options.length - 1}
														step={1}
														value={sliderLo}
														onChange={(e) => {
															const lo = Math.min(
																Number(
																	e.target
																		.value,
																),
																sliderHi,
															);
															setSliderLo(lo);
															stageSliderIdx(
																lo,
																sliderHi,
															);
														}}
														className={DUAL_INPUT}
														style={{
															zIndex:
																sliderLo >=
																sliderHi
																	? 5
																	: 3,
														}}
													/>
													<input
														type="range"
														min={0}
														max={options.length - 1}
														step={1}
														value={sliderHi}
														onChange={(e) => {
															const hi = Math.max(
																Number(
																	e.target
																		.value,
																),
																sliderLo,
															);
															setSliderHi(hi);
															stageSliderIdx(
																sliderLo,
																hi,
															);
														}}
														className={DUAL_INPUT}
														style={{ zIndex: 4 }}
													/>
												</>
											) : (
												<input
													type="range"
													min={0}
													max={options.length - 1}
													step={1}
													value={sliderLo}
													onChange={(e) => {
														const val = Number(
															e.target.value,
														);
														setSliderLo(val);
														stage([options[val]]);
													}}
													className={SINGLE_INPUT}
													style={{ zIndex: 4 }}
												/>
											)}
										</div>
									</div>

									{/* Tick labels — inset to match thumb positions (mx-3) */}
									{options.length <= 8 ? (
										<div className="relative mx-3 h-4">
											{options.map((o, i) => (
												<span
													key={o}
													className="-translate-x-1/2 absolute whitespace-nowrap text-[10px] text-stone-400 leading-none"
													style={{
														left: `${(i / (options.length - 1)) * 100}%`,
													}}
												>
													{o}
												</span>
											))}
										</div>
									) : (
										<div className="mx-3 flex justify-between text-[10px] text-stone-400">
											<span>{options[0]}</span>
											<span>
												{options[options.length - 1]}
											</span>
										</div>
									)}
								</>
							)}
						</div>
					)}

					{displayType === "typeahead" && (
						<div className="relative" ref={anchorRef}>
							<input
								className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
								value={q}
								placeholder="Type to search…"
								onChange={(e) => {
									setQ(e.target.value);
									setOpen(true);
								}}
								onFocus={() => {
									setOpen(true);
									setQ("");
								}}
								onBlur={() =>
									setTimeout(() => {
										setOpen(false);
										if (!selected.length) setQ("");
										else setQ(selected[0] ?? "");
									}, 120)
								}
							/>
							{selected.length > 0 && !open && (
								<button
									type="button"
									onClick={() => {
										clearAll();
										setQ("");
									}}
									className="-translate-y-1/2 absolute top-1/2 right-2 text-stone-400 hover:text-stone-600"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
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
											const on = selected[0] === o;
											return (
												<li key={o}>
													<button
														type="button"
														onMouseDown={(e) => {
															e.preventDefault();
															typeaheadSelect(o);
														}}
														className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-stone-50 ${on ? "font-semibold text-indigo-600" : "text-stone-700"}`}
													>
														{on && (
															<Check className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
														)}
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
					)}

					{displayType === "datepicker" && (
						<div className="space-y-2">
							{multiSelect ? (
								// Range mode: Start → End date pickers
								<div className="flex items-end gap-2">
									<div className="flex-1">
										<p className="mb-1 font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
											Start
										</p>
										<input
											type="date"
											value={dateRangeStart}
											onChange={(e) => {
												const val = e.target.value;
												setDateRangeStart(val);
												applyDateRange(
													val,
													dateRangeEnd,
												);
											}}
											className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[13px] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
									</div>
									<span className="mb-2.5 flex-shrink-0 text-[12px] text-stone-400">
										to
									</span>
									<div className="flex-1">
										<p className="mb-1 font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
											End
										</p>
										<input
											type="date"
											value={dateRangeEnd}
											min={dateRangeStart || undefined}
											onChange={(e) => {
												const val = e.target.value;
												setDateRangeEnd(val);
												applyDateRange(
													dateRangeStart,
													val,
												);
											}}
											className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[13px] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
									</div>
								</div>
							) : (
								// Single date: controlled input — selected date stays visible
								<input
									type="date"
									value={displaySelected[0] ?? ""}
									onChange={(e) => {
										const val = e.target.value;
										stage(val ? [val] : []);
									}}
									className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								/>
							)}
						</div>
					)}

					{displayType === "button" && (
						<div
							className={
								buttonLayout === "vertical"
									? "flex flex-col items-stretch gap-1.5"
									: "flex flex-wrap gap-1.5"
							}
						>
							{options.length === 0 && (
								<p className="text-[12px] text-stone-400">
									No values loaded yet.
								</p>
							)}
							{options.map((o) => {
								const on = selectedSet.has(o);
								return (
									<button
										key={o}
										type="button"
										onClick={() => toggleValue(o)}
										className={`rounded-md px-3 py-1.5 font-medium text-[13px] transition-colors ${
											on
												? "bg-indigo-600 text-white"
												: "bg-stone-100 text-stone-600 hover:bg-stone-200"
										} ${buttonLayout === "vertical" ? "w-full text-left" : ""}`}
									>
										{o}
									</button>
								);
							})}
						</div>
					)}

					{/* Apply button — shown when autoRun is off (not applicable to float) */}
					{!autoRun && displayType !== "float" && (
						<button
							type="button"
							onClick={commit}
							disabled={!hasPendingChange}
							className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-[13px] text-white transition-opacity hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Apply
						</button>
					)}

					{displayType !== "float" && (
						<p className="text-[11px] text-stone-400">
							{displaySelected.length
								? `${displaySelected.length} value${displaySelected.length === 1 ? "" : "s"} · filtering ${targets.length} visualization${targets.length === 1 ? "" : "s"}`
								: `Targets ${targets.length} visualization${targets.length === 1 ? "" : "s"}`}
						</p>
					)}

					{/* Hint ONLY when the filter genuinely has no values to offer. If
                        options exist, the data is clearly loaded — never nag in that case
                        (otherwise a single slow/cross-sheet target falsely reads "not loaded"
                        even though every chart on screen is populated). */}
					{column &&
						options.length === 0 &&
						displayType !== "datepicker" &&
						displayType !== "float" && (
							<p className="text-[11px] text-amber-600">
								{loadedCount === 0
									? `No data loaded from the targeted visualization${targets.length === 1 ? "" : "s"} yet — run ${targets.length === 1 ? "its query" : "their queries"} to populate filter options.`
									: `No values found for "${column}" in the loaded data — check the column exists in the targeted visualizations.`}
							</p>
						)}
				</>
			)}
		</div>
	);
}
