import { useSyncExternalStore } from "react";

// one shared timer per interval, however many components show the time
const clocks = new Map<number, Clock>();

interface Clock {
	now: number;
	listeners: Set<() => void>;
	timer?: number;
	// stable per clock: a new subscribe each render would make React resubscribe every render
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => number;
}

function clockFor(intervalMs: number): Clock {
	const existing = clocks.get(intervalMs);
	if (existing) return existing;
	const clock: Clock = {
		now: Date.now(),
		listeners: new Set(),
		subscribe: (listener) => {
			clock.listeners.add(listener);
			if (clock.timer === undefined) {
				// a clock idle for a while starts from now; React re-reads the snapshot after subscribing
				clock.now = Date.now();
				schedule();
			}
			return () => {
				clock.listeners.delete(listener);
				if (clock.listeners.size === 0) {
					window.clearTimeout(clock.timer);
					clock.timer = undefined;
				}
			};
		},
		getSnapshot: () => clock.now,
	};
	// land on the next whole interval so minute clocks change on the minute
	const schedule = () => {
		clock.timer = window.setTimeout(
			() => {
				clock.now = Date.now();
				for (const listener of clock.listeners) listener();
				schedule();
			},
			intervalMs - (Date.now() % intervalMs),
		);
	};
	clocks.set(intervalMs, clock);
	return clock;
}

/** The current time in ms, updated every intervalMs through one timer shared by every caller. */
export function useNow(intervalMs = 60_000): number {
	const clock = clockFor(intervalMs);
	return useSyncExternalStore(clock.subscribe, clock.getSnapshot);
}
