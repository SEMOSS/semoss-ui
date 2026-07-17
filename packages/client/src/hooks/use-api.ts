import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as SharedAPI from "@semoss/shared/api";
import * as API from "@/api";

type ApiType = typeof API & typeof SharedAPI;

interface APIState<A extends keyof ApiType> {
	/** Status of the api call */
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	/** Data returned from the api call */
	data?: Awaited<ReturnType<ApiType[A]>>;
	/** Error returned from the api call */
	error?: Error;
}

interface APIConfig<A extends keyof ApiType> {
	/** Initial Data */
	data: APIState<A>["data"];

	/** Callback triggered on success */
	onSuccess: (data: APIState<A>["data"]) => void;

	/** Callback triggered on error */
	onError: (data: APIState<A>["data"], error: Error) => void;

	/** Callback triggered at the end */
	onFinal: () => void;
}

interface useAPI<A extends keyof ApiType> extends APIState<A> {
	/** Refresh and reexecute the api */
	refresh: () => void;
	/** Update the data with new information */
	update: (data: APIState<A>["data"]) => void;
}

/**
 * Execute an api on the backend and recieve a response
 *
 * @param api - api string to call
 *
 * @returns Information about the api response
 */
export function useAPI<A extends keyof ApiType>(
	api: [A, ...Parameters<ApiType[A]>] | null,
	config?: Partial<APIConfig<A>>,
): useAPI<A> {
	// Memoize the initial data
	// biome-ignore lint/correctness/useExhaustiveDependencies: config?.data is handled by deep check
	const initialData = useMemo(() => {
		return config?.data;
	}, [JSON.stringify(config?.data)]);

	// track the call backs in a config
	const callbacksRef = useRef<{
		onSuccess: APIConfig<A>["onSuccess"];
		onError: APIConfig<A>["onError"];
		onFinal: APIConfig<A>["onFinal"];
	}>({
		onSuccess: () => null,
		onError: () => null,
		onFinal: () => null,
	});

	useEffect(() => {
		callbacksRef.current = {
			onSuccess: config?.onSuccess || (() => null),
			onError: config?.onError || (() => null),
			onFinal: config?.onFinal || (() => null),
		};
	}, [config?.onSuccess, config?.onError, config?.onFinal]);

	// store the state
	const [count, setCount] = useState(0);
	const [state, setState] = useState<APIState<A>>({
		status: "INITIAL",
		data: config?.data,
	});

	/**
	 * Increment the count, triggering a refresh of the api
	 */
	const refresh = useCallback(() => {
		setCount((prev) => prev + 1);
	}, []);

	/**
	 * Update the state with new data
	 */
	const update = useCallback((data: APIState<A>["data"], error?: Error) => {
		setState((prev) => ({
			...prev,
			data: data,
			error: error,
		}));
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: this is okay
	useEffect(() => {
		// track if it has been cancelled
		let isCancelled = false;

		const run = async () => {
			// no api reset it
			if (!api || api.length === 0) {
				setState({
					status: "INITIAL",
					data: initialData,
				});

				return;
			}

			setState({
				status: "LOADING",
			});

			try {
				const [func, ...args] = api;

				// This is a bit of a hack to allow us to call both the client and shared API without worrying about where the function is coming from. We check the client API first, then the shared API.
				const response = await (
					(
						API as {
							[key: string]: (
								...args: unknown[]
							) => Promise<unknown>;
						}
					)[func] ??
					(
						SharedAPI as {
							[key: string]: (
								...args: unknown[]
							) => Promise<unknown>;
						}
					)[func]
				).apply(null, args);

				// ignore if its cancelled
				if (isCancelled) {
					return;
				}

				const wrappedResponse = response as Awaited<
					ReturnType<ApiType[A]>
				>;

				// set as success
				setState({
					status: "SUCCESS",
					data: wrappedResponse,
				});

				callbacksRef.current.onSuccess(wrappedResponse);
			} catch (error) {
				// ignore if its cancelled
				if (isCancelled) {
					return;
				}

				let wrappedError: Error;
				if (!(error instanceof Error)) {
					wrappedError = new Error(String(error));
				} else {
					wrappedError = error;
				}

				setState({
					status: "ERROR",
					error: wrappedError,
				});

				callbacksRef.current.onError(initialData, wrappedError);
			} finally {
				// ignore if its cancelled
				if (!isCancelled) {
					callbacksRef.current.onFinal();
				}
			}
		};

		// run it
		run();

		return () => {
			isCancelled = true;
		};
	}, [count, JSON.stringify(api), initialData]);

	return {
		...state,
		refresh: refresh,
		update: update,
	};
}
