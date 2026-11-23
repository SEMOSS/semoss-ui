import { useEffect, useRef } from "react";

/** What {@link useRoomListScroll} returns. */
interface UseRoomListScrollReturn {
	/** Ref callback for the list's scrolling viewport. */
	viewportRef: (element: HTMLDivElement | null) => void;
}

/**
 * Keep the room list's place. The last scroll position is kept in a ref, so
 * scrolling never renders the list, and put back when the list shows again.
 * A new reset key (a new order, grouping, or refetch) sends it back to the
 * top. The viewport is handed to `onViewport` (infinite scroll's target) only
 * while the list shows: inside a closed mobile sheet its viewport has no
 * height, and infinite scroll would see its end as always in view and pull
 * in every page at once.
 *
 * @param isVisible - Whether the list is on screen.
 * @param resetKey - Changes whenever the list starts over at the top; the
 * key it mounts with does not scroll.
 * @param onViewport - Given the viewport once it exists and the list shows.
 * @returns The viewport's ref callback.
 */
export const useRoomListScroll = (
	isVisible: boolean,
	resetKey: string,
	onViewport: (element: HTMLDivElement) => void,
): UseRoomListScrollReturn => {
	const viewportElementRef = useRef<HTMLDivElement | null>(null);
	const savedScrollRef = useRef(0);
	const shownResetKeyRef = useRef(resetKey);

	// one passive listener per viewport; it only records where the list is
	useEffect(() => {
		const element = viewportElementRef.current;
		if (!element || !isVisible) return;
		const handleScroll = () => {
			savedScrollRef.current = element.scrollTop;
		};
		element.addEventListener("scroll", handleScroll, { passive: true });
		return () => element.removeEventListener("scroll", handleScroll);
	}, [isVisible]);

	// a new key starts the list at the top
	useEffect(() => {
		if (shownResetKeyRef.current === resetKey) return;
		shownResetKeyRef.current = resetKey;
		if (viewportElementRef.current) {
			viewportElementRef.current.scrollTop = 0;
		}
		savedScrollRef.current = 0;
	}, [resetKey]);

	// put the list back where it was when it shows again
	useEffect(() => {
		const element = viewportElementRef.current;
		if (!element || !isVisible || savedScrollRef.current === 0) return;
		const frame = requestAnimationFrame(() => {
			element.scrollTop = savedScrollRef.current;
		});
		return () => cancelAnimationFrame(frame);
	}, [isVisible]);

	// The ref callback runs only as the viewport mounts, so when a mobile
	// sheet opens later the viewport is handed over again here.
	useEffect(() => {
		if (isVisible && viewportElementRef.current) {
			onViewport(viewportElementRef.current);
		}
	}, [isVisible, onViewport]);

	const viewportRef = (element: HTMLDivElement | null) => {
		if (!element) return;
		viewportElementRef.current = element;
		if (isVisible) {
			onViewport(element);
		}
	};

	return { viewportRef };
};
