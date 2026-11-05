import { useSyncExternalStore } from "react";

// one shared timer per interval, however many components show the time
const clocks = new Map<number, Clock>();

interface Clock {
	now: number;
	listeners: Set<() => void>;
	timer?: number;
}

function tick(clock: Clock, intervalMs: number) {
	clock.now = Date.now();
	for (const listener of clock.listeners) listener();
	// land on the next whole interval so minute clocks change on the minute
	clock.timer = window.setTimeout(
		() => tick(clock, intervalMs),
		intervalMs - (Date.now() % intervalMs),
	);
}

function clockFor(intervalMs: number): Clock {
	let clock = clocks.get(intervalMs);
	if (!clock) {
		clock = { now: Date.now(), listeners: new Set() };
		clocks.set(intervalMs, clock);
	}
	return clock;
}

/** The current time in ms, updated every intervalMs through one timer shared by every caller. */
export function useNow(intervalMs = 60_000): number {
	const clock = clockFor(intervalMs);
	return useSyncExternalStore(
		(listener) => {
			clock.listeners.add(listener);
			if (clock.timer === undefined) tick(clock, intervalMs);
			return () => {
				clock.listeners.delete(listener);
				if (clock.listeners.size === 0) {
					window.clearTimeout(clock.timer);
					clock.timer = undefined;
				}
			};
		},
		() => clock.now,
	);
}
