import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useMarkdownTypewriter } from "./use-markdown-typewriter";

/** Milliseconds between test animation frames, about 60fps. */
const FRAME_MS = 16;

let now = 0;
let nextFrameId = 1;
let frames = new Map<number, FrameRequestCallback>();

beforeEach(() => {
	now = 0;
	nextFrameId = 1;
	frames = new Map();
	vi.spyOn(performance, "now").mockImplementation(() => now);
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		const id = nextFrameId++;
		frames.set(id, callback);
		return id;
	});
	vi.stubGlobal("cancelAnimationFrame", (id: number) => {
		frames.delete(id);
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

/**
 * Run animation frames FRAME_MS apart.
 *
 * @param count - How many frames to run.
 */
const runFrames = (count: number): void => {
	for (let frame = 0; frame < count; frame++) {
		now += FRAME_MS;
		const due = [...frames.values()];
		frames.clear();
		act(() => {
			for (const callback of due) {
				callback(now);
			}
		});
	}
};

/**
 * The number of frames in a stretch of animation.
 *
 * @param seconds - How long the animation runs.
 */
const framesIn = (seconds: number): number =>
	Math.ceil((seconds * 1000) / FRAME_MS);

test("types a short reply at a steady pace", () => {
	const content = "Hello there, how can I help?";
	const { result } = renderHook(() => useMarkdownTypewriter(content));

	act(() => result.current.start());
	runFrames(1);

	expect(result.current.rendered.length).toBeGreaterThan(0);
	expect(result.current.rendered.length).toBeLessThan(content.length);
	expect(result.current.isTyping).toBe(true);

	runFrames(framesIn(1));

	expect(result.current.rendered).toBe(content);
	expect(result.current.isTyping).toBe(false);
});

test("types a long reply that arrived in one burst within a few seconds", () => {
	const content = "body: the message ".repeat(1000);
	const { result } = renderHook(() => useMarkdownTypewriter(content));

	act(() => result.current.start());
	runFrames(1);

	expect(result.current.rendered.length).toBeLessThan(content.length);

	runFrames(framesIn(4));

	expect(result.current.rendered).toBe(content);
	expect(result.current.isTyping).toBe(false);
});

test("keeps its pace after closed markdown spans", () => {
	const content = `Use \`code\`, **bold**, *italic* and a snake_case name. ${"plain words ".repeat(300)}`;
	const { result } = renderHook(() => useMarkdownTypewriter(content));

	act(() => result.current.start());
	runFrames(framesIn(4));

	expect(result.current.rendered).toBe(content);
});

test("shows a short bold span whole once it closes", () => {
	const content = "Say **hi** to everyone";
	const { result } = renderHook(() => useMarkdownTypewriter(content));
	const seen: string[] = [];

	act(() => result.current.start());
	for (let frame = 0; frame < framesIn(1); frame++) {
		runFrames(1);
		seen.push(result.current.rendered);
	}

	expect(seen.at(-1)).toBe(content);
	expect(
		seen.filter(
			(text) =>
				text.length > "Say ".length && !text.startsWith("Say **hi**"),
		),
	).toEqual([]);
});

test("keeps its place when the end of its content moves to an html chunk", () => {
	const { result, rerender } = renderHook(
		({ content }: { content: string }) => useMarkdownTypewriter(content),
		{ initialProps: { content: "Intro text ```" } },
	);

	act(() => result.current.start());
	runFrames(framesIn(1));

	expect(result.current.rendered).toBe("Intro text ```");

	rerender({ content: "Intro text " });

	expect(result.current.rendered).toBe("Intro text ");

	rerender({ content: "Intro text and more" });

	expect(result.current.rendered).toBe("Intro text ");

	runFrames(framesIn(1));

	expect(result.current.rendered).toBe("Intro text and more");
});

test("starts over when its content is replaced", () => {
	const { result, rerender } = renderHook(
		({ content }: { content: string }) => useMarkdownTypewriter(content),
		{ initialProps: { content: "First answer" } },
	);

	act(() => result.current.start());
	runFrames(framesIn(1));

	expect(result.current.rendered).toBe("First answer");

	rerender({ content: "Another answer" });

	expect(result.current.rendered).toBe("");
	expect(result.current.isTyping).toBe(false);
});

test("starts with its content shown on a return view", () => {
	const { result } = renderHook(() =>
		useMarkdownTypewriter("Already here", true),
	);

	expect(result.current.rendered).toBe("Already here");
	expect(result.current.isTyping).toBe(false);
});
