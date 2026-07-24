/**
 * Dashboard cross-frame filters.
 *
 * A "Filter" visualization widget lets a viewer pick a column value that is
 * applied — client-side — to the loaded rows of a chosen set of OTHER
 * visualizations ("frames"). The key requirement is selective re-render: when a
 * filter value changes, ONLY the visualizations it targets re-render, not the
 * whole dashboard.
 *
 * How the isolation works:
 *   • Filter state lives in a module-style store OUTSIDE any React parent's
 *     useState, so changing it never re-renders the parent (DashboardPage /
 *     ViewMode).
 *   • Each visualization subscribes via `useAppliedFilters(vizId)`, whose
 *     `getSnapshot` returns a per-viz integer version. The store bumps that
 *     version only for the vizIds a changed filter targets. React's
 *     useSyncExternalStore bails out of re-rendering any component whose
 *     snapshot is unchanged — so untargeted visualizations stay put.
 */
import type React from "react";
import { createContext, useContext, useRef, useSyncExternalStore } from "react";

export interface AppliedFilter {
	/** The filter widget's own visualization id (one active filter per widget). */
	id: string;
	/** Column name to match against in each targeted frame's rows. */
	column: string;
	/** Selected values — a row matches if its cell equals ANY of these (SQL IN). Empty = inactive. */
	values: string[];
	/** Visualization ids this filter applies to. */
	targets: string[];
}

/** A visualization's currently-loaded rows, published so filter widgets can read
 *  them WITHOUT running a query of their own. */
export interface VizData {
	headers: string[];
	rows: Record<string, any>[];
}

class FilterStore {
	private filters = new Map<string, AppliedFilter>();
	private versions = new Map<string, number>();
	private listeners = new Set<() => void>();
	// Registry of each visualization's loaded rows (published by the viz on load).
	private vizData = new Map<string, VizData>();
	private dataVersions = new Map<string, number>();

	subscribe = (cb: () => void): (() => void) => {
		this.listeners.add(cb);
		return () => {
			this.listeners.delete(cb);
		};
	};

	private emit() {
		this.listeners.forEach((l) => l());
	}

	private bump(vizId: string) {
		this.versions.set(vizId, (this.versions.get(vizId) ?? 0) + 1);
	}

	// ── Viz data registry ─────────────────────────────────────────────────────
	/** A visualization publishes its loaded rows so filter widgets can derive
	 *  options from them (no own query needed). Bumps only the DATA version, so
	 *  filter-subscribed vizzes don't re-render — only widgets watching this data do. */
	publishVizData = (
		vizId: string,
		headers: string[],
		rows: Record<string, any>[],
	) => {
		this.vizData.set(vizId, { headers, rows });
		this.dataVersions.set(vizId, (this.dataVersions.get(vizId) ?? 0) + 1);
		this.emit();
	};

	/** Loaded rows for a visualization, if it has published any. */
	getVizData = (vizId: string): VizData | undefined =>
		this.vizData.get(vizId);

	/** Per-viz DATA version — changes only when that viz publishes new rows. */
	getDataVersion = (vizId: string): number =>
		this.dataVersions.get(vizId) ?? 0;

	/** Per-viz version — a primitive that only changes when a filter targeting it changes. */
	getVizVersion = (vizId: string): number => this.versions.get(vizId) ?? 0;

	/** Set (or, when no values are selected, clear) the filter owned by a filter widget. */
	setFilter(next: AppliedFilter) {
		const prev = this.filters.get(next.id);
		// Every viz that was OR is now targeted must be re-evaluated.
		const affected = new Set<string>([
			...(prev?.targets ?? []),
			...next.targets,
		]);
		if (next.values.length) this.filters.set(next.id, next);
		else this.filters.delete(next.id);
		affected.forEach((v) => this.bump(v));
		this.emit();
	}

