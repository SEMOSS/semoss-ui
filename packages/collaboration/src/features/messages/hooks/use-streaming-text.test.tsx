import { act, renderHook } from "@testing-library/react";
import { animationClock } from "../test-utils/animation-clock";
import { useStreamingText } from "./use-streaming-text";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("useStreamingText", () => {
	it("shows the mount baseline, smooths bursts, finishes within 180ms, and sleeps when caught up", () => {
		const clock = animationClock();
		const { result, rerender } = renderHook(useStreamingText, {
			initialProps: { text: "Already received. ", isStreaming: true },
		});
		expect(result.current.displayedText).toBe("Already received. ");
		const text = `Already received. ${"A long response. ".repeat(100)}`;
		rerender({ text, isStreaming: true });
		clock.advance(32);
		expect(result.current.displayedText.length).toBeGreaterThan(18);
		expect(result.current.displayedText.length).toBeLessThan(text.length);
		rerender({ text, isStreaming: false });
		clock.advance(180);
		expect(result.current).toEqual({
			displayedText: text,
			isRevealing: false,
		});
		expect(clock.pending()).toBe(0);
	});

	it("restarts for slow arrivals without a perpetual frame loop", () => {
		const clock = animationClock();
		const { result, rerender, unmount } = renderHook(useStreamingText, {
			initialProps: { text: "", isStreaming: true },
		});
		for (const text of ["Hello", "Hello there", "Hello there."]) {
			rerender({ text, isStreaming: true });
			clock.advance(500);
			expect(result.current.displayedText).toBe(text);
			expect(clock.pending()).toBe(0);
		}
		rerender({ text: "Hello there. ".repeat(500), isStreaming: true });
		expect(clock.pending()).toBe(1);
		unmount();
		expect(clock.pending()).toBe(0);
	});

	it("never cuts inside a Unicode grapheme", () => {
		const clock = animationClock();
		const { result, rerender } = renderHook(useStreamingText, {
			initialProps: { text: "", isStreaming: true },
		});
		const text = "👨‍👩‍👧‍👦 e\u0301 नमस्ते 🇺🇸 ".repeat(10);
		const boundaries = new Set([
			0,
			...Array.from(
				new Intl.Segmenter(undefined, {
					granularity: "grapheme",
				}).segment(text),
				(segment) => segment.index + segment.segment.length,
			),
		]);
		rerender({ text, isStreaming: true });
		for (let index = 0; index < 60; index++) {
			clock.advance(16);
			expect(boundaries.has(result.current.displayedText.length)).toBe(
				true,
			);
		}
		expect(result.current.displayedText).toBe(text);
	});

	it("flushes replacements and cancellation without showing stale text", () => {
		const clock = animationClock();
		const { result, rerender } = renderHook(useStreamingText, {
			initialProps: {
				text: "original",
				isStreaming: true,
				shouldFlush: false,
			},
		});
		rerender({
			text: "original grows".repeat(100),
			isStreaming: true,
			shouldFlush: false,
		});
		clock.advance(16);
		rerender({ text: "corrected", isStreaming: true, shouldFlush: false });
		expect(result.current.displayedText).toBe("corrected");
		rerender({
			text: "corrected and cancelled",
			isStreaming: true,
			shouldFlush: true,
		});
		expect(result.current.displayedText).toBe("corrected and cancelled");
		expect(clock.pending()).toBe(0);
	});

	it("catches up on tab return and follows reduced-motion changes", () => {
		const clock = animationClock();
		const query = new EventTarget();
		let matches = false;
		vi.stubGlobal("matchMedia", () => ({
			get matches() {
				return matches;
			},
			addEventListener: query.addEventListener.bind(query),
			removeEventListener: query.removeEventListener.bind(query),
		}));
		const { result, rerender } = renderHook(useStreamingText, {
			initialProps: { text: "", isStreaming: true },
		});
		rerender({ text: "buffered ".repeat(100), isStreaming: true });
		act(() => document.dispatchEvent(new Event("visibilitychange")));
		expect(result.current.displayedText).toBe("buffered ".repeat(100));
		expect(clock.pending()).toBe(0);
		rerender({
			text: `${"buffered ".repeat(100)}new tokens`,
			isStreaming: true,
		});
		act(() => {
			matches = true;
			query.dispatchEvent(new Event("change"));
		});
		expect(result.current.isRevealing).toBe(false);
		expect(result.current.displayedText.endsWith("new tokens")).toBe(true);
		expect(clock.pending()).toBe(0);
	});
});
