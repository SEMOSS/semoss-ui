import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stableKey } from "./stable-key";

/** A generated call without inputs: `fn(options?)`. */
type NoInputCall = (options?: RequestInit) => Promise<unknown>;

/** A generated call with inputs: `fn(input, options?)`. */
type InputCall = (input: never, options?: RequestInit) => Promise<unknown>;

/** What a call resolves with. */
type DataOf<F extends InputCall | NoInputCall> = Awaited<ReturnType<F>>;

/** The input argument, optional when every input of the call is. */
type InputArgs<F extends InputCall, O> = [] extends Parameters<F>
	? [input?: Parameters<F>[0], options?: O]
	: [input: Parameters<F>[0], options?: O];

/** Options for {@link useAPI}. */
export interface UseAPIOptions<D> {
	/** When false, nothing is called; flip it to true to call. Defaults to true. */
	enabled?: boolean;
	/** Data to show before the first response, and while disabled. */
	data?: D;
	/** Called with the data of each successful call. */
	onSuccess?: (data: D) => void;
	/** Called when a call fails, with the initial data and the error. */
	onError?: (data: D | undefined, error: Error) => void;
	/** Called after each call finishes, whether it succeeded or failed. */
	onFinal?: () => void;
}

/** What {@link useAPI} returns. */
export interface UseAPIResult<D> {
	/** Where the latest call is. */
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	/** The latest response, or the initial data. */
	data: D | undefined;
	/** The error of the latest call, when it failed. */
	error?: Error;
	/** Calls again. */
	refresh: () => void;
	/** Replaces the data without a call, such as after a local change. */
	update: (data: D | undefined) => void;
}

const noop = () => undefined;

/**
 * Calls a generated call from `@semoss/sdk/api/*` that takes no inputs, and
 * tracks its result.
 *
 * @example
 * ```ts
 * import { config } from "@semoss/sdk/api/monolith";
 *
 * const { status, data } = useAPI(config);
 * ```
 */
export function useAPI<F extends NoInputCall>(
	call: F,
	options?: UseAPIOptions<DataOf<F>>,
): UseAPIResult<DataOf<F>>;
/**
 * Calls a generated call from `@semoss/sdk/api/*` with its input, and tracks its
 * result. The call runs again when the input's content changes; a call that is
 * replaced, or whose component unmounts, is aborted and its result ignored.
 *
 * @example
 * ```ts
 * const users = useAPI(listUsers, { limit: 25 }, { enabled: isOpen });
 * ```
 */
export function useAPI<F extends InputCall>(
	call: F,
	...args: InputArgs<F, UseAPIOptions<DataOf<F>>>
): UseAPIResult<DataOf<F>>;
export function useAPI<D>(
	call: (...args: unknown[]) => Promise<D>,
	first?: unknown,
	second?: unknown,
): UseAPIResult<D> {
	// A generated call is (input, options = {}) when it has inputs and
	// (options = {}) when it does not. A parameter with a default is not counted
	// in a function's length, so the length says which argument is the input.
	const takesInput = call.length > 0;
	const input = takesInput ? first : undefined;
	const options = ((takesInput ? second : first) ?? {}) as UseAPIOptions<D>;
	const { enabled = true } = options;

	// Compared by value: a new object with the same content does not call again.
	const inputKey = takesInput ? stableKey(input, "input") : undefined;
	const initialKey = stableKey(options.data, "data");

	// Rebuilt from its key, so new objects with the same content keep one identity.
	const initialData = useMemo<D | undefined>(
		() => (initialKey === undefined ? undefined : JSON.parse(initialKey)),
		[initialKey],
	);

	// Callbacks are read when a call finishes, so changing them never calls again.
	const callbacksRef = useRef({
		onSuccess: options.onSuccess ?? noop,
		onError: options.onError ?? noop,
		onFinal: options.onFinal ?? noop,
	});
	useEffect(() => {
		callbacksRef.current = {
			onSuccess: options.onSuccess ?? noop,
			onError: options.onError ?? noop,
			onFinal: options.onFinal ?? noop,
		};
	}, [options.onSuccess, options.onError, options.onFinal]);

	const [count, setCount] = useState(0);
	const [state, setState] = useState<
		Pick<UseAPIResult<D>, "status" | "data" | "error">
	>({
		status: "INITIAL",
		data: initialData,
	});

	const refresh = useCallback(() => {
		setCount((prev) => prev + 1);
	}, []);

	const update = useCallback((data: D | undefined) => {
		setState((prev) => ({ ...prev, data: data }));
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies(count): a refresh changes count to call again
	useEffect(() => {
		if (!enabled) {
			setState({ status: "INITIAL", data: initialData });
			return;
		}

		const controller = new AbortController();
		let isCancelled = false;
		setState({ status: "LOADING", data: initialData });

		const fetchOptions: RequestInit = { signal: controller.signal };
		const value = inputKey === undefined ? undefined : JSON.parse(inputKey);
		const request = takesInput
			? call(value, fetchOptions)
			: call(fetchOptions);

		request
			.then((data) => {
				if (isCancelled) {
					return;
				}
				setState({ status: "SUCCESS", data: data });
				callbacksRef.current.onSuccess(data);
			})
			.catch((reason: unknown) => {
				if (isCancelled) {
					return;
				}
				const error =
					reason instanceof Error
						? reason
						: new Error(String(reason));
				setState({ status: "ERROR", data: initialData, error: error });
				callbacksRef.current.onError(initialData, error);
			})
			.finally(() => {
				if (!isCancelled) {
					callbacksRef.current.onFinal();
				}
			});

		return () => {
			isCancelled = true;
			controller.abort();
		};
	}, [call, takesInput, inputKey, enabled, initialData, count]);

	return {
		...state,
		refresh: refresh,
		update: update,
	};
}
