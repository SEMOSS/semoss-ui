import { describe, expect, it } from "vitest";
import {
	foldedRange,
	isLongText,
	linkLabel,
	messageSegments,
	textParts,
} from "./message-text";

describe("messageSegments", () => {
	it("keeps text without history whole", () => {
		const text = "Hi\nForwarded from Priya Raman:\nnot a forward";
		expect(messageSegments(text)).toEqual([{ text }]);
	});

	it("splits a forward under its label", () => {
		expect(
			messageSegments(
				"Can you take this?\n\nForwarded from Priya Raman, Monday, August 25, 2026 3:02 PM:\nThe vendor needs sign-off by Friday.",
				true,
			),
		).toEqual([
			{ text: "Can you take this?" },
			{
				label: "Forwarded from Priya Raman, Monday, August 25, 2026 3:02 PM:",
				text: "The vendor needs sign-off by Friday.",
			},
		]);
	});

	it("drops an empty note above a bare forward and splits nested history", () => {
		const segments = messageSegments(
			"Forwarded from A:\nfirst\nOn Mon, Aug 25, 2026 at 3:02 PM Bo Li wrote:\nsecond",
			true,
		);
		expect(segments.map((segment) => segment.label)).toEqual([
			"Forwarded from A:",
			"On Mon, Aug 25, 2026 at 3:02 PM Bo Li wrote:",
		]);
		expect(segments[1].text).toBe("second");
	});
});

describe("textParts", () => {
	it("cuts out links and leaves trailing punctuation as text", () => {
		expect(textParts("See https://example.com/a?b=1. Thanks")).toEqual([
			{ kind: "text", text: "See " },
			{ kind: "link", href: "https://example.com/a?b=1" },
			{ kind: "text", text: ". Thanks" },
		]);
	});

	it("never turns other schemes into links", () => {
		expect(textParts("javascript:alert(1) mailto:a@b.c")).toEqual([
			{ kind: "text", text: "javascript:alert(1) mailto:a@b.c" },
		]);
	});
});

describe("linkLabel", () => {
	it("shows host and path, cut short", () => {
		expect(linkLabel("https://example.com/")).toBe("example.com");
		expect(linkLabel("https://example.com/a/b?c=1")).toBe(
			"example.com/a/b",
		);
		expect(
			linkLabel(
				`https://contoso.sharepoint.example/sites/${"x".repeat(60)}`,
			),
		).toHaveLength(48);
	});
});

describe("folding", () => {
	it("clamps long text", () => {
		expect(isLongText("short")).toBe(false);
		expect(isLongText("x".repeat(1300))).toBe(true);
		expect(isLongText(Array(20).fill("line").join("\n"))).toBe(true);
	});

	it("folds only threads longer than the first and newest few", () => {
		expect(foldedRange(5)).toBeNull();
		expect(foldedRange(6)).toEqual({ head: 1, tail: 3 });
	});
});
