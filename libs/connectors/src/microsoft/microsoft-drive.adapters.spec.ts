import { describe, expect, it } from "vitest";
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
					entry("Old", { isFolder: true }),
					// a search hit says where it lives
					entry("deck.pptx", { path: "Decks/deck.pptx" }),
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
					[entry("spec.docx", { path: "General/spec.docx" })],
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
