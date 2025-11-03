import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 100;

/**
 * Auto scroll to bottom when new content is added. This only scrolls if the user hasn't scrolled up.
 */
export const useAutoScroll = <T>(dependency: T) => {
	const [scrollEle, setScrollEle] = useState<HTMLDivElement | null>(null);
	const [isUserScrolled, setIsUserScrolled] = useState(false);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
	const prevDependencyRef = useRef<T>(dependency);

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
	 * Scroll to bottom smoothly
	 */
	const scrollToBottom = useCallback(
		(enableAutoScroll = true) => {
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
		},
		[scrollEle],
	);

	/**
	 * Handle scroll events to detect user scrolling
	 */
	const handleScroll = useCallback(() => {
		if (!scrollEle) {
			return;
		}

		const nearBottom = isNearBottom();

		// If user scrolled near bottom, enable auto-scroll
		setIsUserScrolled(!nearBottom);

		// If user scrolled up (not near bottom), disable auto-scroll
		setShouldAutoScroll(nearBottom);
	}, [scrollEle, isNearBottom]);

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
				scrollToBottom(false);
			});
		}
	}, [dependency, shouldAutoScroll, isUserScrolled, scrollToBottom]);

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
		scrollToBottom,
		isUserScrolled,
		shouldAutoScroll,
	};
};
