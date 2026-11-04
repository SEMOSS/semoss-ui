import { describe, expect, it } from "vitest";
import {
	buildPixel,
	PixelError,
	PixelInputError,
	readPixelOutput,
} from "./pixel";

describe("buildPixel", () => {
	it("writes each input as a JSON literal", () => {
		expect(buildPixel("StopPixelExecution", { id: "job-123" })).toBe(
			'StopPixelExecution(id="job-123");',
		);
		expect(buildPixel("GetCurrentInsightId")).toBe(
			"GetCurrentInsightId();",
		);
		expect(
			buildPixel("Echo", { value: { a: [1, 2.5, -3], b: null } }),
		).toBe('Echo(value={"a":[1,2.5,-3],"b":null});');
	});

	it("leaves out optional inputs that are not set", () => {
		expect(buildPixel("Echo")).toBe("Echo();");
		expect(buildPixel("Echo", {})).toBe("Echo();");
	});

	it("escapes quotes, backslashes, newlines and < so text cannot change the call", () => {
		const pixel = buildPixel("StopPixelExecution", {
			id: 'a"); Delete(); ("\\\n<encode>x</encode>',
		});

		expect(pixel).toBe(
			'StopPixelExecution(id="a\\"); Delete(); (\\"\\\\\\n\\u003cencode>x\\u003c/encode>");',
		);
		expect(pixel).not.toContain("<");
	});

	it("keeps unicode text as it is", () => {
		expect(buildPixel("StopPixelExecution", { id: "café ✓" })).toBe(
			'StopPixelExecution(id="café ✓");',
		);
	});

	it("rejects a missing required input", () => {
		expect(() =>
			buildPixel("StopPixelExecution", {} as unknown as { id: string }),
		).toThrow(new PixelInputError('StopPixelExecution needs "id"'));
	});

	it("rejects an input the reactor does not have", () => {
		expect(() =>
			buildPixel("StopPixelExecution", {
				id: "x",
				other: 1,
			} as unknown as { id: string }),
		).toThrow('StopPixelExecution has no input "other"');
	});

	it.each([
		["NaN", Number.NaN, "must be a finite number"],
		["Infinity", Number.POSITIVE_INFINITY, "must be a finite number"],
		["a huge number", 1e21, "too large or too small"],
		["a tiny number", 1e-7, "too large or too small"],
		["a bigint", BigInt(1), "bigint"],
		["a function", () => 1, "function"],
		["a symbol", Symbol("s"), "symbol"],
		["a Date", new Date(0), "plain object"],
		["a Map", new Map(), "plain object"],
		["undefined in an array", [1, undefined], "is undefined"],
	])("rejects %s", (_name, value, message) => {
		expect(() =>
			buildPixel("Echo", { value: value as unknown as string }),
		).toThrow(message);
	});

	it("rejects a value that refers to itself", () => {
		const value: Record<string, unknown> = {};
		value.self = value;
		expect(() =>
			buildPixel("Echo", { value: value as unknown as string }),
		).toThrow("refers to itself");
	});

	it("drops undefined object fields, as JSON does", () => {
		expect(
			buildPixel("Echo", {
				value: { a: 1, b: undefined } as unknown as { a: number },
			}),
		).toBe('Echo(value={"a":1});');
	});
});

describe("readPixelOutput", () => {
	it("returns each statement's output", () => {
		expect(
			readPixelOutput({
				errors: [],
				pixelReturn: [{ output: "a" }, { output: "b" }],
			}),
		).toEqual(["a", "b"]);
	});

	it("throws every error the backend reported", () => {
		const read = () =>
			readPixelOutput({
				errors: ["first", "second"],
				pixelReturn: [{ output: "first" }],
			});

		expect(read).toThrow(PixelError);
		try {
			read();
		} catch (error) {
			expect((error as PixelError).errors).toEqual(["first", "second"]);
		}
	});
});
