import { describe, expect, it } from "vitest";
import { toPptxTemplateFiles } from "./use-pptx-template-files";

describe("toPptxTemplateFiles", () => {
	it("keeps only .pptx files and makes their paths relative", () => {
		const output = [
			{ name: "decks", path: "/decks", type: "directory" },
			{ name: "Q1.PPTX", path: "/decks/Q1.PPTX" },
			{ name: "a.pptx", path: "a.pptx" },
			{ name: "notes.txt", path: "/notes.txt" },
		];

		expect(toPptxTemplateFiles(output, "project")).toEqual([
			{ name: "a.pptx", path: "a.pptx", source: "project" },
			{ name: "Q1.PPTX", path: "decks/Q1.PPTX", source: "project" },
		]);
	});

	it("returns nothing for output that is not a list of entries", () => {
		expect(toPptxTemplateFiles(undefined, "insight")).toEqual([]);
		expect(toPptxTemplateFiles("error", "insight")).toEqual([]);
		expect(toPptxTemplateFiles([null, 3], "insight")).toEqual([]);
	});
});
