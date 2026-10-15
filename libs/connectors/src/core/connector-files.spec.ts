import { describe, expect, it } from "vitest";
import { toSafeFileName, toUniqueFileName } from "./connector-files";

describe("toSafeFileName", () => {
	it("keeps an ordinary name", () => {
		expect(toSafeFileName("Q3 Report.xlsx", "x")).toBe("Q3 Report.xlsx");
	});

	it("replaces separators, reserved and control characters", () => {
		expect(toSafeFileName('Re: a/b\\c*?"<>|\u0007.md', "x")).toBe(
			"Re a b c .md",
		);
	});

	it("drops leading dots so the file is not hidden", () => {
		expect(toSafeFileName("..env", "x")).toBe("env");
	});

	it("falls back when nothing usable is left", () => {
		expect(toSafeFileName(" / ", "note.md")).toBe("note.md");
	});

	it("shortens a long name but keeps its extension", () => {
		const name = toSafeFileName(`${"a".repeat(200)}.pdf`, "x");
		expect(name.length).toBeLessThanOrEqual(120);
		expect(name.endsWith(".pdf")).toBe(true);
	});
});

describe("toUniqueFileName", () => {
	it("keeps a free name", () => {
		expect(toUniqueFileName("q3.xlsx", ["notes.md"])).toBe("q3.xlsx");
	});

	it("numbers a taken name, ignoring case", () => {
		expect(toUniqueFileName("Q3.xlsx", ["q3.xlsx", "Q3 (2).xlsx"])).toBe(
			"Q3 (3).xlsx",
		);
	});

	it("numbers a name without an extension", () => {
		expect(toUniqueFileName("README", ["README"])).toBe("README (2)");
	});
});
