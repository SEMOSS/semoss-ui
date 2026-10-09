import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

interface StreamingTextOptions {
	/** Authoritative text; presentation never writes back to the source. */
	text: string;
	/** Whether this part can receive more text. */
	isStreaming: boolean;
	/** Interrupt display work for cancellation, errors, or approval requests. */
	shouldFlush?: boolean;
}

interface StreamingText {
	displayedText: string;
	isRevealing: boolean;
}

const FINISH_MS = 180;
const CATCH_UP_SECONDS = 0.12;
const MIN_CHARACTERS_PER_SECOND = 80;
const segmenter =
	typeof Intl.Segmenter === "function"
		? new Intl.Segmenter(undefined, { granularity: "grapheme" })
		: null;

/** Reveal only new text, with bounded catch-up and no idle animation loop. */
export function useStreamingText({
	text,
	isStreaming,
	shouldFlush = false,
}: StreamingTextOptions): StreamingText {
	const reducedMotion = useReducedMotion();
	// A newly mounted view shows the text already received, including restored runs.
	const [displayedText, setDisplayedText] = useState(text);
	const source = useRef(text);
	const offset = useRef(text.length);
	const wasStreaming = useRef(isStreaming);
	const deadline = useRef<number | null>(null);
	const frame = useRef<number | null>(null);

	useLayoutEffect(() => {
		const isReplacement = !text.startsWith(source.current);
		source.current = text;
		const now = performance.now();
		if (wasStreaming.current && !isStreaming) {
			deadline.current = now + FINISH_MS;
		} else if (isStreaming) {
			deadline.current = null;
		}
		wasStreaming.current = isStreaming;

		if (
			isReplacement ||
			shouldFlush ||
			reducedMotion ||
			document.visibilityState === "hidden" ||
			(!isStreaming && deadline.current === null)
		) {
			offset.current = text.length;
			deadline.current = null;
			setDisplayedText(text);
			return;
		}

		let lastTime = now;
		let progress = offset.current;
		const segments = segmenter?.segment(text);
		const animate = (time: number): void => {
			frame.current = null;
			const elapsed = Math.max(0, time - lastTime);
			lastTime = time;
			const remaining = text.length - progress;
			const finish = deadline.current;
			if (finish !== null && time >= finish) {
				progress = text.length;
			} else {
				const seconds =
					finish === null
						? CATCH_UP_SECONDS
						: Math.max(0.001, (finish - time + elapsed) / 1000);
				const speed = Math.max(
					MIN_CHARACTERS_PER_SECOND,
					remaining / seconds,
				);
				progress = Math.min(
					text.length,
					progress + (speed * elapsed) / 1000,
				);
			}
			let next = Math.floor(progress);
			if (next > offset.current && next < text.length) {
				const segment = segments?.containing(next - 1);
				if (segment) next = segment.index + segment.segment.length;
				else if (/^[\uDC00-\uDFFF]$/.test(text[next] ?? "")) next++;
			}
			if (next > offset.current) {
				offset.current = next;
				progress = Math.max(progress, next);
				setDisplayedText(text.slice(0, next));
			}
			if (offset.current < text.length) {
				frame.current = requestAnimationFrame(animate);
			} else {
				deadline.current = null;
			}
		};
		if (offset.current < text.length) {
			frame.current = requestAnimationFrame(animate);
		}
		return () => {
			if (frame.current !== null) cancelAnimationFrame(frame.current);
			frame.current = null;
		};
	}, [text, isStreaming, shouldFlush, reducedMotion]);

	useEffect(() => {
		const handleVisibility = (): void => {
			if (frame.current !== null) cancelAnimationFrame(frame.current);
			frame.current = null;
			offset.current = source.current.length;
			deadline.current = null;
			setDisplayedText(source.current);
		};
		document.addEventListener("visibilitychange", handleVisibility);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibility);
	}, []);

	const shouldShowSource =
		shouldFlush || reducedMotion || !text.startsWith(displayedText);
	return {
		displayedText: shouldShowSource ? text : displayedText,
		isRevealing: !shouldShowSource && displayedText.length < text.length,
	};
}
