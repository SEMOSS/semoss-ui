import { describe, expect, it } from "vitest";
import { isoDurationToSeconds, translateFeel } from "./bpmn-feel";

describe("translateFeel", () => {
	it("translates if/then/else", () => {
		expect(
			translateFeel(
				'=if fuelLevel >= 50 then "ALL SYSTEMS GO" else "ABORT"',
			),
		).toEqual({
			python: '("ALL SYSTEMS GO") if (_num(scope["fuelLevel"]) >= 50) else ("ABORT")',
			variables: ["fuelLevel"],
			usesNumberHelper: true,
		});
	});

	it("translates string concatenation and string()", () => {
		const result = translateFeel(
			'="Mission " + missionName + " (" + string(fuelLevel) + "%)"',
		);
		expect(result?.python).toBe(
			'"Mission " + scope["missionName"] + " (" + str(scope["fuelLevel"]) + "%)"',
		);
		expect(result?.variables).toEqual(["missionName", "fuelLevel"]);
	});

	it("translates arithmetic, equality, logic and field paths", () => {
		expect(translateFeel("=fuelLevel - 25")?.python).toBe(
			'_num(scope["fuelLevel"]) - 25',
		);
		expect(translateFeel("=a = 1 and not b.c")?.python).toBe(
			'_num(scope["a"]) == 1 and not scope["b"]["c"]',
		);
		expect(translateFeel("=(x + 1) * 2")?.python).toBe(
			'(_num(scope["x"]) + 1) * 2',
		);
	});

	it("only converts variables used as numbers", () => {
		const text = translateFeel('="Hi " + name + "!"');
		expect(text?.python).toBe('"Hi " + scope["name"] + "!"');
		expect(text?.usesNumberHelper).toBe(false);
		expect(translateFeel('=status = "ok"')?.usesNumberHelper).toBe(false);
		expect(translateFeel("=count + 1")?.python).toBe(
			'_num(scope["count"]) + 1',
		);
	});

	it("handles an if inside an if and inside parentheses", () => {
		expect(
			translateFeel("=if a then (if b then 1 else 2) else 3")?.python,
		).toBe('(((1) if (scope["b"]) else (2))) if (scope["a"]) else (3)');
	});

	it("returns null for FEEL it does not understand", () => {
		expect(translateFeel("=[1,2,3]")).toBeNull();
		expect(translateFeel("=date(x)")).toBeNull();
		expect(translateFeel("=for i in list return i")).toBeNull();
		expect(translateFeel("=")).toBeNull();
	});
});

describe("isoDurationToSeconds", () => {
	it("parses plain durations", () => {
		expect(isoDurationToSeconds("PT10S")).toBe(10);
		expect(isoDurationToSeconds("PT1H30M")).toBe(5400);
		expect(isoDurationToSeconds("P1DT2H")).toBe(93600);
	});

	it("rejects anything that is not a plain duration", () => {
		expect(isoDurationToSeconds("P1M")).toBeUndefined();
		expect(isoDurationToSeconds("P")).toBeUndefined();
		expect(isoDurationToSeconds("PT")).toBeUndefined();
		expect(isoDurationToSeconds("tomorrow")).toBeUndefined();
	});
});