	/** Remove a filter entirely (e.g. when the widget unmounts). */
	clearFilter(id: string) {
		const prev = this.filters.get(id);
		if (!prev) return;
		this.filters.delete(id);
		prev.targets.forEach((v) => this.bump(v));
		this.emit();
	}

	/** The filter owned by a specific filter widget (for restoring its UI on remount). */
	getFilter(id: string): AppliedFilter | undefined {
		return this.filters.get(id);
	}

	/** Active filters that apply to a given visualization. */
	getFiltersFor(vizId: string): AppliedFilter[] {
		const out: AppliedFilter[] = [];
		this.filters.forEach((f) => {
			if (f.values.length && f.column && f.targets.includes(vizId))
				out.push(f);
		});
		return out;
	}
}

const FilterContext = createContext<FilterStore | null>(null);

/** Provides a fresh filter store for the lifetime of one dashboard mount. */
export function DashboardFilterProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const ref = useRef<FilterStore | null>(null);
	if (!ref.current) ref.current = new FilterStore();
	return (
		<FilterContext.Provider value={ref.current}>
			{children}
		</FilterContext.Provider>
	);
}

/** The store instance (for filter widgets to call setFilter/clearFilter). */
export function useFilterStore(): FilterStore | null {
	return useContext(FilterContext);
}

const NOOP_SUBSCRIBE = () => () => {};

/**
 * Subscribe to the filters targeting `vizId`. The calling component re-renders
 * ONLY when a filter that targets this viz changes. Returns the active filters
 * so the caller can apply them to its rows.
 */
export function useAppliedFilters(vizId: string): AppliedFilter[] {
	const store = useContext(FilterContext);
	useSyncExternalStore(
		store ? store.subscribe : NOOP_SUBSCRIBE,
		() => (store ? store.getVizVersion(vizId) : 0),
		() => 0,
	);
	return store ? store.getFiltersFor(vizId) : [];
}

/**
 * Subscribe to the LOADED DATA of a set of target visualizations. The calling
 * component re-renders when any target publishes new rows. Returns, per target,
 * its loaded data (or undefined if it hasn't loaded yet) — so a filter widget can
 * build its options from the targets' rows and warn about ones not yet loaded.
 */
export function useTargetData(
	targets: string[],
): { id: string; data: VizData | undefined }[] {
	const store = useContext(FilterContext);
	const key = targets.join("|");
	useSyncExternalStore(
		store ? store.subscribe : NOOP_SUBSCRIBE,
		() => {
			if (!store) return "0";
			// Combined snapshot: a string of each target's data version. Changes
			// whenever any target publishes, so the widget re-derives its options.
			return (
				targets.map((t) => store.getDataVersion(t)).join("|") +
				"#" +
				key
			);
		},
		() => "0",
	);
	if (!store) return targets.map((id) => ({ id, data: undefined }));
	return targets.map((id) => ({ id, data: store.getVizData(id) }));
}

/**
 * Distinct values for `column` across a set of target data sets, sorted naturally.
 * Used to build a filter widget's dropdown options from its targets' loaded rows.
 */
export function distinctValuesFor(
	column: string,
	datasets: (VizData | undefined)[],
): string[] {
	if (!column) return [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const ds of datasets) {
		if (!ds?.rows?.length) continue;
		for (const r of ds.rows) {
			const v = r?.[column];
			if (v == null) continue;
			const s = String(v);
			if (s && !seen.has(s)) {
				seen.add(s);
				out.push(s);
			}
		}
	}
	return out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** Apply client-side multi-value (IN) filters to a set of rows. */
export function applyFilters<T extends Record<string, any>>(
	rows: T[],
	filters: AppliedFilter[],
): T[] {
	if (!filters.length || !Array.isArray(rows) || !rows.length) return rows;
	const sets = filters.map((f) => ({
		column: f.column,
		set: new Set(f.values.map(String)),
	}));
	return rows.filter((row) =>
		sets.every((f) => {
			const cell = row?.[f.column];
			return cell != null && f.set.has(String(cell));
		}),
	);
}

export type { FilterStore };
