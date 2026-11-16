import { describe, expect, it, vi } from "vitest";
import { Observable } from "./observable";

describe("Observable", () => {
	it("keeps the same snapshot until it changes", () => {
		const state = new Observable({ count: 0 });
		const first = state.getSnapshot();

		expect(state.getSnapshot()).toBe(first);

		state.update({ count: 1 });
		expect(state.getSnapshot()).not.toBe(first);
		expect(state.getSnapshot()).toEqual({ count: 1 });
		expect(first).toEqual({ count: 0 });
	});

	it("keeps the fields an update leaves out", () => {
		const state = new Observable({ count: 0, label: "a" });

		state.update({ count: 2 });

		expect(state.getSnapshot()).toEqual({ count: 2, label: "a" });
	});

	it("tells listeners until they stop listening", () => {
		const state = new Observable({ count: 0 });
		const listener = vi.fn();
		const stop = state.subscribe(listener);

		state.set({ count: 1 });
		stop();
		state.set({ count: 2 });

		expect(listener).toHaveBeenCalledTimes(1);
	});
});
