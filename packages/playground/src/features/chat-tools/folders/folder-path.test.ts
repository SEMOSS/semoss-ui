import { describe, expect, test } from "vitest";
import {
	createNameMatcher,
	FolderPathError,
	getFolderPathName,
	getParentFolderPath,
	isWithinFolderPath,
	joinFolderPath,
	normalizeFolderPath,
} from "./folder-path";

describe("normalizeFolderPath", () => {
	test("treats missing paths as the root", () => {
		expect(normalizeFolderPath(undefined)).toBe("");
		expect(normalizeFolderPath(null)).toBe("");
		expect(normalizeFolderPath("")).toBe("");
		expect(normalizeFolderPath("/")).toBe("");
		expect(normalizeFolderPath(".")).toBe("");
	});

	test("drops leading, trailing, repeated separators and dot segments", () => {
		expect(normalizeFolderPath("/reports/./q3/")).toBe("reports/q3");
		expect(normalizeFolderPath("reports//q3")).toBe("reports/q3");
		expect(normalizeFolderPath("  reports/q3.md  ")).toBe("reports/q3.md");
	});

	test("accepts backslash separators", () => {
		expect(normalizeFolderPath("reports\\q3\\notes.md")).toBe(
			"reports/q3/notes.md",
		);
	});

	test("refuses to climb out of the folder", () => {
		expect(() => normalizeFolderPath("../secrets")).toThrow(
			FolderPathError,
		);
		expect(() => normalizeFolderPath("reports/../../etc")).toThrow(
			FolderPathError,
		);
		expect(() => normalizeFolderPath("a/..")).toThrow(FolderPathError);
	});

	test("refuses control characters and non strings", () => {
		expect(() => normalizeFolderPath("bad\u0000name")).toThrow(
			FolderPathError,
		);
		expect(() => normalizeFolderPath("line\nbreak")).toThrow(
			FolderPathError,
		);
		expect(() => normalizeFolderPath(42)).toThrow(FolderPathError);
	});

	test("keeps names that merely contain dots", () => {
		expect(normalizeFolderPath("..hidden/file..txt")).toBe(
			"..hidden/file..txt",
		);
	});
});

describe("path helpers", () => {
	test("join skips the root", () => {
		expect(joinFolderPath("", "a")).toBe("a");
		expect(joinFolderPath("a", "b/c")).toBe("a/b/c");
		expect(joinFolderPath("", "")).toBe("");
	});

	test("parent and name", () => {
		expect(getParentFolderPath("a/b/c.md")).toBe("a/b");
		expect(getParentFolderPath("c.md")).toBe("");
		expect(getParentFolderPath("")).toBe("");
		expect(getFolderPathName("a/b/c.md")).toBe("c.md");
		expect(getFolderPathName("")).toBe("");
	});

	test("containment matches whole segments", () => {
		expect(isWithinFolderPath("a/b", "a")).toBe(true);
		expect(isWithinFolderPath("a", "a")).toBe(true);
		expect(isWithinFolderPath("ab/c", "a")).toBe(false);
		expect(isWithinFolderPath("anything", "")).toBe(true);
	});
});

describe("createNameMatcher", () => {
	test("matches substrings without regard to case", () => {
		const matches = createNameMatcher("budget");
		expect(matches("2026 Budget.xlsx")).toBe(true);
		expect(matches("notes.md")).toBe(false);
	});

	test("treats * and ? as a whole-name glob", () => {
		const matches = createNameMatcher("*.md");
		expect(matches("README.md")).toBe(true);
		expect(matches("notes.mdx")).toBe(false);
		expect(createNameMatcher("q?.csv")("q3.csv")).toBe(true);
	});

	test("does not treat regex characters as special", () => {
		const matches = createNameMatcher("a+b(1).txt");
		expect(matches("a+b(1).txt")).toBe(true);
		expect(createNameMatcher("*(1).txt")("report (1).txt")).toBe(true);
		expect(createNameMatcher("*.txt")("reportXtxt")).toBe(false);
	});

	test("an empty query matches everything", () => {
		expect(createNameMatcher("  ")("anything")).toBe(true);
	});
});
