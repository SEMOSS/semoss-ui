import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ============================================
// CONFIGURATION
// ============================================
const CHARS_PER_FRAME = 2; // Characters to reveal per animation frame
const DEBOUNCE_MS = 15; // Batch updates when content streams too fast (66fps throttle)
const MAX_BACKTRACK = 40; // Maximum characters to walk back for syntax safety

// ============================================
// CODE FENCE SKIP
// ============================================
/**
 * If targetIndex lands inside a fenced code block (``` ... ```), jump to the
 * index just past the closing fence so the block is revealed atomically.
 * Prevents partial syntax from rendering mid-animation.
 * Inline backticks are NOT affected — only triple-backtick fences.
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
				// No closing fence yet — unclosed block, leave target as-is
				break;
			}
			const blockEnd = closingIdx + 3;
			if (targetIndex < blockEnd) {
				// targetIndex is inside this fence → jump to end of block
				return blockEnd;
			}
			// This fence is entirely before targetIndex — skip past it and continue
			i = blockEnd;
		} else {
			i++;
		}
	}
	return targetIndex;
}

// ============================================
// SYNTAX-AWARE SAFE INDEX FINDER
// ============================================
const INCOMPLETE_MARKDOWN_PATTERNS: RegExp[] = [
	/```[\s\S]*$/, // Unclosed code block
	/`[^`]*$/, // Unclosed inline code
	/\*\*[^*]+$/, // Unclosed bold **
	/(?<!\*)\*[^*]+$/, // Unclosed italic *
	/__[^_]+$/, // Unclosed bold __
	/(?<!_)_[^_\s][^_]*$/, // Unclosed italic _
	/\[(?:[^\]]*)$/, // Unclosed link text [
	/\]\([^)]*$/, // Unclosed link URL ](
	/!\[(?:[^\]]*)$/, // Unclosed image alt ![
	/~~[^~]+$/, // Unclosed strikethrough
];

/**
 * Test if text has incomplete markdown syntax using early-exit matching.
 */
function hasIncompleteMarkdown(text: string): boolean {
	for (const pattern of INCOMPLETE_MARKDOWN_PATTERNS) {
		if (pattern.test(text)) return true;
	}
	return false;
}

/**
 * Find safe index using binary search + validation for faster backtracking.
 */
function findSafeIndex(fullText: string, targetIndex: number): number {
	targetIndex = Math.min(targetIndex, fullText.length);

	// Fast path: if current position is safe, return it
	if (!hasIncompleteMarkdown(fullText.slice(0, targetIndex))) {
		return targetIndex;
	}

	// Binary search backwards to find safe point
	let left = Math.max(0, targetIndex - MAX_BACKTRACK);
	let right = targetIndex;
	let safeIndex = left;

	while (left <= right) {
		const mid = Math.floor((left + right) / 2);
		if (hasIncompleteMarkdown(fullText.slice(0, mid))) {
			right = mid - 1;
		} else {
			safeIndex = mid;
			left = mid + 1;
		}
	}

	// Never go backwards
	return Math.max(1, safeIndex);
}

interface UseMarkdownTypewriterReturn {
	rendered: string;
	isTyping: boolean;
	start: () => void;
	stop: () => void;
	skipToEnd: () => void;
	reset: () => void;
}

export function useMarkdownTypewriter(
	content: string,
): UseMarkdownTypewriterReturn {
	const [renderedLength, setRenderedLength] = useState<number>(0);
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const contentRef = useRef<string>(content);
	const rafRef = useRef<number | null>(null);
	const lastUpdateRef = useRef<number>(0);
	const pendingCharsRef = useRef<number>(0);

	// Keep content ref updated
	useEffect(() => {
		const prev = contentRef.current;
		if (!content.startsWith(prev) || content.length < prev.length) {
			setRenderedLength(0);
			setIsRunning(false);
		}
		contentRef.current = content;
	}, [content]);

	// Memoize rendered string to prevent re-slicing
	const rendered = useMemo(() => {
		return content.slice(0, renderedLength);
	}, [content, renderedLength]);

	// On tab return, snap renderedLength forward to absorb everything that
	// streamed in while away, then reset timing so only net-new tokens animate.
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				setRenderedLength(contentRef.current.length);
				lastUpdateRef.current = performance.now();
				pendingCharsRef.current = 0;
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

	// requestAnimationFrame-based typewriter for smooth 60fps animation
	useEffect(() => {
		if (!isRunning) {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			return;
		}

		const animate = (currentTime: number) => {
			// Debounce updates based on elapsed time
			if (currentTime - lastUpdateRef.current < DEBOUNCE_MS) {
				rafRef.current = requestAnimationFrame(animate);
				return;
			}

			lastUpdateRef.current = currentTime;
			pendingCharsRef.current += CHARS_PER_FRAME;

			setRenderedLength((prev) => {
				const fullText = contentRef.current;
				const target = prev + Math.floor(pendingCharsRef.current);
				pendingCharsRef.current = 0;

				if (target >= fullText.length) {
					return fullText.length; // Caught up
				}

				// Jump past any enclosing code fence so blocks appear atomically.
				// Prevents partial syntax from rendering mid-animation for non-html
				// code fences (e.g. ```python, ```ts) that live inside md chunks.
				const skipped = skipPastCodeFence(fullText, target);

				// Find syntax-safe index
				const safeIndex = findSafeIndex(fullText, skipped);

				// Always progress at least 1 character
				return Math.max(prev + 1, safeIndex);
			});

			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
		};
	}, [isRunning]);

	const start = useCallback(() => {
		lastUpdateRef.current = performance.now();
		pendingCharsRef.current = 0;
		setIsRunning(true);
	}, []);

	const stop = useCallback(() => {
		setIsRunning(false);
	}, []);

	const skipToEnd = useCallback(() => {
		setRenderedLength(contentRef.current.length);
		setIsRunning(false);
	}, []);

	const reset = useCallback(() => {
		setRenderedLength(0);
		setIsRunning(false);
	}, []);

	return {
		rendered,
		isTyping: isRunning && renderedLength < content.length,
		start,
		stop,
		skipToEnd,
		reset,
	};
}
