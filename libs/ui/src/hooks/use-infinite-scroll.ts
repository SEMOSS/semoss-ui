import { useCallback, useEffect, useState } from "react";

export interface UseInfiniteScrollOptions {
	/** disable the scroll */
	disabled?: boolean;

	/** Callback to trigger when reaching the bottom */
	onNext: () => void;
}

export interface UseInfiniteScrollReturn {
	/** Ref setter to attach to the scrollable container */
	setScroll: (ele: HTMLDivElement | null) => void;

	/** Reset the scroll position to top */
	resetScroll: () => void;
}

/**
 * Hook that triggers a callback when user scrolls near the bottom of a container
 *
 * @param options - Configuration options
 * @returns Object containing setScroll ref setter and reset function to scroll to top
 *
 * @example
 * ```tsx
 * const { setScroll, reset } = useInfiniteScroll({
 *   onNext: loadMore
 * });
 *
 * return <ScrollArea ref={setScroll}>...</ScrollArea>;
 * ```
 */
export function useInfiniteScroll({
	disabled = false,
	onNext,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
	const threshold = 100; // pixels from bottom to trigger load more
	const [scrollEle, setScroll] = useState<HTMLDivElement | null>(null);

	/**
	 * Reset the scroll
	 */
	const resetScroll = useCallback(() => {
		if (scrollEle) {
			scrollEle.scrollTop = 0;
		}
	}, [scrollEle]);

	/**
	 * Add the scroll listener
	 */
	useEffect(() => {
		if (!scrollEle) {
			return;
		}

		const handleScroll = () => {
			if (disabled) {
				return;
			}

			const { scrollTop, scrollHeight, clientHeight } = scrollEle;
			const distanceFromBottom =
				scrollHeight - (scrollTop + clientHeight);

			// Trigger load more when within threshold of bottom
			if (distanceFromBottom < threshold) {
				onNext();
			}
		};

		// Add scroll listener
		scrollEle.addEventListener("scroll", handleScroll);

		// Check on mount in case content is already short
		handleScroll();

		return () => {
			scrollEle.removeEventListener("scroll", handleScroll);
		};
	}, [scrollEle, onNext, disabled]);

	return { setScroll, resetScroll };
}
