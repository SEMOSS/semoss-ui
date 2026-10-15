import { useContext, useEffect, useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import { BlocksContext } from "../contexts";

/** Stable empty list, so "no frame selected" is the same value every render. */
const NO_HEADERS: {
	alias: string;
	header: string;
	dataType: string;
	adtlType: string;
	qsName: unknown;
}[] = [];

/**
 * Use a frame's header's in an insight
 *
 * @param frame
 * @param options
 */
export function useFrameHeaders(
	/** Frame to get data from */
	frame = "",

	/** Options for the frame */
	options: Partial<{
		/** Selector to grab the data */
		headerTypes: string[];
	}> = {},
) {
	const { headerTypes = [] } = options;

	const context = useContext(BlocksContext);
	if (context === undefined) {
		throw new Error("useFrameHeaders must be used within Blocks");
	}

	const { state } = context;

	// get the frameKey, this will change whenever the data does
	const frameKey = state.getFrameKey(frame);

	/**
	 * Get the headers
	 */
	const getHeaders = usePixel<{
		name: string;
		type: string;
		headerInfo: {
			headers: {
				alias: string;
				header: string;
				dataType: string;
				adtlType: string;
				qsName: unknown;
			}[];
			joins: unknown[];
		};
	}>(
		frame
			? `META | ${frame} | FrameHeaders(${
					headerTypes && headerTypes.length !== 0
						? `headerTypes=${JSON.stringify(headerTypes)}`
						: ""
				});`
			: "",
		undefined,
		context.state.insightId,
	);

	// Refresh the data whenever the key changes. The key is the trigger, not an
	// input: the body reads nothing from it, and `refresh` is identity-stable,
	// so listing it would only re-run this on renders that change neither.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		getHeaders.refresh();
	}, [frameKey]);

	const headers =
		getHeaders.status === "SUCCESS"
			? getHeaders.data.headerInfo.headers
			: NO_HEADERS;

	/**
	 * Memoized, deliberately.
	 *
	 * This used to return a fresh object literal every render, which defeated
	 * every `useMemo` and `useEffect` a caller keyed on it: a consumer that
	 * derived state from the headers re-derived it on every render, and one
	 * that set state from that derivation looped until React gave up.
	 */
	return useMemo(
		() => ({
			isLoading: getHeaders.status === "LOADING",
			data: { list: headers },
			error: getHeaders.error,
		}),
		[getHeaders.status, getHeaders.error, headers],
	);
}
