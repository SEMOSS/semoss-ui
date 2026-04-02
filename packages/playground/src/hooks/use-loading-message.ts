import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { LOADING_MESSAGES } from "@/constants";

/**
 * A hook that cycles through loading messages with progressively longer delays to keep users engaged during long operations.
 *
 * The hook displays random messages from either a custom set or the default LOADING_MESSAGES, alternating between them
 * when custom options are provided. Messages update at intervals that increase over time (2s, 3.2s, 4.4s, up to 8s max).
 *
 * @param iterate - When true, starts cycling through messages. When false, clears the current message and stops iteration.
 * @param initialOptions - Optional array of custom loading messages. When provided, the hook alternates between custom and default messages.
 *
 * @returns An object containing:
 *   - loadingMessage: The current message to display
 *   - setCustomOptions: Function to update the custom message options dynamically
 *
 * @example
 * ```tsx
 * const { loadingMessage, setCustomOptions } = useLoadingMessage(true, ['Processing...', 'Almost there...']);
 * return <div>{loadingMessage}</div>;
 * ```
 */
export const useLoadingMessage = (
	iterate: boolean,
	initialOptions: string[] = [],
	initialPosition: number = 0,
): {
	loadingMessage: string;
	setCustomOptions: Dispatch<SetStateAction<string[]>>;
} => {
	const [loadingMessage, setLoadingMessage] = useState<string>("");
	const [customOptions, setCustomOptions] = useState<string[]>([
		...initialOptions,
	]);

	// Manage the loading message iteration cycle
	useEffect(() => {
		// Stop iteration and clear message when iterate is false
		if (!iterate) {
			setLoadingMessage("");
			return;
		}

		// Set the initial message (first custom option or first default message)
		const initialMessages = customOptions.length
			? customOptions
			: LOADING_MESSAGES;
		setLoadingMessage(
			initialMessages[initialPosition % initialMessages.length],
		);

		let timeoutId: number | undefined;
		let iteration = 1;
		let cancelled = false;

		/**
		 * Recursively schedules the next message update with an increasing delay.
		 * Delay starts at 2s and increases by 1.2s per iteration, capped at 8s.
		 */
		const scheduleNext = () => {
			// Calculate delay: 2s, 3.2s, 4.4s, 5.6s, 6.8s, 8s (max)
			const delay = Math.min(8000, 2000 + 1200 * (iteration - 1));

			timeoutId = window.setTimeout(() => {
				if (cancelled) {
					return;
				}

				// Alternate between custom options (even iterations) and default messages (odd iterations)
				// If no custom options, always use default messages
				const target =
					customOptions.length && iteration % 2 === 0
						? customOptions
						: LOADING_MESSAGES;

				// Select a random message from the target array
				const randomIndex = Math.floor(Math.random() * target.length);

				setLoadingMessage(target[randomIndex]);
				iteration += 1;
				scheduleNext();
			}, delay);
		};

		scheduleNext();

		// Cleanup function to prevent memory leaks and stop message updates
		return () => {
			cancelled = true;
			if (timeoutId !== undefined) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [iterate, customOptions, initialPosition]);

	return {
		loadingMessage,
		setCustomOptions,
	};
};
