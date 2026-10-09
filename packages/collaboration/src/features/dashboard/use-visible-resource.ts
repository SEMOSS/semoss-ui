import { useCallback, useEffect, useRef, useState } from "react";

export interface VisibleResource<T> {
	data: T | null;
	error: string;
	isLoading: boolean;
	checkedAt: Date | null;
	refresh: () => void;
}

/** A snapshot reader with stale-result guards and explicit refresh. */
export function useVisibleResource<T>(
	load: () => Promise<T>,
	enabled: boolean,
	_interval = 60_000,
): VisibleResource<T> {
	const [state, setState] = useState<Omit<VisibleResource<T>, "refresh">>({
		data: null,
		error: "",
		isLoading: false,
		checkedAt: null,
	});
	const [revision, setRevision] = useState(0);
	const refresh = useCallback(() => setRevision((value) => value + 1), []);
	const generation = useRef(0);
	const cached = useRef<{ load: () => Promise<T>; revision: number } | null>(
		null,
	);
	useEffect(() => {
		void revision;
		if (
			!enabled ||
			(cached.current?.load === load &&
				cached.current.revision === revision)
		)
			return;
		const token = ++generation.current;
		let pending = false;
		const read = async () => {
			if (pending) return;
			pending = true;
			setState((current) => ({ ...current, isLoading: true, error: "" }));
			try {
				const data = await load();
				if (generation.current === token) {
					cached.current = { load, revision };
					setState({
						data,
						isLoading: false,
						error: "",
						checkedAt: new Date(),
					});
				}
			} catch (cause) {
				if (generation.current === token)
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
			}
		};
		void read();
		return () => {
			generation.current++;
		};
	}, [enabled, load, revision]);
	return { ...state, isLoading: enabled && state.isLoading, refresh };
}
