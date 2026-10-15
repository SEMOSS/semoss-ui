import { describe, expect, it } from "vitest";
import {
	buildInitials,
	capitalize,
	capitalizeFirstLetter,
	countLines,
	countOccurrences,
	decodeHtmlEntities,
	formatTextByteSize,
	hashString,
	readNonBlankString,
	splitMessageLines,
	stripAnsiStyleCodes,
	toTitleCase,
} from "./text";

describe("text contracts", () => {
	it("preserves UTF-16 hash values and signed overflow", () => {
		expect(hashString("")).toBe(0);
		expect(hashString("Alice")).toBe(63350368);
		expect(hashString("é漢字🙂")).toBe(1086978371);
		expect(hashString("x".repeat(50000))).toBe(1066674176);
	});
	it("validates strings without discarding surrounding whitespace", () => {
		expect(readNonBlankString("  hello  ")).toBe("  hello  ");
		for (const value of ["", " \t\n", null, undefined, 0, {}, []])
			expect(readNonBlankString(value)).toBeUndefined();
	});
	it("keeps the two capitalization contracts distinct", () => {
		expect(capitalize("hELLO")).toBe("Hello");
		expect(capitalizeFirstLetter("hELLO")).toBe("HELLO");
		expect(capitalize("")).toBe("");
		expect(toTitleCase("  hELLO\twORLD! ")).toBe("  Hello\tWorld! ");
		expect(toTitleCase("éCLAIR foo-BAR")).toBe("éClair Foo-bar");
		expect(buildInitials("_Azure Open-AI_", 2)).toBe("AO");
	});
	it("counts literal non-overlapping matches, including an empty needle", () => {
		expect(countOccurrences("aaaaa", "aa")).toBe(2);
		expect(countOccurrences("a.b.a.b", "a.b")).toBe(2);
		expect(countOccurrences("🙂🙂", "🙂")).toBe(2);
		expect(countOccurrences("abc", "")).toBe(0);
		expect(countOccurrences("", "x")).toBe(0);
	});
	it("preserves line and UTF-8 size formatting", () => {
		expect(splitMessageLines(["one\n", "two\n\n"])).toEqual([
			"one",
			"two",
			"",
		]);
		expect(countLines("one\n\n")).toBe(2);
		expect(countLines("\n")).toBe(0);
		expect(formatTextByteSize("🙂")).toBe("4 B");
		expect(formatTextByteSize("x".repeat(1024))).toBe("1.0 KB");
	});
	it("decodes HTML character references in one pass", () => {
		expect(decodeHtmlEntities("R&amp;D&#39;s &quot;team&quot;")).toBe(
			'R&D\'s "team"',
		);
		expect(decodeHtmlEntities("&lt;b&gt; &#x27;x&#X27; &#64;")).toBe(
			"<b> 'x' @",
		);
		expect(decodeHtmlEntities("&AMP; &nbsp;")).toBe("& \u00a0");
		expect(decodeHtmlEntities("&amp;lt;")).toBe("&lt;");
	});
	it("keeps unknown and invalid HTML character references", () => {
		expect(decodeHtmlEntities("&copy; &bogus; & amp;")).toBe(
			"&copy; &bogus; & amp;",
		);
		expect(decodeHtmlEntities("&#0; &#xD800; &#x110000;")).toBe(
			"&#0; &#xD800; &#x110000;",
		);
		expect(decodeHtmlEntities("")).toBe("");
	});
	it("removes only ANSI SGR sequences", () => {
		expect(stripAnsiStyleCodes("\u001b[31mred\u001b[0m\u001b[2J")).toBe(
			"red\u001b[2J",
		);
	});
});
