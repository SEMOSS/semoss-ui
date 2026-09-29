import { describe, expect, test } from "vitest";
import {
	countOccurrences,
	decodeTextFile,
	FolderToolError,
	isBinaryFileName,
	replaceFileText,
	sliceTextLines,
} from "./folder-text";

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe("decodeTextFile", () => {
	test("decodes UTF-8 text", () => {
		expect(decodeTextFile(encode("hello, world"))).toBe("hello, world");
		expect(decodeTextFile(encode("caf\u00e9"))).toBe("caf\u00e9");
	});

	test("treats NUL bytes as binary", () => {
		expect(decodeTextFile(new Uint8Array([72, 0, 105]))).toBeNull();
	});

	test("treats invalid UTF-8 as binary, unless the bytes are a partial read", () => {
		const invalid = new Uint8Array([0x68, 0xc3]);
		expect(decodeTextFile(invalid)).toBeNull();
		expect(decodeTextFile(invalid, true)).toMatch(/^h/);
	});
});

describe("isBinaryFileName", () => {
	test("recognizes documents, images, and archives", () => {
		expect(isBinaryFileName("report.PDF")).toBe(true);
		expect(isBinaryFileName("deck.pptx")).toBe(true);
		expect(isBinaryFileName("photo.jpeg")).toBe(true);
		expect(isBinaryFileName("notes.md")).toBe(false);
		expect(isBinaryFileName("Makefile")).toBe(false);
	});
});

describe("sliceTextLines", () => {
	const text = "one\ntwo\nthree\nfour\n";

	test("returns the whole file when it fits", () => {
		const slice = sliceTextLines(text, 1, 100, 1000);
		expect(slice).toEqual({
			content: text,
			totalLines: 4,
			startLine: 1,
			endLine: 4,
			truncated: false,
		});
	});

	test("pages by offset and limit", () => {
		const slice = sliceTextLines(text, 2, 2, 1000);
		expect(slice.content).toBe("two\nthree\n");
		expect(slice.startLine).toBe(2);
		expect(slice.endLine).toBe(3);
		expect(slice.truncated).toBe(true);
	});

	test("stops at the character budget", () => {
		const slice = sliceTextLines(text, 1, 100, 9);
		expect(slice.content).toBe("one\ntwo\n");
		expect(slice.truncated).toBe(true);
	});

	test("cuts a single line longer than the budget", () => {
		const slice = sliceTextLines("abcdefghij", 1, 100, 4);
		expect(slice.content).toBe("abcd");
		expect(slice.truncated).toBe(true);
	});

	test("handles an empty file", () => {
		expect(sliceTextLines("", 1, 100, 100).totalLines).toBe(0);
	});

	test("refuses an offset past the end", () => {
		expect(() => sliceTextLines(text, 9, 10, 1000)).toThrow(
			FolderToolError,
		);
	});
});

describe("replaceFileText", () => {
	test("replaces a unique match", () => {
		expect(replaceFileText("a b c", "b", "B", false)).toEqual({
			content: "a B c",
			replacements: 1,
		});
	});

	test("refuses an ambiguous match unless replacing all", () => {
		expect(() => replaceFileText("x x", "x", "y", false)).toThrow(
			/appears 2 times/,
		);
		expect(replaceFileText("x x", "x", "y", true)).toEqual({
			content: "y y",
			replacements: 2,
		});
	});

	test("refuses missing, empty, or no-op edits", () => {
		expect(() => replaceFileText("abc", "z", "y", false)).toThrow(
			/not found/,
		);
		expect(() => replaceFileText("abc", "", "y", false)).toThrow(
			FolderToolError,
		);
		expect(() => replaceFileText("abc", "a", "a", false)).toThrow(
			FolderToolError,
		);
	});

	test("counts without overlaps", () => {
		expect(countOccurrences("aaaa", "aa")).toBe(2);
	});
});
