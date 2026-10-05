import { describe, expect, it } from "vitest";
import { type FileMode, getFileExplorerAdapter } from "@semoss/shared";

/**
 * Every Pixel the asset adapters build, pinned per mode.
 *
 * The reactor names used to be assembled from a family word
 * (`` `Browse${family.name}Assets` ``), so not one of them appeared in the
 * source and none could be grepped. Spelling them out is what this file
 * protects: the names are inconsistent in ways that are invisible until they
 * are written down — `Rename*Asset` and `Download*Asset` are singular while
 * `Browse*Assets` and `Delete*Assets` are plural, `Unzip*AssetFile` takes no
 * trailing semicolon, `copy` quotes its arguments bare while everything else
 * brackets them, and only `read`/`save`/`download` run the path through
 * `JSON.stringify`. A "tidy-up" of any one of those silently breaks a reactor
 * call, with no type error and no test failure anywhere else.
 *
 * It lives in `libs/panels` rather than next to the adapter because
 * `libs/shared` is source-only — no vite config, no test script, no runner —
 * and `libs/panels` both has vitest and is the adapter's main consumer through
 * `file-panel.utility.ts`.
 */

const APP: FileMode = { type: "APP", app: "p1" };
const ENGINE: FileMode = { type: "ENGINE", engine: "e1" };
const INSIGHT: FileMode = { type: "INSIGHT" };
const USER: FileMode = { type: "USER" };

/** Every builder's output for one mode. */
interface AdapterPixels {
	browse: string;
	search: string;
	rename: string;
	copy: string;
	remove: string;
	read: string;
	readBase64: string;
	save: string;
	saveBase64: string;
	download: string;
	createFile: string;
	createDirectory: string;
	unzip: string;
}

const pixelsFor = (mode: FileMode): AdapterPixels => {
	const adapter = getFileExplorerAdapter(mode);
	return {
		browse: adapter.browse("/dir"),
		search: adapter.search("/dir", "term"),
		rename: adapter.rename("/a.txt", "/b.txt"),
		copy: adapter.copy("/a.txt", "/b.txt"),
		remove: adapter.remove("/a.txt"),
		read: adapter.read("/a.txt"),
		readBase64: adapter.read("/a.txt", true),
		save: adapter.save("/a.txt", "body"),
		saveBase64: adapter.save("/a.txt", "Ym9keQ==", true),
		download: adapter.download("/a.txt"),
		createFile: adapter.createFile("/a.txt"),
		createDirectory: adapter.createDirectory("/dir"),
		unzip: adapter.unzip("/a.zip"),
	};
};

describe("getFileExplorerAdapter — APP", () => {
	it("builds every App reactor with the project scope", () => {
		expect(pixelsFor(APP)).toEqual({
			browse: 'BrowseAppAssets(filePath=["/dir"], project=["p1"]);',
			search: 'SearchAppAssets(filePath=["/dir"], project=["p1"], search=["term"]);',
			rename: 'RenameAppAsset(project=["p1"], filePath=["/a.txt"], newValue=["/b.txt"]);',
			copy: 'CopyAppAsset(project="p1", filePath="/a.txt", newValue="/b.txt");',
			remove: 'DeleteAppAssets(project=["p1"], filePath=["/a.txt"]);',
			read: 'GetAppAssets(filePath=["/a.txt"], project=["p1"]);',
			readBase64:
				'GetAppAssetsBase64(filePath=["/a.txt"], project=["p1"]);',
			save: 'SaveAppAssets(project=["p1"], filePath=["/a.txt"], content=["<encode>body</encode>"]);',
			saveBase64:
				'SaveAppAssetsBase64(project=["p1"], filePath=["/a.txt"], content=["<encode>Ym9keQ==</encode>"]);',
			download: 'DownloadAppAsset(project=["p1"], filePath=["/a.txt"]);',
			createFile:
				'NewAppAssetsFile(project=["p1"], filePath=["/a.txt"]);',
			createDirectory:
				'NewAppAssetsDirectory(project=["p1"], filePath=["/dir"]);',
			unzip: 'UnzipAppAssetFile(project=["p1"], filePath=["/a.zip"])',
		});
	});
});

