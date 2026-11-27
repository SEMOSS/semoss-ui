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

	it("prefers the run's files over the project assets", async () => {
		runPixel.mockResolvedValueOnce(searchResult("decks/a.pptx"));

		await expect(
			findPptxTemplateFile("app-1", "run-insight", "decks/a.pptx"),
		).resolves.toMatchObject({ path: "decks/a.pptx", source: "run" });
		expect(runPixel).toHaveBeenCalledTimes(1);
		expect(runPixel).toHaveBeenCalledWith(
			expect.stringContaining("SearchInsightAssets"),
			"run-insight",
		);
	});

	it("falls back to the project assets, then to null", async () => {
		runPixel
			.mockResolvedValueOnce(searchResult("other.pptx"))
			.mockResolvedValueOnce(searchResult("a.pptx"));
		await expect(
			findPptxTemplateFile("app-1", "run-insight", "/a.pptx"),
		).resolves.toMatchObject({ source: "project" });
		expect(runPixel).toHaveBeenLastCalledWith(
			expect.stringContaining("SearchAppAssets"),
			undefined,
		);

		runPixel.mockResolvedValue(searchResult());
		await expect(
			findPptxTemplateFile("app-1", "run-insight", "missing.pptx"),
		).resolves.toBeNull();
	});

	it("uses the project assets when the run's workspace has closed", async () => {
		runPixel
			.mockResolvedValueOnce({ errors: ["Insight not found"] })
			.mockResolvedValueOnce(searchResult("a.pptx"));

		await expect(
			findPptxTemplateFile("app-1", "run-insight", "a.pptx"),
		).resolves.toMatchObject({ source: "project" });
	});

	it("searches only the project assets when no run is open", async () => {
		runPixel.mockResolvedValueOnce(searchResult("a.pptx"));

		await expect(
			findPptxTemplateFile("app-1", undefined, "a.pptx"),
		).resolves.toMatchObject({ source: "project" });
		expect(runPixel).toHaveBeenCalledTimes(1);
	});

	it("does not search for a variable reference", async () => {
		await expect(
			findPptxTemplateFile(
				"app-1",
				"run-insight",
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
		expect(toPptxTemplateFiles(undefined, "run")).toEqual([]);
		expect(toPptxTemplateFiles("error", "run")).toEqual([]);
		expect(toPptxTemplateFiles([null, 3], "run")).toEqual([]);
	});
});
