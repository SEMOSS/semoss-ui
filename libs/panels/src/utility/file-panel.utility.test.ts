import { describe, expect, it } from "vitest";
import {
	getFileDownloadPixel,
	getFileReadPixel,
	getFileSavePixel,
} from "./file-panel.utility";

const PROJECT = { type: "APP", app: "project-1" } as const;
const ENGINE = { type: "ENGINE", engine: "engine-1" } as const;
const INSIGHT = { type: "INSIGHT", insightId: "insight-1" } as const;
const PATH = "/a.py";

describe("file panel pixels", () => {
	// Exact strings, not `toContain`. These builders delegate to the shared
	// explorer adapter rather than hand-writing the reactor per scope, and the
	// whole point is that the emitted Pixel did not change — argument order
	// and quoting included. A substring assertion would not notice.
	it("emits the same read Pixel per scope", () => {
		expect(getFileReadPixel(PROJECT, PATH)).toBe(
			'GetAppAssets(filePath=["/a.py"], project=["project-1"]);',
		);
		expect(getFileReadPixel(ENGINE, PATH)).toBe(
			'GetEngineAssets(filePath=["/a.py"], engine=["engine-1"]);',
		);
		expect(getFileReadPixel(INSIGHT, PATH)).toBe(
			'GetInsightAssets(filePath=["/a.py"]);',
		);
	});

	it("emits the same base64 read Pixel per scope", () => {
		expect(getFileReadPixel(PROJECT, PATH, true)).toBe(
			'GetAppAssetsBase64(filePath=["/a.py"], project=["project-1"]);',
		);
		expect(getFileReadPixel(INSIGHT, PATH, true)).toBe(
			'GetInsightAssetsBase64(filePath=["/a.py"]);',
		);
	});

	it("emits the same save Pixel per scope", () => {
		expect(getFileSavePixel(PROJECT, PATH, "x")).toBe(
			'SaveAppAssets(project=["project-1"], filePath=["/a.py"], content=["<encode>x</encode>"]);',
		);
		expect(getFileSavePixel(ENGINE, PATH, "x")).toBe(
			'SaveEngineAssets(engine=["engine-1"], filePath=["/a.py"], content=["<encode>x</encode>"]);',
		);
		expect(getFileSavePixel(INSIGHT, PATH, "x")).toBe(
			'SaveInsightAssets(filePath=["/a.py"], content=["<encode>x</encode>"]);',
		);
	});

	it("emits the same download Pixel per scope", () => {
		expect(getFileDownloadPixel(PROJECT, PATH)).toBe(
			'DownloadAppAsset(project=["project-1"], filePath=["/a.py"]);',
		);
		expect(getFileDownloadPixel(ENGINE, PATH)).toBe(
			'DownloadEngineAsset(engine=["engine-1"], filePath=["/a.py"]);',
		);
		expect(getFileDownloadPixel(INSIGHT, PATH)).toBe(
			'DownloadInsightAsset(filePath=["/a.py"]);',
		);
	});

	it("escapes a path that would otherwise break the Pixel", () => {
		expect(getFileReadPixel(PROJECT, '/a"b.py')).toBe(
			'GetAppAssets(filePath=["/a\\"b.py"], project=["project-1"]);',
		);
	});
});
