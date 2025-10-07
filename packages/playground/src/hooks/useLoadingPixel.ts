import { useCallback, useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useLoadingState } from "./useLoadingState";

/**
 * Custom hook to call a reactor, typically for fetching data on page load.
 *
 * @template T The expected type of the pixel response.
 * @param {string} [pixelString] The pixel to call.
 * @param {T} [initialValue] The initial value of the state, before being overwritten by the pixel return.
 * @param {boolean} [waitToLoad] A flag that prevents the pixel from running until ready.
 * @returns {[T, boolean, () => void]} The pixel return, whether the call is loading, and a function to re-fetch.
 */
export const useLoadingPixel = <T>(
	pixelString: string,
	initialValue?: T,
	waitToLoad = false,
): [T, boolean, () => void] => {
	const { actions } = useInsight();

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useLoadingState();
	const [response, setResponse] = useState<T>(initialValue);

	/**
	 * Functions
	 */
	const fetchPixel = useCallback(() => {
		if (waitToLoad) return;
		(async () => {
			const loadingKey = setIsLoading(true);
			try {
				const response = await actions.run<T[]>(pixelString);
				const data = response.pixelReturn[0].output;
				setIsLoading(false, loadingKey, () => setResponse(data));
			} catch {
				setIsLoading(false, loadingKey);
			}
		})();
	}, [pixelString, setIsLoading, actions, waitToLoad]);

	/**
	 * Effects
	 */
	useEffect(() => {
		// Call the reactor on loadup
		fetchPixel();
	}, [fetchPixel]);

	return [response, isLoading, fetchPixel];
};
