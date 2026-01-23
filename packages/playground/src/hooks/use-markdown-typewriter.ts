import { useEffect, useRef, useState } from "react";

// ============================================
// SYNTAX-AWARE SAFE INDEX FINDER
// ============================================
const TICK_CHARS = 2;
const TICK_MS = 25;
const INCOMPLETE_MARKDOWN_PATTERNS: RegExp[] = [
	// Code blocks (must check first - triple backticks)
	/```[\s\S]*$/, // Unclosed code block

	// Inline code
	/`[^`]*$/, // Unclosed inline code

	// Bold/Italic (asterisks)
	/\*\*[^*]+$/, // Unclosed bold **
	/(?<!\*)\*[^*]+$/, // Unclosed italic *

	// Bold/Italic (underscores)
	/__[^_]+$/, // Unclosed bold __
	/(?<!_)_[^_\s][^_]*$/, // Unclosed italic _

	// Links and images
	/\[(?:[^\]]*)$/, // Unclosed link text [
	/\]\([^)]*$/, // Unclosed link URL ](
	/!\[(?:[^\]]*)$/, // Unclosed image alt ![

	// Strikethrough
	/~~[^~]+$/, // Unclosed strikethrough
];

/**
 * Test if the given text has any incomplete markdown syntax.
 * @param text - the text to test
 * @returns true if incomplete markdown syntax is found, false otherwise
 */
function hasIncompleteMarkdown(text: string): boolean {
	return INCOMPLETE_MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Find a safe index to cut off markdown text without leaving incomplete syntax.
 * @param fullText - the full markdown text
 * @param targetIndex - the desired cut-off index
 * @returns
 */
function findSafeIndex(fullText: string, targetIndex: number): number {
	// Don't exceed what we have
	targetIndex = Math.min(targetIndex, fullText.length);

	let candidate = targetIndex;

	// Check if current slice has incomplete markdown
	while (
		candidate > 0 &&
		hasIncompleteMarkdown(fullText.slice(0, candidate))
	) {
		// Walk back to find where the incomplete syntax started
		candidate--;
	}

	// If we walked back too far (more than 50 chars),
	// just use word boundary instead
	if (targetIndex - candidate > 50) {
		candidate = targetIndex;
		// Find last safe word boundary
		const slice = fullText.slice(0, targetIndex);
		const lastSpace = Math.max(
			slice.lastIndexOf(" "),
			slice.lastIndexOf("\n"),
		);
		if (lastSpace > targetIndex - 20) {
			candidate = lastSpace + 1;
		}
	}

	// Never go backwards from what's already displayed
	return Math.max(1, candidate);
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

	// Keep content ref updated
	useEffect(() => {
		// reset if the content has a different start
		const prev = contentRef.current;
		if (!content.startsWith(prev) || content.length < prev.length) {
			setRenderedLength(0);
			setIsRunning(false);
		}

		contentRef.current = content;
	}, [content]);

	// Typewriter interval
	useEffect(() => {
		if (!isRunning) {
			return;
		}

		const interval = setInterval(() => {
			setRenderedLength((prev) => {
				const fullText = contentRef.current;

				if (prev >= fullText.length) {
					return prev; // Caught up, wait for more content
				}

				// Calculate target (raw increment)
				const rawTarget = prev + TICK_CHARS;

				// Find syntax-safe index
				const safeIndex = findSafeIndex(fullText, rawTarget);

				// Ensure we always make progress
				return Math.max(prev + 1, safeIndex);
			});
		}, TICK_MS);

		return () => clearInterval(interval);
	}, [isRunning]);

	return {
		rendered: content.slice(0, renderedLength),
		isTyping: isRunning && renderedLength < content.length,
		start: () => setIsRunning(true),
		stop: () => setIsRunning(false),
		skipToEnd: () => {
			setRenderedLength(content.length);
			setIsRunning(false);
		},
		reset: () => {
			setRenderedLength(0);
			setIsRunning(false);
		},
	};
}
