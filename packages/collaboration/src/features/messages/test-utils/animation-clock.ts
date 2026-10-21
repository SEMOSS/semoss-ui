import { act } from "@testing-library/react";
import { vi } from "vitest";

/** Deterministic animation frames without changing timeout-based component behavior. */
export function animationClock() {
	let time = 0;
	let nextId = 0;
	const frames = new Map<number, FrameRequestCallback>();
	vi.spyOn(performance, "now").mockImplementation(() => time);
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		frames.set(++nextId, callback);
		return nextId;
	});
	vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
	return {
		pending: () => frames.size,
		advance(milliseconds: number) {
			const end = time + milliseconds;
			while (time < end) {
				time = Math.min(end, time + 16);
				const callbacks = [...frames.values()];
				frames.clear();
				act(() => {
					for (const callback of callbacks) callback(time);
				});
			}
		},
	};
}
