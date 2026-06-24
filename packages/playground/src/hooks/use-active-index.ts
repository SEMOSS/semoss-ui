import { useCallback, useMemo, useState } from "react";

export type ChunkStatus = "done" | "active" | "not_started";

export const useActiveIndex = (length: number, isActive: boolean) => {
	// Index of the chunk currently allowed to animate.
	const [activeIndex, setActiveIndex] = useState(0);

	// Called by each subcomponent when its animation is complete.
	// Guards against duplicate or stale onComplete calls: only advances when
	// the completed chunk is actually the current active one.
	// If this is the last chunk and we're still receiving tokens (isThinking),
	// hold — the typewriter caught up mid-stream and should wait for more content.
	// A next chunk existing means this chunk is sealed by the parser, so advance freely.

	const handleChunkComplete = useCallback(
		(completedIndex: number) => {
			setActiveIndex((current) => {
				if (completedIndex !== current) return current;
				if (completedIndex === length - 1 && isActive) return current;
				return completedIndex + 1;
			});
		},
		[length, isActive],
	);

	// Stable per-chunk callbacks — each function identity is preserved across
	// re-renders as long as chunk count doesn't change. This prevents effects
	// in children that dep on `onComplete` from firing on every streaming token
	// just because the parent re-rendered.
	// `chunks` is a new array every render (parseChunks is pure and runs fresh
	// each time), so using it as a dep would defeat the purpose — we only need
	// to regenerate callbacks when the number of chunks changes.

	const chunkCallbacks = useMemo(
		() =>
			Array.from({ length }, (_, idx) => () => handleChunkComplete(idx)),
		// handleChunkComplete already captures chunks.length and isThinking
		[length, handleChunkComplete],
	);

	// Derives the animation status for a chunk at the given index.
	// Once streaming ends (!isThinking), all remaining chunks render their full
	// content immediately rather than animating sequentially.
	const getChunkStatus = (index: number): ChunkStatus => {
		if (!isActive || activeIndex > index) return "done";
		if (activeIndex === index) return "active";
		return "not_started";
	};
	return { chunkCallbacks, getChunkStatus };
};
