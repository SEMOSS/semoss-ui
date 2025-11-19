import { useEffect, useRef } from "react";

export interface UseInfiniteScrollOptions {
	/** Callback to trigger when reaching the bottom */
	onNext: () => void;
}

/**
 * Hook that triggers a callback when user scrolls near the bottom of a container
 *
 * @param options - Configuration options
 * @returns Ref to attach to the scrollable container
 *
 * @example
 * ```tsx
 * const scrollRef = useInfiniteScroll({
 *   onLoad
 * });
 *
 * return <ScrollArea ref={scrollRef}>...</ScrollArea>;
 * ```
 */
export function useInfiniteScroll({ onNext }: UseInfiniteScrollOptions) {
	const threshold = 100; // pixels from bottom to trigger load more
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			const distanceFromBottom =
				scrollHeight - (scrollTop + clientHeight);

			// Trigger load more when within threshold of bottom
			if (distanceFromBottom < threshold) {
				onNext();
			}
		};

		// Add scroll listener
		container.addEventListener("scroll", handleScroll);

		// Check on mount in case content is already short
		handleScroll();

		return () => {
			container.removeEventListener("scroll", handleScroll);
		};
	}, [onNext]);

	return containerRef;
}
