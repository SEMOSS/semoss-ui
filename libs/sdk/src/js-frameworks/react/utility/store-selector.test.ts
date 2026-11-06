import { describe, expect, it, vi } from "vitest";
import { createSelection } from "./store-selector";

describe("createSelection", () => {
	it("returns the last value for the same snapshot and selector", () => {
		const select = createSelection();
		const snapshot = { count: 1 };
		const selector = vi.fn((state: { count: number }) => ({
			doubled: state.count * 2,
		}));

		const first = select(snapshot, selector);
		const second = select(snapshot, selector);

		expect(second).toBe(first);
		expect(selector).toHaveBeenCalledTimes(1);
	});

	it("keeps the last value when a new selection holds the same entries", () => {
		const select = createSelection();
		const pick = (state: { a: number; b: number }) => ({ a: state.a });

		const first = select({ a: 1, b: 1 }, pick);
		const second = select({ a: 1, b: 2 }, pick);
		const third = select({ a: 2, b: 2 }, pick);

		expect(second).toBe(first);
		expect(third).toEqual({ a: 2 });
		expect(third).not.toBe(first);
	});

	it("replaces an error selection when its message changes", () => {
		const select = createSelection();
		const pick = (state: { error: Error }) => state.error;
		const firstError = new Error("offline");
		const nextError = new Error("new backend failure");

		expect(select({ error: firstError }, pick)).toBe(firstError);
		expect(select({ error: nextError }, pick)).toBe(nextError);
		expect(select({ error: nextError }, pick).message).toBe(
			"new backend failure",
		);
	});

	it("keeps equivalent array selections stable", () => {
		const select = createSelection();
		const pick = (state: { count: number }) => [state.count];

		const first = select({ count: 1 }, pick);
		expect(select({ count: 1 }, pick)).toBe(first);
		expect(select({ count: 2 }, pick)).toEqual([2]);
	});
});