describe("getFileExplorerAdapter — ENGINE", () => {
	it("builds every Engine reactor with the engine scope", () => {
		expect(pixelsFor(ENGINE)).toEqual({
			browse: 'BrowseEngineAssets(filePath=["/dir"], engine=["e1"]);',
			search: 'SearchEngineAssets(filePath=["/dir"], engine=["e1"], search=["term"]);',
			rename: 'RenameEngineAsset(engine=["e1"], filePath=["/a.txt"], newValue=["/b.txt"]);',
			copy: 'CopyEngineAsset(engine="e1", filePath="/a.txt", newValue="/b.txt");',
			remove: 'DeleteEngineAssets(engine=["e1"], filePath=["/a.txt"]);',
			read: 'GetEngineAssets(filePath=["/a.txt"], engine=["e1"]);',
			readBase64:
				'GetEngineAssetsBase64(filePath=["/a.txt"], engine=["e1"]);',
			save: 'SaveEngineAssets(engine=["e1"], filePath=["/a.txt"], content=["<encode>body</encode>"]);',
			saveBase64:
				'SaveEngineAssetsBase64(engine=["e1"], filePath=["/a.txt"], content=["<encode>Ym9keQ==</encode>"]);',
			download:
				'DownloadEngineAsset(engine=["e1"], filePath=["/a.txt"]);',
			createFile:
				'NewEngineAssetsFile(engine=["e1"], filePath=["/a.txt"]);',
			createDirectory:
				'NewEngineAssetsDirectory(engine=["e1"], filePath=["/dir"]);',
			unzip: 'UnzipEngineAssetFile(engine=["e1"], filePath=["/a.zip"])',
		});
	});
});

describe("getFileExplorerAdapter — INSIGHT", () => {
	it("builds every Insight reactor, which carries no scope argument", () => {
		expect(pixelsFor(INSIGHT)).toEqual({
			browse: 'BrowseInsightAssets(filePath=["/dir"]);',
			search: 'SearchInsightAssets(filePath=["/dir"], search=["term"]);',
			rename: 'RenameInsightAsset(filePath=["/a.txt"], newValue=["/b.txt"]);',
			copy: 'CopyInsightAsset(filePath="/a.txt", newValue="/b.txt");',
			remove: 'DeleteInsightAssets(filePath=["/a.txt"]);',
			read: 'GetInsightAssets(filePath=["/a.txt"]);',
			readBase64: 'GetInsightAssetsBase64(filePath=["/a.txt"]);',
			save: 'SaveInsightAssets(filePath=["/a.txt"], content=["<encode>body</encode>"]);',
			saveBase64:
				'SaveInsightAssetsBase64(filePath=["/a.txt"], content=["<encode>Ym9keQ==</encode>"]);',
			download: 'DownloadInsightAsset(filePath=["/a.txt"]);',
			createFile: 'NewInsightAssetsFile(filePath=["/a.txt"]);',
			createDirectory: 'NewInsightAssetsDirectory(filePath=["/dir"]);',
			unzip: 'UnzipInsightAssetFile(filePath=["/a.zip"])',
		});
	});
});

describe("getFileExplorerAdapter — USER", () => {
	it("builds every User reactor, which carries no scope argument", () => {
		expect(pixelsFor(USER)).toEqual({
			browse: 'BrowseUserAssets(filePath=["/dir"]);',
			search: 'SearchUserAssets(filePath=["/dir"], search=["term"]);',
			rename: 'RenameUserAsset(filePath=["/a.txt"], newValue=["/b.txt"]);',
			copy: 'CopyUserAsset(filePath="/a.txt", newValue="/b.txt");',
			remove: 'DeleteUserAssets(filePath=["/a.txt"]);',
			read: 'GetUserAssets(filePath=["/a.txt"]);',
			readBase64: 'GetUserAssetsBase64(filePath=["/a.txt"]);',
			save: 'SaveUserAssets(filePath=["/a.txt"], content=["<encode>body</encode>"]);',
			saveBase64:
				'SaveUserAssetsBase64(filePath=["/a.txt"], content=["<encode>Ym9keQ==</encode>"]);',
			download: 'DownloadUserAsset(filePath=["/a.txt"]);',
			createFile: 'NewUserAssetsFile(filePath=["/a.txt"]);',
			createDirectory: 'NewUserAssetsDirectory(filePath=["/dir"]);',
			unzip: 'UnzipUserAssetFile(filePath=["/a.zip"])',
		});
	});
});

describe("path quoting", () => {
	// read/save/download stringify the path; the rest interpolate it raw. That
	// difference is a known quoting bug for paths containing a quote or a
	// backslash — pinned here so the inconsistency is visible, and so whoever
	// fixes it sees exactly which builders change.
	it("stringifies the path for read, save and download only", () => {
		const adapter = getFileExplorerAdapter(USER);

		expect(adapter.read('/a".txt')).toBe(
			'GetUserAssets(filePath=["/a\\".txt"]);',
		);
		expect(adapter.browse('/a".txt')).toBe(
			'BrowseUserAssets(filePath=["/a".txt"]);',
		);
	});
});

describe("storage", () => {
	it("throws for the operations a bucket has no reactor for", () => {
		const adapter = getFileExplorerAdapter({
			type: "STORAGE",
			storage: "s1",
		});

		expect(() => adapter.read("/a.txt")).toThrow();
		expect(() => adapter.save("/a.txt", "body")).toThrow();
		expect(() => adapter.save("/a.txt", "Ym9keQ==", true)).toThrow();
		expect(() => adapter.download("/a.txt")).toThrow();
	});
});
