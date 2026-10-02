import { afterEach, describe, expect, it, vi } from "vitest";
import { sleep } from "./async";
import { escapeCsvValue } from "./csv";
import { getErrorMessage } from "./error";
import { sanitizeFileNameStem } from "./file";
import {
	isValidIdentifier,
	uniqueName,
	validateIdentifier,
} from "./identifier";
import { locateJsonError } from "./json";
import { deepCopy, isRecord } from "./object";

afterEach(() => vi.useRealTimers());

describe("shared contracts", () => {
	it("preserves error messages and explicit empty fallbacks", () => {
		expect(getErrorMessage(new Error(""), "fallback")).toBe("");
		expect(getErrorMessage("failure")).toBe("failure");
		expect(getErrorMessage(null)).toBe("null");
		expect(getErrorMessage(undefined, "")).toBe("");
		expect(getErrorMessage({ message: "object" }, "fallback")).toBe(
			"fallback",
		);
		expect(
			getErrorMessage(
				{
					toString: () => {
						throw new Error("do not coerce");
					},
				},
				"fallback",
			),
		).toBe("fallback");
	});
	it("escapes CSV cells without changing nullish and empty values", () => {
		expect(escapeCsvValue(null)).toBe("");
		expect(escapeCsvValue(undefined)).toBe("");
		expect(escapeCsvValue("")).toBe('""');
		expect(escapeCsvValue('a,"b"\nc')).toBe('"a,""b""\nc"');
		expect(escapeCsvValue(false)).toBe('"false"');
	});
	it("retains filename spelling and leaves fallback names to callers", () => {
		expect(sanitizeFileNameStem(" My_Key.v1 / demo ")).toBe(
			"My_Key.v1-demo",
		);
		expect(sanitizeFileNameStem("???")).toBe("");
	});
	it("separates raw identifier validation from trimmed form validation", () => {
		expect(isValidIdentifier(" name ")).toBe(false);
		expect(validateIdentifier(" name ", new Set(), "Name")).toBeUndefined();
		expect(validateIdentifier(" name ", new Set(["name"]), "Name")).toBe(
			'Name "name" is already in use',
		);
		expect(isValidIdentifier("9name")).toBe(false);
		expect(uniqueName("name", new Set(["name", "name_2", "name_4"]))).toBe(
			"name_3",
		);
	});
	it("recognizes record-like class instances but excludes arrays and null", () => {
		expect(isRecord(new Date())).toBe(true);
		expect(isRecord(Object.create(null))).toBe(true);
		for (const value of [null, undefined, [], "text", 3])
			expect(isRecord(value)).toBe(false);
	});
	it("copies Dates, nested values, and intercepted values", () => {
		const original = {
			date: new Date("2026-01-01"),
			nested: [{ value: 1 }],
		};
		const copied = deepCopy(original, (value) => (value === 1 ? 2 : value));
		expect(copied.date).toEqual(original.date);
		expect(copied.date).not.toBe(original.date);
		expect(copied.nested).toEqual([{ value: 2 }]);
		expect(original.nested).toEqual([{ value: 1 }]);
	});
	it("locates JSON errors in either message format", () => {
		expect(locateJsonError("error at line 2 column 3", "{}")).toEqual({
			line: 2,
			col: 3,
		});
		expect(locateJsonError("error at position 4", "{\n  x")).toEqual({
			line: 2,
			col: 3,
		});
		expect(locateJsonError("Unexpected token", "{}")).toBeNull();
	});
	it("resolves sleep only after its timer", async () => {
		vi.useFakeTimers();
		const resolved = vi.fn();
		const pending = sleep(20).then(resolved);
		await vi.advanceTimersByTimeAsync(19);
		expect(resolved).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		await pending;
		expect(resolved).toHaveBeenCalledOnce();
	});
});
