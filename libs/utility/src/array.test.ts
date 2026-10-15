import { describe, expect, it } from "vitest";
import { isSameArray } from "./array";

describe("isSameArray", () => {
	it("matches arrays with the same items in the same order", () => {
		expect(isSameArray(["a", "b"], ["a", "b"])).toBe(true);
		expect(isSameArray([], [])).toBe(true);
	});

	it("tells apart a different order, length, or item", () => {
		expect(isSameArray(["a", "b"], ["b", "a"])).toBe(false);
		expect(isSameArray(["a"], ["a", "b"])).toBe(false);
		expect(isSameArray([1, 2], [1, 3])).toBe(false);
	});

	it("compares objects by reference", () => {
		const item = { id: 1 };
		expect(isSameArray([item], [item])).toBe(true);
		expect(isSameArray([item], [{ id: 1 }])).toBe(false);
	});
});
