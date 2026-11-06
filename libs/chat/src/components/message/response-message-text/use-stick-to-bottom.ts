import { useCallback, useLayoutEffect, useRef } from "react";

/** How close to the bottom still counts as "at the bottom", in pixels. */
const STICK_THRESHOLD = 24;

/**
 * Keeps a height capped block scrolled to its newest content.
 *
 * A block that grows while a response streams used to push the conversation
 * down, and the room's own scroll followed it. Now that these blocks stop
 * growing at a fixed height, the new lines land below the fold inside the block
 * instead, so the block has to follow them itself.
 *
 * It only follows while the user is already at the bottom of the block. Scroll
 * up to read something and it stays put; scroll back down and it resumes. Once
 * the content stops changing this does nothing, so anything streamed after the
 * block goes back to moving the room's scroll as usual.
 *
 * @param content the streaming text, so the follow runs as it grows
 * @return a ref for the scrolling element and the scroll handler to attach
 */
export const useStickToBottom = (content: string) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const shouldFollow = useRef(true);

	// before paint, so the content never appears scrolled to the wrong place
	// biome-ignore lint/correctness/useExhaustiveDependencies: content is the trigger, the body reads refs
	useLayoutEffect(() => {
		const element = ref.current;
		if (!element || !shouldFollow.current) {
			return;
		}
		element.scrollTop = element.scrollHeight;
	}, [content]);

	const onScroll = useCallback(() => {
		const element = ref.current;
		if (!element) {
			return;
		}
		shouldFollow.current =
			element.scrollHeight - element.scrollTop - element.clientHeight <=
			STICK_THRESHOLD;
	}, []);

	return { ref, onScroll };
};
