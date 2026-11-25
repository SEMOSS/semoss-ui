import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	findPptxTemplateFile,
	toPptxTemplateFiles,
} from "./use-pptx-template-files";

const runPixel = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk/react", () => ({ runPixel, usePixel: vi.fn() }));

const searchResult = (...paths: string[]) => ({
	errors: [],
	pixelReturn: [
		{ output: paths.map((path) => ({ name: path, path: `/${path}` })) },
	],
});

describe("findPptxTemplateFile", () => {
	beforeEach(() => runPixel.mockReset());

	it("prefers the insight folder over the project assets", async () => {
		runPixel.mockResolvedValueOnce(searchResult("decks/a.pptx"));

		await expect(
			findPptxTemplateFile("app-1", "insight-1", "decks/a.pptx"),
		).resolves.toMatchObject({ path: "decks/a.pptx", source: "insight" });
		expect(runPixel).toHaveBeenCalledTimes(1);
		expect(runPixel).toHaveBeenCalledWith(
			expect.stringContaining("SearchInsightAssets"),
			"insight-1",
		);
	});

	it("falls back to the project assets, then to null", async () => {
		runPixel
			.mockResolvedValueOnce(searchResult("other.pptx"))
			.mockResolvedValueOnce(searchResult("a.pptx"));
		await expect(
			findPptxTemplateFile("app-1", "insight-1", "/a.pptx"),
		).resolves.toMatchObject({ source: "project" });

		runPixel.mockResolvedValue(searchResult());
		await expect(
			findPptxTemplateFile("app-1", "insight-1", "missing.pptx"),
		).resolves.toBeNull();
	});

	it("does not search for a variable reference", async () => {
		await expect(
			findPptxTemplateFile(
				"app-1",
				"insight-1",
				["$", "{deck}"].join(""),
			),
		).resolves.toBeNull();
		expect(runPixel).not.toHaveBeenCalled();
	});
});

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
