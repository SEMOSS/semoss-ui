import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Slowest reveal pace in characters per millisecond, about 2 a frame at 60fps. */
const MIN_CHARS_PER_MS = 0.12;

/**
 * Milliseconds over which the reveal spreads the text still waiting to type.
 * It matches the room's 500ms streaming poll, so each poll's text types out
 * before the next one lands however fast the model streams, and a reply that
 * arrives in one burst finishes typing within a few seconds.
 */
const CATCH_UP_MS = 500;

/** Shortest gap in milliseconds between reveal steps, about 66 renders a second. */
const MIN_STEP_MS = 15;

/** Furthest, in characters, the visible text holds back to show a markdown span whole. */
const MAX_BACKTRACK = 40;

/** A markdown delimiter that may be the first half of a longer one. */
const TRAILING_DELIMITER = /[*_~`[\]!]$/;

/** A link or image whose text or address has not closed. */
const OPEN_LINK = /\[[^\]]*$|\]\([^)]*$/;

/**
 * Emphasis and strikethrough delimiters, which come in pairs. A lone `*`
 * counts only where it can open or close emphasis, so list markers and spaced
 * operators do not; a lone `_` also skips the middle of a word, as in
 * snake_case.
 */
const PAIRED_DELIMITERS: RegExp[] = [
	/\*\*/g,
	/__/g,
	/~~/g,
	/(?<=[^*\s])\*(?!\*)|(?<!\*)\*(?=[^*\s])/g,
	/(?<=[^_\s])_(?!\w)|(?<!\w)_(?=[^_\s])/g,
];

/** How far the reveal has typed and how much of it is on screen. */
interface RevealState {
	/** Characters typed so far; ahead of `revealed` while a span is held back. */
	readonly cursor: number;

	/** Characters on screen. */
	readonly revealed: number;
}

/**
 * A reveal with `length` characters typed and shown.
 *
 * @param length - Characters typed and shown.
 */
const revealAt = (length: number): RevealState => ({
	cursor: length,
	revealed: length,
});

/**
 * If targetIndex lands inside a fenced code block (``` ... ```), jump to the
 * index just past the closing fence so the block is revealed atomically.
 * Prevents partial syntax from rendering mid-animation.
 * Inline backticks are NOT affected, only triple-backtick fences.
 */
function skipPastCodeFence(fullText: string, targetIndex: number): number {
	let i = 0;
	while (i < targetIndex) {
		// Detect a triple-backtick opening fence
		if (
			fullText[i] === "`" &&
			fullText[i + 1] === "`" &&
			fullText[i + 2] === "`"
		) {
			const closingIdx = fullText.indexOf("```", i + 3);
			if (closingIdx === -1) {
				// No closing fence yet, so the block is unclosed: leave target as-is
				break;
			}
			const blockEnd = closingIdx + 3;
			if (targetIndex < blockEnd) {
				// targetIndex is inside this fence: jump to the end of the block
				return blockEnd;
			}
			// This fence is entirely before targetIndex: skip past it and continue
			i = blockEnd;
		} else {
			i++;
		}
	}
	return targetIndex;
}

/**
 * The text of a paragraph outside its inline code spans, or null when a code
 * span is still open. A span opens on a run of backticks and closes on the
 * next run of the same length.
 *
 * @param text - One paragraph of markdown.
 */
function textOutsideCodeSpans(text: string): string | null {
	const runs: { start: number; end: number }[] = [];
	const pattern = /`+/g;
	for (
		let match = pattern.exec(text);
		match !== null;
		match = pattern.exec(text)
	) {
		runs.push({ start: match.index, end: match.index + match[0].length });
	}

	let outside = "";
	let cursor = 0;
	let next = 0;
	while (next < runs.length) {
		const open = runs[next];
		const openAt = next;
		const length = open.end - open.start;
		const closeAt = runs.findIndex(
			(run, index) => index > openAt && run.end - run.start === length,
		);
		if (closeAt === -1) {
			return null;
		}
		outside += text.slice(cursor, open.start);
		cursor = runs[closeAt].end;
		next = closeAt + 1;
	}
	return outside + text.slice(cursor);
}

/**
 * Whether `text` ends inside markdown that is still open: an inline code
 * span, an emphasis or strikethrough span, or a link, within the paragraph the
 * text ends in. Closed spans before it never count. Text inside an open code
 * fence types as-is, so it never counts either.
 *
 * @param text - The markdown that would be on screen.
 */
function endsInsideOpenSpan(text: string): boolean {
	let fences = 0;
	let lastFence = -1;
	for (
		let at = text.indexOf("```");
		at !== -1;
		at = text.indexOf("```", at + 3)
	) {
		fences++;
		lastFence = at;
	}
	if (fences % 2 === 1) {
		return false;
	}

	const lastBreak = text.lastIndexOf("\n\n");
	const paragraph = text.slice(
		Math.max(
			lastFence === -1 ? 0 : lastFence + 3,
			lastBreak === -1 ? 0 : lastBreak + 2,
		),
	);
	if (TRAILING_DELIMITER.test(paragraph)) {
		return true;
	}

	const prose = textOutsideCodeSpans(paragraph);
	if (prose === null) {
		return true;
	}
	return (
		OPEN_LINK.test(prose) ||
		PAIRED_DELIMITERS.some(
			(pattern) => (prose.match(pattern)?.length ?? 0) % 2 === 1,
		)
	);
}

