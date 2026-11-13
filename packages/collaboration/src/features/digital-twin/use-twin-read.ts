import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { InsightActions } from "@/lib/pixel";

interface TwinRead<T> {
	/** What the last read gave, kept while it is read again; undefined before the first read and after a failed one. */
	data: T | undefined;
	/** Why the last read failed; empty while reading and once read. */
	error: string;
	isLoading: boolean;
	/** Read again. */
	reload: () => void;
}

/**
 * Read something a twin page needs before it can show, through the page's
 * insight. Only the latest read lands.
 *
 * @param read - The read; keep its identity stable, since a new one reads
 * again. What the one before gave stays until then, so a page that shows
 * another record is keyed by it.
 */
export function useTwinRead<T>(
	read: (actions: InsightActions) => Promise<T>,
): TwinRead<T> {
	const { actions } = useInsight();
	const [state, setState] = useState<Omit<TwinRead<T>, "reload">>({
		data: undefined,
		error: "",
		isLoading: true,
	});
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		// a reload reads again with nothing else changed
		void attempt;
		let isLatest = true;
		setState((current) => ({ ...current, error: "", isLoading: true }));
		read(actions).then(
			(data) => {
				if (isLatest) setState({ data, error: "", isLoading: false });
			},
			(cause: unknown) => {
				if (isLatest)
					setState({
						data: undefined,
						error:
							cause instanceof Error
								? cause.message
								: "That did not work.",
						isLoading: false,
					});
			},
		);
		return () => {
			isLatest = false;
		};
	}, [actions, read, attempt]);
	return { ...state, reload: () => setAttempt((count) => count + 1) };
}
