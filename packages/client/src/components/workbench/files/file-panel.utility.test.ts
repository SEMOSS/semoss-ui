import { describe, expect, it } from "vitest";
import {
	getFileDownloadPixel,
	getFileMode,
	getFileReadPixel,
	getFileSavePixel,
} from "./file-panel.utility";

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

	it("routes reads, saves, and downloads to the selected scope", () => {
		const project = {
			type: "PROJECT" as const,
			id: "project-1",
			path: "/a.py",
		};
		const engine = { ...project, type: "ENGINE" as const, id: "engine-1" };
		const insight = {
			...project,
			type: "INSIGHT" as const,
			id: "insight-1",
		};

		expect(getFileReadPixel(project)).toContain("GetAppAssets");
		expect(getFileReadPixel(engine, true)).toContain(
			"GetEngineAssetsBase64",
		);
		expect(getFileSavePixel(insight, "value")).toContain(
			"SaveInsightAssets",
		);
		expect(getFileDownloadPixel(insight)).toContain("DownloadInsightAsset");
	});
});
