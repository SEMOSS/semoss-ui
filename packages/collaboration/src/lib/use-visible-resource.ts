import { useCallback, useEffect, useRef, useState } from "react";

export interface VisibleResource<T> {
	data: T | null;
	error: string;
	isLoading: boolean;
	checkedAt: Date | null;
	refresh: () => void;
}

export interface PollOptions<T> {
	/**
	 * Wait between reads while the tab is visible. A function of the last data lets a reader poll fast only
	 * while something runs. null reads once (refresh() and tab returns still read).
	 */
	every?: number | null | ((data: T | null) => number | null);
	/** Coming back to the tab re-reads when the last read is at least this old; false never does. */
	refreshOnReturn?: number | false;
}

// failed reads wait longer each time, up to this
const MAX_ERROR_WAIT_MS = 5 * 60_000;

/**
 * The one polling helper for Collaboration snapshots: stale-result guards, no timers while the tab is
 * hidden, a read on return, and error backoff. Pass a number for a plain interval.
 */
export function useVisibleResource<T>(
	load: () => Promise<T>,
	enabled: boolean,
	options: number | PollOptions<T> = {},
): VisibleResource<T> {
	const { every = 60_000, refreshOnReturn = 0 } =
		typeof options === "number" ? { every: options } : options;
	const [state, setState] = useState<Omit<VisibleResource<T>, "refresh">>({
		data: null,
		error: "",
		isLoading: false,
		checkedAt: null,
	});
	const [revision, setRevision] = useState(0);
	const refresh = useCallback(() => setRevision((value) => value + 1), []);
	const generation = useRef(0);
	// callers pass inline functions; read the latest without restarting the poll
	const everyRef = useRef(every);
	everyRef.current = every;
	const data = useRef<T | null>(null);
	// kept across pauses: turning a reader back on (a route, a collapsed nav) reuses fresh data
	const lastReadAt = useRef(0);
	const readFor = useRef<(() => Promise<T>) | null>(null);
	const seenRevision = useRef(revision);
	useEffect(() => {
		if (!enabled) return;
		const forced = revision !== seenRevision.current;
		seenRevision.current = revision;
		const fresh =
			!forced && readFor.current === load && data.current !== null;
		const token = ++generation.current;
		let pending = false;
		let timer: number | undefined;
		let lastRead = fresh ? lastReadAt.current : 0;
		let failures = 0;
		const hidden = () => document.visibilityState === "hidden";
		const schedule = () => {
			window.clearTimeout(timer);
			if (hidden()) return;
			const plan = everyRef.current;
			let wait = typeof plan === "function" ? plan(data.current) : plan;
			if (wait === null || wait <= 0) return;
			if (failures > 0)
				wait = Math.min(
					wait * 2 ** failures,
					Math.max(wait, MAX_ERROR_WAIT_MS),
				);
			timer = window.setTimeout(
				() => void read(),
				Math.max(0, lastRead + wait - Date.now()),
			);
		};
		const read = async () => {
			if (pending || hidden()) return;
			pending = true;
			lastRead = Date.now();
			lastReadAt.current = lastRead;
			setState((current) => ({ ...current, isLoading: true, error: "" }));
			try {
				const next = await load();
				if (generation.current !== token) return;
				data.current = next;
				readFor.current = load;
				failures = 0;
				setState({
					data: next,
					isLoading: false,
					error: "",
					checkedAt: new Date(),
				});
			} catch (cause) {
				if (generation.current !== token) return;
				failures++;
				setState((current) => ({
					...current,
					isLoading: false,
					error:
						cause instanceof Error
							? cause.message
							: "This section could not be refreshed.",
				}));
			} finally {
				pending = false;
				if (generation.current === token) schedule();
			}
		};
		// focus and visibilitychange both fire on return; the pending guard and the gap keep it to one read
		const onReturn = () => {
			if (hidden()) return window.clearTimeout(timer);
			if (
				refreshOnReturn !== false &&
				Date.now() - lastRead >= refreshOnReturn
			)
				void read();
			else if (!pending) schedule();
		};
		if (fresh) schedule();
		else void read();
		window.addEventListener("focus", onReturn);
		document.addEventListener("visibilitychange", onReturn);
		return () => {
			generation.current++;
			window.clearTimeout(timer);
			window.removeEventListener("focus", onReturn);
			document.removeEventListener("visibilitychange", onReturn);
		};
	}, [enabled, load, refreshOnReturn, revision]);
	return { ...state, isLoading: enabled && state.isLoading, refresh };
}
