import { describe, expect, it } from "vitest";
import {
	formatJson,
	isOutputJSON,
	parseJsonStringArray,
	parseStructuredOutput,
	tryParseJson,
} from "./json";

describe("strict JSON parsing", () => {
	it("preserves scalar values instead of treating them as parse failures", () => {
		expect(tryParseJson("null")).toBeNull();
		expect(tryParseJson("false")).toBe(false);
		expect(tryParseJson("0")).toBe(0);
		expect(tryParseJson('""')).toBe("");
		expect(tryParseJson(' {"items": [1, "🙂", null]} ')).toEqual({
			items: [1, "🙂", null],
		});
	});
	it("returns undefined for malformed JSON without applying tolerant rewrites", () => {
		for (const value of [
			"",
			" \t",
			"undefined",
			"{'a': 1}",
			"[1,]",
			"[True]",
			"\u00a0{}\u00a0",
		]) {
			expect(tryParseJson(value)).toBeUndefined();
		}
	});
	it("accepts only string arrays and preserves order, whitespace, and duplicates", () => {
		expect(parseJsonStringArray('[" a ", "", "🙂", " a "]')).toEqual([
			" a ",
			"",
			"🙂",
			" a ",
		]);
		expect(parseJsonStringArray("[]")).toEqual([]);
		for (const value of [
			"",
			" ",
			"null",
			'"text"',
			"{}",
			'["a", 1]',
			'["a", null]',
			'["a", []]',
			"['a']",
		]) {
			expect(parseJsonStringArray(value)).toBeNull();
		}
	});
});

describe("JSON formatting", () => {
	it("formats objects, arrays, and scalars with two-space indentation", () => {
		expect(formatJson('{"items":[1,false]}')).toBe(
			'{\n  "items": [\n    1,\n    false\n  ]\n}',
		);
		expect(formatJson(' ["🙂"] ')).toBe('[\n  "🙂"\n]');
		for (const value of ["null", "false", "0", '""']) {
			expect(formatJson(` ${value} `)).toBe(value);
		}
	});
	it("preserves partial JSON and plain text exactly, including surrounding whitespace", () => {
		for (const value of [
			"",
			" \t ",
			'  {"a": ',
			"{'a': 1}",
			"  plain text\n",
		]) {
			expect(formatJson(value)).toBe(value);
		}
	});
	it("lets callers trim before parsing without changing the failure fallback", () => {
		const valid = '\u00a0{"a":1}\u00a0';
		expect(formatJson(valid.trim(), valid)).toBe('{\n  "a": 1\n}');
		const invalid = "  {broken}  ";
		expect(formatJson(invalid.trim(), invalid)).toBe(invalid);
		expect(formatJson("invalid", "")).toBe("");
	});
	it("preserves the raw input if a deeply nested value cannot be serialized", () => {
		const value = `${"[".repeat(20000)}0${"]".repeat(20000)}`;
		expect(formatJson(value)).toBe(value);
	});
});

describe("existing tolerant JSON contracts", () => {
	it("keeps object passthrough and legacy single-quote parsing", () => {
		const object = { value: 1 };
		expect(isOutputJSON(object)).toBe(object);
		expect(isOutputJSON("{'value': 1}")).toEqual(object);
		expect(isOutputJSON("false")).toBe(false);
		expect(isOutputJSON("0")).toBe(0);
		expect(isOutputJSON('""')).toBe("");
		expect(isOutputJSON("[True]")).toBeNull();
		expect(isOutputJSON("broken")).toBeNull();
	});
	it("retains structured-output gating and its separate Python-style normalization", () => {
		expect(
			parseStructuredOutput(" {'values': [True, False, None]} "),
		).toEqual({
			values: [true, false, null],
		});
		expect(parseStructuredOutput('["don\'t", false]')).toEqual([
			"don't",
			false,
		]);
		for (const value of ['"text"', "false", "0", "null", "{broken}"]) {
			expect(parseStructuredOutput(value)).toBeNull();
		}
	});
});
