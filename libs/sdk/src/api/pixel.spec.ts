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

	it("writes the inputs sorted by name, whatever order they were given in", () => {
		expect(buildPixel("Echo", { value: { b: 1, a: 2 } })).toBe(
			'Echo(value={"b":1,"a":2});',
		);
		const pixel = buildPixel(
			"StopPixelExecution" as "Echo",
			{ zeta: 1, alpha: 2 } as unknown as { value: number },
		);
		expect(pixel).toBe("StopPixelExecution(alpha=2, zeta=1);");
	});

	it("leaves required inputs to the type checker and the backend", () => {
		// TypeScript rejects this call; at runtime nothing is looked up, so the
		// backend reports the missing input.
		expect(
			buildPixel("StopPixelExecution", {} as unknown as { id: string }),
		).toBe("StopPixelExecution();");
	});

	it.each([
		["a name with a space", "Stop Pixel", {}],
		["a name that closes the call", "Echo); Delete(", {}],
		["a key that closes the call", "Echo", { "value=1); Delete(x": 1 }],
		["a key starting with a digit", "Echo", { "1value": 1 }],
	])(
		"rejects %s, which would be written unescaped",
		(_name, reactor, input) => {
			expect(() =>
				buildPixel(reactor as "Echo", input as { value?: string }),
			).toThrow(PixelInputError);
		},
	);

	it("rejects an input that is not an object", () => {
		expect(() =>
			buildPixel("Echo", "value" as unknown as { value: string }),
		).toThrow("takes an object of inputs");
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
