import { describe, expect, it } from "vitest";
import { isShallowEqual } from "./object";

describe("isShallowEqual", () => {
	it("matches the same value", () => {
		const value = { a: 1 };

		expect(isShallowEqual(value, value)).toBe(true);
		expect(isShallowEqual(Number.NaN, Number.NaN)).toBe(true);
	});

	it("matches objects and arrays holding the same entries", () => {
		expect(isShallowEqual({ a: 1, b: "x" }, { b: "x", a: 1 })).toBe(true);
		expect(isShallowEqual([1, 2], [1, 2])).toBe(true);
	});

	it("tells apart different entries, key counts and kinds", () => {
		expect(isShallowEqual({ a: 1 }, { a: 2 })).toBe(false);
		expect(isShallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
		expect(isShallowEqual({ a: undefined }, { b: undefined })).toBe(false);
		expect(isShallowEqual({ 0: 1 }, [1])).toBe(false);
		expect(isShallowEqual(null, {})).toBe(false);
	});

	it("compares nested objects by identity", () => {
		const nested = { b: 1 };

		expect(isShallowEqual({ a: nested }, { a: nested })).toBe(true);
		expect(isShallowEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
	});
});
