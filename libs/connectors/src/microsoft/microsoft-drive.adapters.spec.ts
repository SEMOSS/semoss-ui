import { describe, expect, it, vi } from "vitest";
import { canCreateItems } from "@semoss/shared";
import {
	createOneDriveAdapter,
	createOneDriveSharedAdapter,
	createTeamsFilesAdapter,
	getDriveItem,
	getDriveSaveRequest,
} from "./microsoft-drive.adapters";

/** A drive item as the list reactors return it. */
const entry = (
	name: string,
	extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
	id: `id-${name}`,
	name: name,
	isFolder: false,
	lastModifiedDateTime: "2026-09-27T12:00:00Z",
	...extra,
});

describe("the OneDrive adapter", () => {
	const adapter = createOneDriveAdapter();

	it("browses by path from the drive's top, and searches the whole drive", () => {
		expect(adapter.browse("/")).toBe(
			"MicrosoftOneDriveListFiles(limit=[200]);",
		);
		expect(adapter.browse("/Reports/2026/")).toBe(
			'MicrosoftOneDriveListFiles(path=["<encode>Reports/2026</encode>"], limit=[200]);',
		);
		expect(adapter.search("/Reports/", "budget")).toContain(
			'MicrosoftOneDriveSearchFiles(search=["<encode>budget</encode>"], scope=["drive"]',
		);
		expect(adapter.capabilities).toEqual(
			expect.objectContaining({
				search: true,
				searchScope: false,
				mutate: false,
				download: false,
			}),
		);
	});

	it("lists each item under its path, folders first, carrying the item", () => {
		const rows = adapter.mapEntries(
			{
				files: [
					entry("q3.xlsx"),
					entry("Old", { isFolder: true, path: "Reports" }),
					// a search hit names the folder it lives in
					entry("deck.pptx", { path: "Decks" }),
				],
			},
			"/Reports/",
		);
		expect(rows.map((row) => row.path)).toEqual([
			"/Reports/Old/",
			"/Decks/deck.pptx",
			"/Reports/q3.xlsx",
		]);
		expect(rows[0].type).toBe("directory");
		expect(rows[2].lastModified).toBe("2026-09-27T12:00:00Z");
		expect(getDriveItem(rows[2])?.id).toBe("id-q3.xlsx");
		expect(getDriveItem({ name: "a", path: "/a" })).toBeUndefined();
	});

	it("lists nothing for its empty start or a response of the wrong shape", () => {
		expect(adapter.mapEntries([], "/")).toEqual([]);
		expect(adapter.mapEntries({ nope: true }, "/")).toEqual([]);
	});

	it("creates a file or a folder in the folder it is made in, and changes nothing else", () => {
		expect(adapter.createFile("/Reports/2026/notes.txt")).toBe(
			'MicrosoftOneDriveCreateFile(name=["<encode>notes.txt</encode>"], path=["<encode>Reports/2026</encode>"]);',
		);
		// the drive's top is no folder to name
		expect(adapter.createFile("/notes.txt")).toBe(
			'MicrosoftOneDriveCreateFile(name=["<encode>notes.txt</encode>"]);',
		);
		expect(adapter.createDirectory("/Reports/Drafts/")).toBe(
			'MicrosoftOneDriveCreateFolder(name=["<encode>Drafts</encode>"], path=["<encode>Reports</encode>"]);',
		);
		expect(canCreateItems(adapter.capabilities)).toBe(true);
		expect(() => adapter.rename("/a.txt", "/b.txt")).toThrow();
		expect(() => adapter.remove("/a.txt")).toThrow();
	});
});