/**
 * How much of the text to show once the reveal has typed up to `cursor`: all
 * of it, or the latest point at most MAX_BACKTRACK characters back where no
 * span is left open, so a short span appears whole once the cursor passes its
 * closing delimiter. A span that opened further back than that shows as it
 * types. Never less than what is already on screen.
 *
 * @param fullText - The full text so far.
 * @param revealed - Characters already on screen.
 * @param cursor - Characters typed.
 */
function visibleLength(
	fullText: string,
	revealed: number,
	cursor: number,
): number {
	if (cursor >= fullText.length) {
		return fullText.length;
	}
	if (!endsInsideOpenSpan(fullText.slice(0, cursor))) {
		return cursor;
	}

	let left = Math.max(revealed, cursor - MAX_BACKTRACK);
	let right = cursor - 1;
	let safeIndex = -1;
	while (left <= right) {
		const mid = Math.floor((left + right) / 2);
		if (endsInsideOpenSpan(fullText.slice(0, mid))) {
			right = mid - 1;
		} else {
			safeIndex = mid;
			left = mid + 1;
		}
	}
	return safeIndex === -1 ? cursor : safeIndex;
}

/**
 * The reveal after `elapsed` milliseconds. The cursor moves fast enough to
 * close the text still waiting within about CATCH_UP_MS, never slower than
 * MIN_CHARS_PER_MS, and past any code fence it enters. Returns `state` itself
 * once everything is shown, so a caught up typewriter does not re-render.
 *
 * @param state - The reveal so far.
 * @param fullText - The full text so far.
 * @param elapsed - Milliseconds since the last step.
 */
function advanceReveal(
	state: RevealState,
	fullText: string,
	elapsed: number,
): RevealState {
	if (state.cursor >= fullText.length) {
		return state.revealed === fullText.length
			? state
			: revealAt(fullText.length);
	}

	const waiting = fullText.length - state.cursor;
	const pace = Math.max(MIN_CHARS_PER_MS, waiting / CATCH_UP_MS);
	const typed = state.cursor + Math.max(1, Math.round(elapsed * pace));
	const cursor = Math.min(
		fullText.length,
		skipPastCodeFence(fullText, typed),
	);
	return {
		cursor,
		revealed: visibleLength(fullText, state.revealed, cursor),
	};
}

interface UseMarkdownTypewriterReturn {
	/** The text revealed so far, to render as markdown. */
	rendered: string;

	/** The typewriter is running and has text left to reveal. */
	isTyping: boolean;

	/** Start revealing from the current position. */
	start: () => void;

	/** Pause where it is. */
	stop: () => void;

	/** Show all of the content and stop. */
	skipToEnd: () => void;

	/** Hide everything and stop. */
	reset: () => void;
}

/**
 * Type out streamed markdown. The reveal keeps pace with the text that has
 * arrived, spreading it over about CATCH_UP_MS, and shows code fences and short
 * markdown spans whole. It runs on animation frames between `start` and
 * `stop`, and jumps to the latest text when the tab becomes visible again.
 *
 * Content that grows keeps the reveal where it is, and so does content cut
 * back to a prefix of itself, as when a chunk's tail moves into an html chunk.
 * Any other change starts over from nothing.
 *
 * @param content - The full text so far; it grows as the stream arrives.
 * @param startAtLatest - Start with all of `content` shown, so only later text types.
 * @returns The text to render, whether it is still typing, and its controls.
 */
export function useMarkdownTypewriter(
	content: string,
	startAtLatest: boolean = false,
): UseMarkdownTypewriterReturn {
	const [reveal, setReveal] = useState<RevealState>(() =>
		revealAt(startAtLatest ? content.length : 0),
	);
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const contentRef = useRef<string>(content);
	const lastStepRef = useRef<number>(0);

	useEffect(() => {
		const previous = contentRef.current;
		contentRef.current = content;
		if (content.startsWith(previous)) {
			return;
		}
		if (previous.startsWith(content)) {
			setReveal((state) => ({
				cursor: Math.min(state.cursor, content.length),
				revealed: Math.min(state.revealed, content.length),
			}));
			return;
		}
		setReveal(revealAt(0));
		setIsRunning(false);
	}, [content]);

	const rendered = useMemo(
		() => content.slice(0, reveal.revealed),
		[content, reveal.revealed],
	);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				setReveal(revealAt(contentRef.current.length));
				lastStepRef.current = performance.now();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
		};
	}, []);

	useEffect(() => {
		if (!isRunning) {
			return;
		}

		let frame = 0;
		const step = (now: number) => {
			const elapsed = now - lastStepRef.current;
			if (elapsed >= MIN_STEP_MS) {
				lastStepRef.current = now;
				setReveal((state) =>
					advanceReveal(state, contentRef.current, elapsed),
				);
			}
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);

		return () => {
			cancelAnimationFrame(frame);
		};
	}, [isRunning]);

	const start = useCallback(() => {
		lastStepRef.current = performance.now();
		setIsRunning(true);
	}, []);

	const stop = useCallback(() => {
		setIsRunning(false);
	}, []);

	const skipToEnd = useCallback(() => {
		setReveal(revealAt(contentRef.current.length));
		setIsRunning(false);
	}, []);

	const reset = useCallback(() => {
		setReveal(revealAt(0));
		setIsRunning(false);
	}, []);

	return {
		rendered,
		isTyping: isRunning && reveal.revealed < content.length,
		start,
		stop,
		skipToEnd,
		reset,
	};
}
