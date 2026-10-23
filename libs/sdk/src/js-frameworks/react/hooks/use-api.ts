import { useCallback, useEffect, useRef, useState } from "react";

export interface APIState<D> {
	/** Status of the current API call. */
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	/** Data returned by a successful call, or supplied through `update`. */
	data?: D;
	/** Error from the current call. Non-Error rejections are normalized. */
	error?: Error;
}

export interface APIConfig<D> {
	/** Initial data, captured on mount and restored when the request is null. */
	data?: D;
	/** Called with the successful response from the current request. */
	onSuccess?: (data: D) => void;
	/** Called with the initial data and the current request's error. */
	onError?: (data: D | undefined, error: Error) => void;
	/** Called after the current request settles, on success or failure. */
	onFinal?: () => void;
}

export interface UseAPIResult<D> extends APIState<D> {
	/** Execute the current request again. A null request never fetches. */
	refresh: () => void;
	/** Replace local data and clear the error without changing status or fetching. */
	update: (data: D | undefined) => void;
}

/**
 * Compare immutable API arguments by value for arrays/plain objects, and by
 * identity for transport objects such as signals, files, and FormData. Unlike
 * JSON serialization, this preserves undefined, functions, bigint, and cycles.
 */
function areAPIArgumentsEqual(
	previous: readonly unknown[],
	next: readonly unknown[],
): boolean {
	const compared = new WeakMap<object, object>();

	/** Compare a nested argument without serializing or cloning request values. */
	function isSameArgument(left: unknown, right: unknown): boolean {
		if (Object.is(left, right)) return true;
		if (
			typeof left !== "object" ||
			left === null ||
			typeof right !== "object" ||
			right === null
		) {
			return false;
		}

		const prototype = Object.getPrototypeOf(left);
		if (
			prototype !== Object.getPrototypeOf(right) ||
			(!Array.isArray(left) &&
				prototype !== Object.prototype &&
				prototype !== null)
		) {
			return false;
		}
		if (compared.has(left)) return compared.get(left) === right;
		compared.set(left, right);

		const keys = Reflect.ownKeys(left);
		return (
			keys.length === Reflect.ownKeys(right).length &&
			keys.every(
				(key) =>
					Object.hasOwn(right, key) &&
					isSameArgument(
						Reflect.get(left, key),
						Reflect.get(right, key),
					),
			)
		);
	}

	return isSameArgument(previous, next);
}

/**
 * Execute a typed API request using the client's status/data/callback structure.
 *
 * Pass `[method, ...arguments]`, or a function directly for a no-argument call.
 * A changed method or arguments start a new request; `null` disables fetching.
 * Inline arrays and plain objects are compared by value. Other objects (including
 * signals and files) and functions are compared by identity. Treat all arguments
 * as immutable. Responses and callbacks from superseded requests or an unmounted
 * hook are ignored, but the underlying transport is not aborted.
 * Each hook invocation owns its own state and does not cache or deduplicate calls.
 * Use this for reads; invoke mutations from event handlers instead.
 *
 * @param api - Method and its typed arguments, a no-argument function, or null.
 * @param config - Initial data and callbacks; callback changes do not refetch.
 * @returns Request status, data, error, and local refresh/update actions.
 */
export function useAPI<A extends unknown[], D>(
	api: readonly [method: (...args: A) => Promise<D>, ...args: A] | null,
	config?: APIConfig<D>,
): UseAPIResult<D>;
export function useAPI<D>(
	api: (() => Promise<D>) | null,
	config?: APIConfig<D>,
): UseAPIResult<D>;
export function useAPI<A extends unknown[], D>(
	api:
		| readonly [method: (...args: A) => Promise<D>, ...args: A]
		| (() => Promise<D>)
		| null,
	config?: APIConfig<D>,
): UseAPIResult<D> {
	const [call, setCall] = useState(() => api);
	// Retain equivalent immutable inputs as an effect dependency. A changed call
	// restarts this render before effects commit, without mutating refs in render.
	if (
		call !== api &&
		!(
			Array.isArray(call) &&
			Array.isArray(api) &&
			areAPIArgumentsEqual(call, api)
		)
	) {
		setCall(() => api);
	}

	const [initialData] = useState(() => config?.data);
	const [refreshCount, setRefreshCount] = useState(0);
	const [state, setState] = useState<APIState<D>>(() => ({
		status: "INITIAL",
		data: initialData,
	}));
	const { onSuccess, onError, onFinal } = config ?? {};
	const callbacksRef = useRef({ onSuccess, onError, onFinal });

	// Notifications use the latest committed callbacks without restarting a read.
	useEffect(() => {
		callbacksRef.current = { onSuccess, onError, onFinal };
	}, [onSuccess, onError, onFinal]);

	const refresh = useCallback(() => {
		setRefreshCount((previous) => previous + 1);
	}, []);

	const update = useCallback((data: D | undefined) => {
		setState((previous) => ({ ...previous, data, error: undefined }));
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies(refreshCount): refreshCount explicitly restarts the current request.
	useEffect(() => {
		if (!call) {
			setState({ status: "INITIAL", data: initialData });
			return;
		}

		let isCancelled = false;
		const request = call;
		setState({ status: "LOADING" });

		/** Settle only the request owned by this effect's current lifecycle. */
		async function run(): Promise<void> {
			try {
				let data: D;
				if (typeof request === "function") {
					data = await request();
				} else {
					const [method, ...args] = request;
					data = await method(...args);
				}
				if (isCancelled) return;

				setState({ status: "SUCCESS", data });
				callbacksRef.current.onSuccess?.(data);
			} catch (error) {
				if (isCancelled) return;

				const wrappedError =
					error instanceof Error ? error : new Error(String(error));
				setState({ status: "ERROR", error: wrappedError });
				callbacksRef.current.onError?.(initialData, wrappedError);
			} finally {
				if (!isCancelled) callbacksRef.current.onFinal?.();
			}
		}

		void run();
		return () => {
			isCancelled = true;
		};
	}, [call, initialData, refreshCount]);

	return { ...state, refresh, update };
}
