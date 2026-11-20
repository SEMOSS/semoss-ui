import { useCallback, useEffect, useRef, useState } from "react";

/** How far from the top or bottom, in px, the scroll buttons appear and auto-scroll stops. */
const SCROLL_THRESHOLD = 150;

/** What {@link useStickToBottomScroll} returns. */
interface UseStickToBottomScrollReturn {
	/** Ref callback for the scrolling viewport. */
	viewportRef: (element: HTMLDivElement | null) => void;
	/** Ref callback for the content inside it, whose growth is followed. */
	contentRef: (element: HTMLDivElement | null) => void;
	/** Whether the view is far enough down to offer scrolling to the top. */
	isScrollUpShown: boolean;
	/**
	 * Whether the user has scrolled away from the bottom. The view then offers
	 * scrolling back down and stops following the stream until they return.
	 */
	isAwayFromBottom: boolean;
	/** Smoothly scroll to the top. */
	scrollToTop: () => void;
	/** Smoothly scroll to the bottom. */
	scrollToBottom: () => void;
}

/**
 * Keep a streaming conversation's view at its newest content. It opens at the
 * bottom, follows the content as it grows while a reply streams, and scrolls
 * down once more as the stream settles. Scrolling away from the bottom stops
 * the following until the user scrolls back, and the scroll position is read
 * at most once a frame.
 *
 * @param isStreaming - Whether a reply is streaming into the content.
 * @param onScrolledChange - Told on each scroll whether the view is off its top.
 * @returns The ref callbacks, which scroll buttons to show, and the scrolls.
 */
export const useStickToBottomScroll = (
	isStreaming: boolean,
	onScrolledChange?: ((isScrolled: boolean) => void) | null,
): UseStickToBottomScrollReturn => {
	const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
	const [content, setContent] = useState<HTMLDivElement | null>(null);
	const [isScrollUpShown, setIsScrollUpShown] = useState(false);
	const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);

	/** Read the scroll position into the buttons, the lock, and the owner. */
	const readScroll = useCallback(() => {
		if (!viewport) return;
		onScrolledChange?.(viewport.scrollTop > 0);
		setIsScrollUpShown(viewport.scrollTop > SCROLL_THRESHOLD);
		setIsAwayFromBottom(
			viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight >
				SCROLL_THRESHOLD,
		);
	}, [viewport, onScrolledChange]);

	// open at the bottom once the viewport exists
	useEffect(() => {
		if (!viewport) return;
		setIsAwayFromBottom(false);
		const frame = requestAnimationFrame(() => {
			viewport.scrollTop = viewport.scrollHeight;
		});
		return () => cancelAnimationFrame(frame);
	}, [viewport]);

	// Scroll once when a stream settles. Scheduling from the transition itself
	// keeps a later, unrelated resize (opening a grouped tool) from scrolling.
	const wasStreamingRef = useRef(false);
	useEffect(() => {
		const wasStreaming = wasStreamingRef.current;
		wasStreamingRef.current = isStreaming;
		if (isStreaming || !wasStreaming || !viewport) return;

		setIsAwayFromBottom(false);
		const frame = requestAnimationFrame(() => {
			viewport.scrollTo({
				top: viewport.scrollHeight,
				behavior: "smooth",
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [isStreaming, viewport]);

	// While a reply streams and the user is at the bottom, follow the content
	// as it grows. The observer reports once as it starts, so the view also
	// catches up when streaming starts or the user returns to the bottom.
	useEffect(() => {
		if (!viewport || !content || isAwayFromBottom || !isStreaming) return;

		let frame = 0;
		const observer = new ResizeObserver(() => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				viewport.scrollTop = viewport.scrollHeight;
			});
		});
		observer.observe(content);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [viewport, content, isAwayFromBottom, isStreaming]);

	// listen for scrolling, at most once a frame
	useEffect(() => {
		if (!viewport) return;

		// set before the frame is asked for, which may run at once
		let isTicking = false;
		let frame = 0;
		const handleScroll = () => {
			if (isTicking) return;
			isTicking = true;
			frame = requestAnimationFrame(() => {
				isTicking = false;
				readScroll();
			});
		};

		viewport.addEventListener("scroll", handleScroll, { passive: true });
		readScroll();
		return () => {
			viewport.removeEventListener("scroll", handleScroll);
			if (isTicking) cancelAnimationFrame(frame);
		};
	}, [viewport, readScroll]);

	const scrollToTop = () =>
		viewport?.scrollTo({ top: 0, behavior: "smooth" });

	const scrollToBottom = () =>
		viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });

	return {
		viewportRef: setViewport,
		contentRef: setContent,
		isScrollUpShown,
		isAwayFromBottom,
		scrollToTop,
		scrollToBottom,
	};
};
