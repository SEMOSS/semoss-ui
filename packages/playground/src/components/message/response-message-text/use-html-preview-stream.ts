import { useEffect, useRef, useState } from "react";

/** A chunk-boundary heuristic, not HTML sanitization or a security check. */
function isCompletePreviewChunk(value: string): boolean {
	if (!value.trim()) return false;
	if (
		/<script(?![^>]*\bsrc\s*=)[^>]*>(?![\s\S]*<\/script\s*>)/i.test(value)
	) {
		return false;
	}
	if (/<style[^>]*>(?![\s\S]*<\/style\s*>)/i.test(value)) return false;
	return !/<[^>]*$/.test(value);
}

/** Throttles complete HTML chunks without delaying or filtering the final result. */
export function useHtmlPreviewStream(html: string, isLoading: boolean): string {
	const [streamedHtml, setStreamedHtml] = useState(() =>
		isLoading && !isCompletePreviewChunk(html) ? "" : html,
	);
	const latestHtmlRef = useRef(streamedHtml);
	const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (flushTimerRef.current !== null)
				clearTimeout(flushTimerRef.current);
			flushTimerRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!isLoading) {
			if (flushTimerRef.current !== null)
				clearTimeout(flushTimerRef.current);
			flushTimerRef.current = null;
			latestHtmlRef.current = html;
			setStreamedHtml(html);
			return;
		}
		if (!isCompletePreviewChunk(html)) return;
		latestHtmlRef.current = html;
		if (html === streamedHtml) return;
		if (!streamedHtml) {
			setStreamedHtml(html);
			return;
		}
		if (flushTimerRef.current !== null) return;
		flushTimerRef.current = setTimeout(() => {
			flushTimerRef.current = null;
			setStreamedHtml(latestHtmlRef.current);
		}, 120);
	}, [html, isLoading, streamedHtml]);

	return isLoading ? streamedHtml : html;
}
