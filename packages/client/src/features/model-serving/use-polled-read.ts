import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@semoss/utility/error";

/** A read that runs again after a delay, such as a served model's status */
export interface PolledRead<T> {
	/** The last answer to the current read; null until it first answers */
	value: T | null;
	/** Why the last attempt failed; the last answer stays in `value` */
	error: string | null;
	/** No answer to the current read yet, neither a value nor an error */
	isLoading: boolean;
	/** A read is under way, the first or a later one */
	isReading: boolean;
	/** When the current read last answered */
	updatedAt: Date | null;
	/** Read again now; the next scheduled read moves accordingly */
	refresh: () => void;
}

interface PolledState<T> {
	source: (() => Promise<T>) | null;
	value: T | null;
	error: string | null;
	isReading: boolean;
	updatedAt: Date | null;
}

/** Nothing read yet */
const idleState = <T>(): PolledState<T> => ({
	source: null,
	value: null,
	error: null,
	isReading: false,
	updatedAt: null,
});

/**
 * Run `read` now, and again after the delay `nextDelay` gives for its answer
 * (null for no further read), until `read` changes or the component unmounts.
 * Unlike `usePixel`, it keeps the last answer while it reads again, so a table
 * does not empty itself every few seconds. A new `read` (pass a stable one,
 * from `useCallback` or the module scope) starts over without the old answer;
 * a null `read` reads nothing and keeps the last answer, such as for a panel
 * that is closing.
 */
export function usePolledRead<T>(
	read: (() => Promise<T>) | null,
	nextDelay: (value: T | null) => number | null,
): PolledRead<T> {
	const [request, setRequest] = useState(0);
	const [state, setState] = useState<PolledState<T>>(idleState);

	const refresh = useCallback(() => {
		setRequest((count) => count + 1);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies(request): each request reads again
	useEffect(() => {
		if (!read) {
			return;
		}
		let isCancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const schedule = (delay: number | null): void => {
			if (delay !== null) {
				timer = setTimeout(() => {
					setRequest((count) => count + 1);
				}, delay);
			}
		};

		setState((previous) =>
			previous.source === read
				? { ...previous, isReading: true }
				: { ...idleState<T>(), source: read, isReading: true },
		);
		read().then(
			(value) => {
				if (isCancelled) {
					return;
				}
				setState({
					source: read,
					value,
					error: null,
					isReading: false,
					updatedAt: new Date(),
				});
				schedule(nextDelay(value));
			},
			(cause: unknown) => {
				if (isCancelled) {
					return;
				}
				setState((previous) => ({
					...(previous.source === read ? previous : idleState<T>()),
					source: read,
					error: getErrorMessage(cause, "The request failed."),
					isReading: false,
				}));
				schedule(nextDelay(null));
			},
		);

		return () => {
			isCancelled = true;
			if (timer !== undefined) {
				clearTimeout(timer);
			}
		};
	}, [read, nextDelay, request]);

	// an answer to an earlier read is never shown for the current one
	const current =
		read === null || state.source === read ? state : idleState<T>();
	return {
		value: current.value,
		error: current.error,
		isLoading:
			read !== null && current.value === null && current.error === null,
		isReading: read !== null && (state.source !== read || state.isReading),
		updatedAt: current.updatedAt,
		refresh,
	};
}
