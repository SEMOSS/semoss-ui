import { useCallback, useMemo, useRef, useState } from "react";

export type ChunkStatus = "done" | "active" | "not_started";

/**
 * Sequential reveal queue. Tracks which index is currently allowed to animate
 * and hands each item a stable callback to advance the queue when it's done.
 *
 * @param length     number of items in the queue
 * @param isActive   whether the source is still streaming — holds the last item
 *                   so it keeps animating as more content arrives
 * @param onComplete optional — called when the *last* item reports completion,
 *                   so a parent queue can learn this whole queue has caught up.
 *                   The parent's own guard decides whether to actually advance.
 */
export const useActiveIndex = (
	length: number,
	isActive: boolean,
	onComplete?: () => void,
) => {
	// Index of the item currently allowed to animate.
	const [activeIndex, setActiveIndex] = useState(0);

	// Keep onComplete in a ref so it's never a dependency below — callers may
	// pass a fresh closure each render, and we don't want to regenerate
	// chunkCallbacks (which would re-fire children effects that dep on it).
	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete;

	// Called by each item when its animation is complete. Only advances when the
	// completed item is the current active one. If it's the last item and we're
	// still streaming, hold — more content may arrive. When the last item
	// completes, notify the parent (if any) so a higher-level queue can advance.
	const handleChunkComplete = useCallback(
		(completedIndex: number) => {
			setActiveIndex((current) => {
				if (completedIndex !== current) return current;
				if (completedIndex === length - 1 && isActive) return current;
				return completedIndex + 1;
			});
			if (completedIndex === length - 1) {
				onCompleteRef.current?.();
			}
		},
		[length, isActive],
	);

	// Stable per-item callbacks — each function identity is preserved across
	// re-renders as long as the item count doesn't change. This prevents effects
	// in children that dep on `onComplete` from firing on every streaming token
	// just because the parent re-rendered.
	const chunkCallbacks = useMemo(
		() =>
			Array.from({ length }, (_, idx) => () => handleChunkComplete(idx)),
		[length, handleChunkComplete],
	);

	// Derives the animation status for an item at the given index. Once streaming
	// ends (!isActive), all remaining items render their full content immediately
	// rather than animating sequentially.
	const getChunkStatus = (index: number): ChunkStatus => {
		if (!isActive || activeIndex > index) return "done";
		if (activeIndex === index) return "active";
		return "not_started";
	};

	return { chunkCallbacks, getChunkStatus };
};
