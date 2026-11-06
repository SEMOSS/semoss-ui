import { useCallback, useMemo, useState } from "react";

export type ChunkStatus = "done" | "active" | "not_started";

interface UseActiveIndexReturn {
	/** One callback per item; each advances the queue past its item. */
	chunkCallbacks: (() => void)[];

	/** Animation status of the item at an index. */
	getChunkStatus: (index: number) => ChunkStatus;
}

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
 *                   A new identity regenerates `chunkCallbacks`, so the active
 *                   item reports again: that is how a nested queue held as its
 *                   parent's last item lets the parent advance once an item
 *                   lands below it. Pass a callback that is stable otherwise.
 * @param startAtLatest optional — on a return view, seed at the latest item so
 *                   we jump straight to the frontier instead of replaying the
 *                   reveal from the start. Only seeds the initial index; once
 *                   mounted the queue advances normally.
 */
export const useActiveIndex = (
	length: number,
	isActive: boolean,
	onComplete?: () => void,
	startAtLatest = false,
): UseActiveIndexReturn => {
	// Index of the item currently allowed to animate.
	const [activeIndex, setActiveIndex] = useState(
		startAtLatest ? Math.max(0, length - 1) : 0,
	);

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
				onComplete?.();
			}
		},
		[length, isActive, onComplete],
	);

	// Per-item callbacks keep their identity while the item count, the
	// streaming flag, and `onComplete` stay the same, so children whose effects
	// depend on them do not re-run on every streaming token. Any of those
	// changing re-runs those effects, and a caught up item reports again.
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
