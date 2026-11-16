import { describe, expect, it } from "vitest";
import { isPlainObject, isShallowEqual } from "./object";

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

	it.each([
		{ name: "errors", create: () => new Error("offline") },
		{ name: "dates", create: () => new Date(0) },
		{ name: "maps", create: () => new Map([["a", 1]]) },
		{ name: "sets", create: () => new Set([1]) },
		{ name: "regular expressions", create: () => /value/ },
	])("compares $name by identity", ({ create }) => {
		const value = create();

		expect(isShallowEqual(value, value)).toBe(true);
		expect(isShallowEqual(value, create())).toBe(false);
	});

	it("does not compare class instances as plain records", () => {
		class Value {
			count = 1;
		}

		const value = new Value();
		expect(isShallowEqual(value, value)).toBe(true);
		expect(isShallowEqual(value, new Value())).toBe(false);
		expect(isShallowEqual(value, { count: 1 })).toBe(false);
	});

	it("compares null-prototype records only with the same kind of record", () => {
		const first = Object.assign(Object.create(null), { count: 1 });
		const second = Object.assign(Object.create(null), { count: 1 });

		expect(isShallowEqual(first, second)).toBe(true);
		expect(isShallowEqual(first, { count: 1 })).toBe(false);
	});

	it("distinguishes array lengths and custom array instances", () => {
		class Values extends Array<number> {}

		expect(isShallowEqual([], new Array(1))).toBe(false);
		expect(isShallowEqual(new Values(1, 2), new Values(1, 2))).toBe(false);
	});
});

describe("isPlainObject", () => {
	it("accepts object literals and records with no prototype", () => {
		expect(isPlainObject({})).toBe(true);
		expect(isPlainObject({ a: 1 })).toBe(true);
		expect(isPlainObject(Object.create(null))).toBe(true);
	});

	it("rejects arrays, maps, sets, dates, and class instances", () => {
		class Model {}

		expect(isPlainObject([])).toBe(false);
		expect(isPlainObject(new Map())).toBe(false);
		expect(isPlainObject(new Set())).toBe(false);
		expect(isPlainObject(new Date())).toBe(false);
		expect(isPlainObject(new Model())).toBe(false);
	});

	it("rejects primitives, null, and functions", () => {
		expect(isPlainObject(null)).toBe(false);
		expect(isPlainObject(undefined)).toBe(false);
		expect(isPlainObject(1)).toBe(false);
		expect(isPlainObject("a")).toBe(false);
		expect(isPlainObject(() => 1)).toBe(false);
	});
});