describe("uploading into the user's own drive", () => {
	const adapter = createOneDriveAdapter();
	const file = new File(["x"], "R&D plan.docx");
	const SCRATCH = /^\.onedrive-upload-[a-z0-9]+$/;

	/**
	 * The insight's actions, saving uploads the way the server does: under an
	 * escaped name, at a location written with its own separators.
	 */
	const fakeActions = (
		run: (pixel: string) => Promise<unknown> = async () => undefined,
		isSaving = true,
	) => {
		const unused = () => Promise.reject(new Error("not the insight"));
		return {
			uploadApp: unused,
			uploadEngine: unused,
			uploadUser: unused,
			uploadInsight: vi.fn(
				async (folder: string, files: File | File[]) => ({
					response: {} as Response,
					data: (isSaving && Array.isArray(files) ? files : []).map(
						(saved) => {
							const name = saved.name.replace("&", "&amp;");
							return {
								fileName: name,
								fileLocation: `\\${folder}\\${name}`,
							};
						},
					),
				}),
			),
			run: vi.fn(run),
		};
	};
	const pixels = (actions: ReturnType<typeof fakeActions>) =>
		actions.run.mock.calls.map(([pixel]) => pixel);

	it("passes a file through a folder of its own in the insight, under the name the computer has", async () => {
		const actions = fakeActions();
		await adapter.upload(actions, "/Reports/2026/", [file]);

		const [folder] = actions.uploadInsight.mock.calls[0];
		expect(folder).toMatch(SCRATCH);
		expect(pixels(actions)).toEqual([
			`MicrosoftOneDriveUploadFile(filePath=["<encode>/${folder}/R&amp;D plan.docx</encode>"], name=["<encode>R&D plan.docx</encode>"], path=["<encode>Reports/2026</encode>"]);`,
			// always with its path: without one the reactor empties the insight
			`DeleteInsightAssets(filePath=["${folder}"]);`,
		]);
		expect(adapter.capabilities.upload).toBe(true);
	});

	it("removes the folder and says why when the drive refuses a file", async () => {
		const actions = fakeActions(async (pixel) => {
			if (pixel.startsWith("MicrosoftOneDriveUploadFile")) {
				throw new Error("403");
			}
		});
		await expect(adapter.upload(actions, "/", [file])).rejects.toThrow(
			"403",
		);
		expect(pixels(actions).at(-1)).toBe(
			`DeleteInsightAssets(filePath=["${actions.uploadInsight.mock.calls[0][0]}"]);`,
		);
	});

	it("uploads nothing the server did not save, and a failed removal fails no upload", async () => {
		const unsaved = fakeActions(undefined, false);
		await expect(adapter.upload(unsaved, "/", [file])).rejects.toThrow(
			"The server did not save R&D plan.docx.",
		);
		expect(pixels(unsaved)).toHaveLength(1);
		expect(pixels(unsaved)[0]).toContain("DeleteInsightAssets(filePath=[");

		const leftBehind = fakeActions(async (pixel) => {
			if (pixel.startsWith("DeleteInsightAssets")) {
				throw new Error("busy");
			}
		});
		await expect(
			adapter.upload(leftBehind, "/", [file]),
		).resolves.toBeDefined();
	});
});

describe("the drives that are not the user's own", () => {
	it("stay browse only", () => {
		const shared = createOneDriveSharedAdapter();
		const teams = createTeamsFilesAdapter("team-1", "channel-1");
		expect(canCreateItems(shared.capabilities)).toBe(false);
		expect(canCreateItems(teams.capabilities)).toBe(false);
		expect(shared.capabilities.upload).toBe(false);
		expect(teams.capabilities.upload).toBe(false);
		expect(() => shared.createFile("/notes.txt")).toThrow();
		expect(() => teams.createDirectory("/Drafts")).toThrow();
	});
});

describe("the shared with me adapter", () => {
	it("reaches a shared folder by the ids it was shown with", () => {
		const adapter = createOneDriveSharedAdapter();
		expect(adapter.browse("/")).toBe(
			"MicrosoftOneDriveListSharedFiles(limit=[200]);",
		);

		const rows = adapter.mapEntries(
			{
				files: [
					entry("Plans", { isFolder: true, driveId: "drive-b" }),
					entry("notes.md", { driveId: "drive-a" }),
					entry("notes.md", { id: "id-other", driveId: "drive-c" }),
				],
			},
			"/",
		);
		expect(rows.map((row) => row.path)).toEqual([
			"/Plans/",
			"/notes.md",
			"/notes.md (2)",
		]);
		expect(adapter.browse("/Plans/")).toBe(
			'MicrosoftOneDriveListFiles(driveId=["drive-b"], itemId=["id-Plans"], limit=[200]);',
		);
	});
});

describe("the Teams files adapter", () => {
	it("browses a channel's folders by path and filters rather than searches", () => {
		const adapter = createTeamsFilesAdapter("team-1", "channel-1");
		expect(adapter.browse("/Specs/2026/")).toBe(
			'MicrosoftTeamsListFiles(teamId=["team-1"], channelId=["channel-1"], folderPath=["<encode>Specs/2026</encode>"]);',
		);
		expect(adapter.capabilities.search).toBe(false);
		expect(
			adapter
				.mapEntries(
					[entry("spec.docx", { path: "General" })],
					"/Specs/",
				)
				.map((row) => row.path),
		).toEqual(["/Specs/spec.docx"]);
	});
});

describe("saving a drive row", () => {
	const rows = createOneDriveAdapter().mapEntries(
		{
			files: [
				entry("q3.xlsx", { driveId: "d" }),
				entry("Old", { isFolder: true }),
			],
		},
		"/",
	);
	const file = rows.find((row) => row.name === "q3.xlsx");
	const folder = rows.find((row) => row.name === "Old");
	const getDownload = () => (fileName: string) => `Download(${fileName});`;

	it("saves a file with the provider's download, and never a folder", () => {
		if (!file || !folder) {
			throw new Error("the rows were not listed");
		}
		const request = getDriveSaveRequest(file, getDownload);
		expect(request).toEqual(
			expect.objectContaining({ key: "id-q3.xlsx", name: "q3.xlsx" }),
		);
		expect(
			request?.source.kind === "download" &&
				request.source.buildPixel("q3 (2).xlsx"),
		).toBe("Download(q3 (2).xlsx);");
		expect(getDriveSaveRequest(folder, getDownload)).toBeUndefined();
		expect(getDriveSaveRequest(file, () => null)).toBeUndefined();
	});
});
