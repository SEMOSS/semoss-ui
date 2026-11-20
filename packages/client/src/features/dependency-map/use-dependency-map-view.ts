import { useCallback } from "react";
import { useSearchParams } from "react-router";
import type { DependencyDirection } from "@/api/dependency-map";
import {
	type DependencyFamily,
	FAMILY_ORDER,
	type LinkFilter,
} from "./dependency-graph";

/** The lens picked in the toolbar. */
export type LensKind = "none" | "trace" | "access";

/** What the map shows, as kept in the address so a view can be shared. */
export interface DependencyMapViewState {
	/** The search */
	readonly query: string;
	/** The selected item, shown in the inspector */
	readonly selectedId: string;
	/** The selected link, shown in the inspector */
	readonly selectedEdgeId: string;
	/** The lens */
	readonly lens: LensKind;
	/** The trace's root */
	readonly traceRootId: string;
	/** Which way the trace follows links */
	readonly direction: DependencyDirection;
	/** How many links the trace follows, or null for all */
	readonly depth: number | null;
	/** Whether only the traced network is read and drawn */
	readonly tracedOnly: boolean;
	/** The User Access lens's user */
	readonly userId: string;
	/** Whether access gaps are drawn */
	readonly showGaps: boolean;
	/** The families shown, or null for all */
	readonly families: ReadonlySet<DependencyFamily> | null;
	/** The link filter */
	readonly links: LinkFilter;
}

/** A change to the view; an empty or default value is left out of the address. */
export type DependencyMapViewChange = Partial<{
	[K in keyof DependencyMapViewState]: DependencyMapViewState[K];
}>;

export interface UseDependencyMapViewResult {
	/** The view */
	view: DependencyMapViewState;
	/** Changes part of the view, replacing the address without a new history entry */
	setView: (change: DependencyMapViewChange) => void;
	/** Clears the search and filters, keeping the lens and selection */
	clearFilters: () => void;
}

const DIRECTIONS: readonly DependencyDirection[] = [
	"DEPENDENCIES",
	"DEPENDENTS",
	"BOTH",
];
const LENSES: readonly LensKind[] = ["none", "trace", "access"];

const pick = <T extends string>(
	value: string | null,
	options: readonly T[],
	fallback: T,
): T => options.find((option) => option === value) ?? fallback;

const readDepth = (value: string | null): number | null => {
	const depth = Number(value);
	return Number.isInteger(depth) && depth > 0 ? depth : null;
};

const readFamilies = (
	value: string | null,
): ReadonlySet<DependencyFamily> | null => {
	if (value === null) {
		return null;
	}
	return new Set(
		FAMILY_ORDER.filter((family) => value.split(",").includes(family)),
	);
};

/**
 * Reads the view from the address.
 *
 * @param params - The address's search parameters.
 * @returns The view, with anything unknown at its default.
 */
export const readDependencyMapView = (
	params: URLSearchParams,
): DependencyMapViewState => {
	const focus = params.get("focus") ?? "";
	// a link with only `focus` opens the trace on it
	const lens = pick(params.get("lens"), LENSES, focus ? "trace" : "none");
	return {
		query: params.get("q") ?? "",
		selectedId: params.get("selected") ?? focus,
		selectedEdgeId: params.get("link") ?? "",
		lens,
		traceRootId: focus,
		direction: pick(params.get("dir"), DIRECTIONS, "BOTH"),
		depth: readDepth(params.get("depth")),
		tracedOnly: params.get("scope") === "traced",
		userId: params.get("user") ?? "",
		showGaps: params.get("gaps") === "1",
		families: readFamilies(params.get("types")),
		links: params.get("links") ?? "ALL",
	};
};

/**
 * Writes a change to the view into the address, leaving defaults out.
 *
 * @param params - The address's search parameters, changed in place.
 * @param change - The change.
 */
export const writeDependencyMapView = (
	params: URLSearchParams,
	change: DependencyMapViewChange,
): void => {
	const set = (key: string, value: string, isDefault: boolean): void => {
		if (isDefault) {
			params.delete(key);
		} else {
			params.set(key, value);
		}
	};
	if (change.query !== undefined) set("q", change.query, !change.query);
	if (change.selectedId !== undefined)
		set("selected", change.selectedId, !change.selectedId);
	if (change.selectedEdgeId !== undefined)
		set("link", change.selectedEdgeId, !change.selectedEdgeId);
	if (change.lens !== undefined) set("lens", change.lens, false);
	if (change.traceRootId !== undefined)
		set("focus", change.traceRootId, !change.traceRootId);
	if (change.direction !== undefined)
		set("dir", change.direction, change.direction === "BOTH");
	if (change.depth !== undefined)
		set("depth", String(change.depth), change.depth === null);
	if (change.tracedOnly !== undefined)
		set("scope", "traced", !change.tracedOnly);
	if (change.userId !== undefined) set("user", change.userId, !change.userId);
	if (change.showGaps !== undefined) set("gaps", "1", !change.showGaps);
	if (change.families !== undefined)
		set(
			"types",
			FAMILY_ORDER.filter((family) => change.families?.has(family)).join(
				",",
			),
			change.families === null,
		);
	if (change.links !== undefined)
		set("links", change.links, change.links === "ALL");
};

/**
 * The map's view, kept in the address so a view can be shared and survives a
 * reload. Changes replace the address rather than adding history.
 *
 * @returns The view and ways to change it.
 */
export const useDependencyMapView = (): UseDependencyMapViewResult => {
	const [params, setParams] = useSearchParams();
	const setView = useCallback(
		(change: DependencyMapViewChange) => {
			setParams(
				(previous) => {
					const next = new URLSearchParams(previous);
					writeDependencyMapView(next, change);
					return next;
				},
				{ replace: true },
			);
		},
		[setParams],
	);
	const clearFilters = useCallback(
		() => setView({ query: "", families: null, links: "ALL" }),
		[setView],
	);
	return { view: readDependencyMapView(params), setView, clearFilters };
};
