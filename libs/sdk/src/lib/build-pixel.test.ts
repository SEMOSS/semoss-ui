import { describe, expect, it, vi } from "vitest";
import { buildPixel } from "./build-pixel";
import { rawPixel } from "./raw-pixel";

// Serializer fixtures exercise grammar independently of the selected SDK catalog.
vi.mock("./reactors/inventory", () => ({
	reactorNames: [
		"GetProjectList",
		"FrameType",
		"LLM",
		"SUM",
		"SetInsightConfig",
		"Select",
		"Filter",
		"Join",
		"Import",
		"SUMPRODUCT",
		"AND",
		"OR",
	],
}));

// Exercise the runtime boundary that JavaScript callers and external data reach.
const build = buildPixel as (reactor: string, parameters?: unknown) => string;

describe("Pixel builder", () => {
	it("builds primitive strings with one terminator", () => {
		expect(build("GetProjectList")).toBe("GetProjectList();");
		expect(build("GetProjectList", {})).toBe("GetProjectList();");
		expect(typeof build("FrameType")).toBe("string");
	});

	it("preserves scalar, list, map and empty named values", () => {
		expect(
			build("LLM", {
				engine: "model-1",
				command: "",
				useHistory: false,
				media: [],
				paramValues: { temperature: 0, list: [1, null], map: {} },
				context: null,
				roomId: undefined,
			}),
		).toBe(
			'LLM(engine=["model-1"],command=[""],useHistory=[false],media=[],paramValues=[{"temperature":0,"list":[1,null],"map":{}}],context=[null]);',
		);
	});

	it("keeps positional arguments and nested arrays at the supplied depth", () => {
		expect(build("SUM", [1, 2, 3])).toBe("SUM(1,2,3);");
		expect(
			build("SetInsightConfig", [[[], [1, 2]], null, false, 0, ""]),
		).toBe(
			'SetInsightConfig(Vector(Vector(),Vector(1,2)),null,false,0,"");',
		);
	});

	it("uses raw values only when explicitly marked, preserving expression context", () => {
		expect(
			build("Select", [rawPixel("department"), rawPixel("Sum(cost)")]),
		).toBe("Select(department,Sum(cost));");
		expect(build("Filter", [rawPixel('status == "active"')])).toBe(
			'Filter(status == "active");',
		);
		expect(build("Join", [rawPixel("(a, inner.join, b)")])).toBe(
			"Join((a, inner.join, b));",
		);
		expect(
			build("Import", {
				frame: rawPixel('CreateFrame(frameType=["GRID"])'),
			}),
		).toBe('Import(frame=[CreateFrame(frameType=["GRID"])]);');
		expect(
			build("SetInsightConfig", [
				{ literal: "Sum(cost)", expr: rawPixel("Sum(cost)") },
			]),
		).toBe('SetInsightConfig({"literal":"Sum(cost)","expr":Sum(cost)});');
	});

	it("preserves quotes, trailing backslashes, control characters, Unicode and encode tags", () => {
		const text =
			'She said "hi". \\ \n\r\t\b\f\u0000 😀 <encode>x</encode> <sEncode> <e>';
		const literal = build("SetInsightConfig", [text]).slice(
			"SetInsightConfig(".length,
			-2,
		);
		expect(JSON.parse(literal)).toBe(text);
		expect(literal).toContain("\\u0022hi\\u0022");
		expect(literal).toContain("\\u005c");
		expect(literal).not.toContain("<");
		expect(build("SetInsightConfig", ["ends\\", "next"])).toBe(
			'SetInsightConfig("ends\\u005c","next");',
		);
		const map = { '<encode>"\\': "unchanged", missing: undefined };
		const mapLiteral = build("SetInsightConfig", [map]).slice(
			"SetInsightConfig(".length,
			-2,
		);
		expect(JSON.parse(mapLiteral)).toEqual({ '<encode>"\\': "unchanged" });
	});

	it.each([
		[0, "0"],
		[-0, "-0.0"],
		[-1, "-1"],
		[1e-7, "0.0000001"],
		[-1e-7, "-0.0000001"],
		[1.25e21, "1250000000000000000000.0"],
		[2147483647, "2147483647"],
		[2147483648, "2147483648.0"],
		[4294967295, "4294967295.0"],
		[-2147483648, "-2147483648"],
		[-2147483649, "-2147483649.0"],
		[-3e9, "-3000000000.0"],
		[-1e21, "-1000000000000000000000.0"],
	])("serializes %s as a backend-compatible number", (value, expected) => {
		expect(build("SUM", [value])).toBe(`SUM(${expected});`);
		expect(build("SetInsightConfig", [{ value }])).toBe(
			`SetInsightConfig({"value":${expected}});`,
		);
	});

	it.each([Number.MIN_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE])(
		"expands extreme finite numbers without losing their JavaScript value: %s",
		(value) => {
			const literal = build("SUM", [value]).slice(4, -2);
			expect(literal).not.toMatch(/[eE]/);
			expect(Number(literal)).toBe(value);
		},
	);

	it("supports repeated references while rejecting cycles", () => {
		const shared = { value: 1 };
		expect(build("SetInsightConfig", [[shared, shared]])).toBe(
			'SetInsightConfig(Vector({"value":1},{"value":1}));',
		);
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(() => build("SetInsightConfig", [cyclic])).toThrow(/cycles/);
		const array: unknown[] = [];
		array.push(array);
		expect(() => build("SUM", array)).toThrow(/cycles/);
	});

	it("accepts plain maps without a prototype", () => {
		const map = Object.create(null) as Record<string, unknown>;
		map.value = "data";
		expect(build("SetInsightConfig", [map])).toBe(
			'SetInsightConfig({"value":"data"});',
		);
	});

	it.each([
		undefined,
		NaN,
		Infinity,
		-Infinity,
		1n,
		Symbol("value"),
		() => 1,
		new Date(),
		new Map(),
		/pattern/,
	])("rejects unsupported literal values: %s", (value) => {
		expect(() => build("SetInsightConfig", [value])).toThrow(TypeError);
	});

	it("preserves vectors while keeping noun lists and map arrays distinct", () => {
		expect(
			build("SUMPRODUCT", [
				[1, 2],
				[3, 4],
			]),
		).toBe("SUMPRODUCT(Vector(1,2),Vector(3,4));");
		expect(build("SetInsightConfig", [[], [1], [[1], []]])).toBe(
			"SetInsightConfig(Vector(),Vector(1),Vector(Vector(1),Vector()));",
		);
		expect(
			build("LLM", {
				media: ["a", "b"],
				paramValues: { arrays: [[1], []] },
			}),
		).toBe('LLM(media=["a","b"],paramValues=[{"arrays":[[1],[]]}]);');
		expect(build("LLM", { media: [["a"], []] })).toBe(
			'LLM(media=[Vector("a"),Vector()]);',
		);
	});

	it("rejects sparse arrays and symbol keys", () => {
		expect(() => build("SUM", Array(2))).toThrow(/empty slots/);
		expect(() =>
			build("SetInsightConfig", [{ [Symbol("key")]: 1 }]),
		).toThrow(/symbol keys/);
		expect(() => build("LLM", { [Symbol("key")]: 1 })).toThrow(
			/symbol keys/,
		);
	});

	it("rejects unknown names and non-identifier parameter keys", () => {
		expect(() => build("MadeUpReactor")).toThrow(/Unknown built-in/);
		expect(() => build("GetProjectList();DeleteAll(")).toThrow(
			/Unknown built-in/,
		);
		for (const key of [
			"command);Other(",
			"some-key",
			"null",
			"true",
			"AND",
			"123",
		]) {
			expect(() => build("LLM", { [key]: "value" })).toThrow(
				/identifier/,
			);
		}
		for (const value of [null, 1, "text", new Date()]) {
			expect(() => build("LLM", value)).toThrow(/parameters must/);
		}
	});

	it("emits non-reserved spellings for case-insensitive boolean expression aliases", () => {
		expect(build("AND", [true, false])).toBe("And(true,false);");
		expect(build("OR", [true, false])).toBe("Or(true,false);");
	});
});

describe("rawPixel", () => {
	it("creates an immutable marker and preserves the expression unchanged", () => {
		const expression = rawPixel("  Sum(cost)  ");
		expect(Object.isFrozen(expression)).toBe(true);
		expect(typeof expression).toBe("object");
		expect(build("Select", [expression])).toBe("Select(  Sum(cost)  );");
	});

	it("rejects empty expressions and leaves full syntax validation to the backend", () => {
		expect(() => rawPixel("")).toThrow(TypeError);
		expect(() => rawPixel(" \n\t")).toThrow(TypeError);
		expect(build("Select", [rawPixel('"literal;semicolon"')])).toBe(
			'Select("literal;semicolon");',
		);
	});
});
