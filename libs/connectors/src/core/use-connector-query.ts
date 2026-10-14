import { useCallback, useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	type ConnectorErrorInfo,
	classifyConnectorError,
	runConnectorPixel,
} from "./connector-pixel";

/**
 * Where a connector read stands:
 *
 * - `idle`: there is nothing to read yet, such as before a channel is chosen.
 * - `loading`: the first read is running.
 * - `ready`: the data is in.
 * - `signedOut`: the account has to sign in first.
 * - `error`: the read failed for another reason.
 */
export type ConnectorQueryStatus =
	| "idle"
	| "loading"
	| "ready"
	| "signedOut"
	| "error";

/** What {@link useConnectorQuery} returns. */
export interface ConnectorQuery<T> {
	status: ConnectorQueryStatus;
	/** The data, once read. */
	data: T | null;
	/** Why the read failed, when it did. */
	error: ConnectorErrorInfo | null;
	/** Whether a newer read is running while earlier data is shown. */
	isRefreshing: boolean;
	/** Read again. */
	reload: () => void;
}

/** Options for {@link useConnectorQuery}. */
export interface ConnectorQueryOptions {
	/**
	 * Keeps the data on screen while a different pixel with the same key
	 * loads, as when more items of the same list are asked for. Without a key,
	 * a different pixel starts from an empty state, so moving to another
	 * folder never shows the one before it.
	 */
	listKey?: string;
}

interface QueryState<T> {
	/** Never reuse data across originating insights, even for identical pixels. */
	insightId: string | undefined;
	/** The pixel the state belongs to. */
	pixel: string | null;
	listKey: string | undefined;
	status: ConnectorQueryStatus;
	data: T | null;
	error: ConnectorErrorInfo | null;
	isRefreshing: boolean;
}

/**
 * Read from a connector reactor in the current insight.
 *
 * A read that finishes after the pixel changed is dropped, so quick
 * navigation never shows an earlier folder's contents.
 *
 * @param pixel - The reactor call, or null when there is nothing to read.
 * @param parse - Turns the reactor's output into the data. Keep it stable,
 * such as a module level function; a new function reads again.
 * @param options - How to treat a change of pixel.
 * @return The read's state.
 */
export const useConnectorQuery = <T>(
	pixel: string | null,
	parse: (raw: unknown) => T,
	options: ConnectorQueryOptions = {},
): ConnectorQuery<T> => {
	const { insightId } = useInsight();
	const { listKey } = options;
	const [reloadCount, setReloadCount] = useState(0);
	const [state, setState] = useState<QueryState<T>>({
		insightId: undefined,
		pixel: null,
		listKey: undefined,
		status: "idle",
		data: null,
		error: null,
		isRefreshing: false,
	});

	// reloadCount is not read: a new value is the signal to read again
	// biome-ignore lint/correctness/useExhaustiveDependencies: refresh trigger
	useEffect(() => {
		if (!pixel || !insightId) {
			return;
		}

		let isCancelled = false;
		setState((previous) => {
			const isSameList =
				previous.insightId === insightId &&
				(previous.pixel === pixel ||
					(listKey !== undefined && previous.listKey === listKey));
			return isSameList && previous.data !== null
				? { ...previous, pixel: pixel, isRefreshing: true }
				: {
						insightId,
						pixel: pixel,
						listKey: listKey,
						status: "loading",
						data: null,
						error: null,
						isRefreshing: false,
					};
		});

		runConnectorPixel(pixel, insightId)
			.then((raw) => parse(raw))
			.then(
				(data) => {
					if (!isCancelled) {
						setState({
							insightId,
							pixel: pixel,
							listKey: listKey,
							status: "ready",
							data: data,
							error: null,
							isRefreshing: false,
						});
					}
				},
				(error: unknown) => {
					if (!isCancelled) {
						const info = classifyConnectorError(error);
						setState({
							insightId,
							pixel: pixel,
							listKey: listKey,
							status:
								info.kind === "signIn" ? "signedOut" : "error",
							data: null,
							error: info,
							isRefreshing: false,
						});
					}
				},
			);

		return () => {
			isCancelled = true;
		};
	}, [pixel, insightId, parse, listKey, reloadCount]);

	const reload = useCallback(() => {
		setReloadCount((count) => count + 1);
	}, []);

	if (!pixel) {
		return {
			status: "idle",
			data: null,
			error: null,
			isRefreshing: false,
			reload: reload,
		};
	}

	// the render before the effect picks up a new pixel
	if (state.pixel !== pixel || state.insightId !== insightId) {
		const isSameList =
			state.insightId === insightId &&
			listKey !== undefined &&
			state.listKey === listKey &&
			state.data !== null;
		return isSameList
			? {
					status: state.status,
					data: state.data,
					error: state.error,
					isRefreshing: true,
					reload: reload,
				}
			: {
					status: "loading",
					data: null,
					error: null,
					isRefreshing: false,
					reload: reload,
				};
	}

	return {
		status: state.status,
		data: state.data,
		error: state.error,
		isRefreshing: state.isRefreshing,
		reload: reload,
	};
};
