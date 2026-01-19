import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 100;

interface UseAutoScrollOptions {
	/**
	 * The direction to auto-scroll. Defaults to "bottom".
	 */
	direction?: "top" | "bottom";
}

/**
 * Auto scroll to top or bottom when new content is added. This only scrolls if the user hasn't scrolled away.
 */
export const useAutoScroll = <T>(
	dependency: T,
	options?: UseAutoScrollOptions,
) => {
	const { direction = "bottom" } = options;

	const [scrollEle, setScrollEle] = useState<HTMLDivElement | null>(null);
	const [isUserScrolled, setIsUserScrolled] = useState(false);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
	const prevDependencyRef = useRef<T>(dependency);

	/**
	 * Check if the user is near the top of the scroll container
	 */
	const isNearTop = useCallback(() => {
		if (!scrollEle) {
			return false;
		}
		const { scrollTop } = scrollEle;

		return scrollTop <= THRESHOLD;
	}, [scrollEle]);

	/**
	 * Check if the user is near the bottom of the scroll container
	 */
	const isNearBottom = useCallback(() => {
		if (!scrollEle) {
			return false;
		}
		const { scrollTop, scrollHeight, clientHeight } = scrollEle;

		return scrollHeight - scrollTop - clientHeight <= THRESHOLD;
	}, [scrollEle]);

	/**
	 * Check if the user is near the target scroll position based on direction
	 */
	const isNearTarget = useCallback(() => {
		return direction === "top" ? isNearTop() : isNearBottom();
	}, [direction, isNearTop, isNearBottom]);

	/**
	 * Scroll to target position based on direction
	 */
	const scroll = useCallback(
		(enableAutoScroll = true) => {
			if (direction === "top") {
				if (!scrollEle) {
					return;
				}

				scrollEle.scrollTo({
					top: 0,
					behavior: "smooth",
				});

				if (enableAutoScroll) {
					setIsUserScrolled(false);
					setShouldAutoScroll(true);
				}
			} else {
				if (!scrollEle) {
					return;
				}

				scrollEle.scrollTo({
					top: scrollEle.scrollHeight,
					behavior: "smooth",
				});

				if (enableAutoScroll) {
					setIsUserScrolled(false);
					setShouldAutoScroll(true);
				}
			}
		},
		[direction, scrollEle],
	);

	/**
	 * Handle scroll events to detect user scrolling
	 */
	const handleScroll = useCallback(() => {
		if (!scrollEle) {
			return;
		}

		const nearTarget = isNearTarget();

		// If user scrolled near target, enable auto-scroll
		setIsUserScrolled(!nearTarget);

		// If user scrolled away (not near target), disable auto-scroll
		setShouldAutoScroll(nearTarget);
	}, [scrollEle, isNearTarget]);

	/**
	 * Auto-scroll when dependency changes (new messages added)
	 */
	useEffect(() => {
		// Check if dependency has changed
		const hasChanged = prevDependencyRef.current !== dependency;
		prevDependencyRef.current = dependency;

		if (hasChanged && shouldAutoScroll && !isUserScrolled) {
			// Use requestAnimationFrame to ensure DOM has updated
			requestAnimationFrame(() => {
				scroll(false);
			});
		}
	}, [dependency, shouldAutoScroll, isUserScrolled, scroll]);

	/**
	 * Set up scroll event listener
	 */
	useEffect(() => {
		if (!scrollEle) {
			return;
		}

		// Throttle scroll events for better performance
		let ticking = false;

		const throttledHandleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					handleScroll();
					ticking = false;
				});
				ticking = true;
			}
		};

		scrollEle.addEventListener("scroll", throttledHandleScroll, {
			passive: true,
		});

		// Initial check
		handleScroll();

		return () => {
			scrollEle.removeEventListener("scroll", throttledHandleScroll);
		};
	}, [scrollEle, handleScroll]);

	return {
		setScrollEle,
		scroll,
		isUserScrolled,
		shouldAutoScroll,
	};
};
