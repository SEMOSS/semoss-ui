/**
 * Event-triggered parameter store.
 *
 * When a "Custom Query" event fires on a source visualization, it calls
 * `store.trigger(targetVizId, paramValues)`. The target DashboardVisualization
 * subscribes via `useEventParamState(vizId)` and re-runs its query with the
 * injected parameter values. Event params never appear on the shared param sheet.
 *
 * Pattern mirrors FilterStore / FilterContext in dashboardFilters.tsx.
 */
import type React from "react";
import { createContext, useContext, useRef, useSyncExternalStore } from "react";

class EventParamStore {
	private paramValues = new Map<string, Record<string, string>>();
	private runCounters = new Map<string, number>();
	private versions = new Map<string, number>();
	private listeners = new Set<() => void>();
	private focusListeners = new Set<(vizId: string) => void>();

	subscribe = (cb: () => void): (() => void) => {
		this.listeners.add(cb);
		return () => this.listeners.delete(cb);
	};

	private emit() {
		this.listeners.forEach((l) => l());
	}

	/** Fire event: set param values for a target viz and bump its run counter. */
	trigger(vizId: string, paramValues: Record<string, string>): void {
		this.paramValues.set(vizId, paramValues);
		this.runCounters.set(vizId, (this.runCounters.get(vizId) ?? 0) + 1);
		this.versions.set(vizId, (this.versions.get(vizId) ?? 0) + 1);
		this.emit();
		this.focusListeners.forEach((cb) => cb(vizId));
	}

	getParamValues(vizId: string): Record<string, string> {
		return this.paramValues.get(vizId) ?? {};
	}

	getRunCounter(vizId: string): number {
		return this.runCounters.get(vizId) ?? 0;
	}

	getVersion(vizId: string): number {
		return this.versions.get(vizId) ?? 0;
	}

	/** Register a listener called after every trigger to bring the target into focus. */
	onFocus(cb: (vizId: string) => void): () => void {
		this.focusListeners.add(cb);
		return () => this.focusListeners.delete(cb);
	}
}

const EventParamContext = createContext<EventParamStore | null>(null);

export function EventParamProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const ref = useRef<EventParamStore | null>(null);
	if (!ref.current) ref.current = new EventParamStore();
	return (
		<EventParamContext.Provider value={ref.current}>
			{children}
		</EventParamContext.Provider>
	);
}

export function useEventParamStore(): EventParamStore | null {
	return useContext(EventParamContext);
}

const NOOP_SUBSCRIBE = () => () => {};

/**
 * Subscribe to the event param state for `vizId`. Re-renders only when this
 * viz's event params are triggered. Returns the latest param values and the
 * run counter (which bumps on every trigger, gating query re-execution).
 */
export function useEventParamState(vizId: string): {
	paramValues: Record<string, string>;
	runCounter: number;
} {
	const store = useContext(EventParamContext);
	useSyncExternalStore(
		store ? store.subscribe : NOOP_SUBSCRIBE,
		() => (store ? store.getVersion(vizId) : 0),
		() => 0,
	);
	return {
		paramValues: store ? store.getParamValues(vizId) : {},
		runCounter: store ? store.getRunCounter(vizId) : 0,
	};
}

export type { EventParamStore };
