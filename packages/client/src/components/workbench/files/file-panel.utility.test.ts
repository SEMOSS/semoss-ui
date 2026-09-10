import { describe, expect, it } from "vitest";
import {
	getFileDownloadPixel,
	getFileMode,
	getFileReadPixel,
	getFileSavePixel,
} from "./file-panel.utility";

const PROJECT = { type: "PROJECT" as const, id: "project-1", path: "/a.py" };
const ENGINE = { type: "ENGINE" as const, id: "engine-1", path: "/a.py" };
const INSIGHT = { type: "INSIGHT" as const, id: "insight-1", path: "/a.py" };

describe("file panel resource routing", () => {
	it("maps workbench resource scopes to shared file modes", () => {
		expect(getFileMode({ type: "PROJECT", id: "project-1" })).toEqual({
			type: "APP",
			app: "project-1",
		});
		expect(getFileMode({ type: "ENGINE", id: "engine-1" })).toEqual({
			type: "ENGINE",
			engine: "engine-1",
		});
		expect(getFileMode({ type: "INSIGHT", id: "insight-1" })).toEqual({
			type: "INSIGHT",
			insightId: "insight-1",
		});
	});

	// Exact strings, not `toContain`. These builders now delegate to the
	// shared explorer adapter instead of hand-writing the reactor per scope,
	// and the whole point is that the emitted Pixel did not change — argument
	// order and quoting included. A substring assertion would not notice.
	it("emits the same read Pixel per scope", () => {
		expect(getFileReadPixel(PROJECT)).toBe(
			'GetAppAssets(filePath=["/a.py"], project=["project-1"]);',
		);
		expect(getFileReadPixel(ENGINE)).toBe(
			'GetEngineAssets(filePath=["/a.py"], engine=["engine-1"]);',
		);
		expect(getFileReadPixel(INSIGHT)).toBe(
			'GetInsightAssets(filePath=["/a.py"]);',
		);
	});

	it("emits the same base64 read Pixel per scope", () => {
		expect(getFileReadPixel(PROJECT, true)).toBe(
			'GetAppAssetsBase64(filePath=["/a.py"], project=["project-1"]);',
		);
		expect(getFileReadPixel(INSIGHT, true)).toBe(
			'GetInsightAssetsBase64(filePath=["/a.py"]);',
		);
	});

	it("emits the same save Pixel per scope", () => {
		expect(getFileSavePixel(PROJECT, "x")).toBe(
			'SaveAppAssets(project=["project-1"], filePath=["/a.py"], content=["<encode>x</encode>"]);',
		);
		expect(getFileSavePixel(ENGINE, "x")).toBe(
			'SaveEngineAssets(engine=["engine-1"], filePath=["/a.py"], content=["<encode>x</encode>"]);',
		);
		expect(getFileSavePixel(INSIGHT, "x")).toBe(
			'SaveInsightAssets(filePath=["/a.py"], content=["<encode>x</encode>"]);',
		);
	});

	it("emits the same download Pixel per scope", () => {
		expect(getFileDownloadPixel(PROJECT)).toBe(
			'DownloadAppAsset(project=["project-1"], filePath=["/a.py"]);',
		);
		expect(getFileDownloadPixel(ENGINE)).toBe(
			'DownloadEngineAsset(engine=["engine-1"], filePath=["/a.py"]);',
		);
		expect(getFileDownloadPixel(INSIGHT)).toBe(
			'DownloadInsightAsset(filePath=["/a.py"]);',
		);
	});

	it("escapes a path that would otherwise break the Pixel", () => {
		expect(getFileReadPixel({ ...PROJECT, path: '/a"b.py' })).toBe(
			'GetAppAssets(filePath=["/a\\"b.py"], project=["project-1"]);',
		);
	});
});
