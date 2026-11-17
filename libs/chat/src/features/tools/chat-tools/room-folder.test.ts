import { describe, expect, test } from "vitest";
import { RoomFolder } from "./room-folder";

/**
 * A room folder over a fake insight: every pixel is recorded, and a listing
 * of the root returns the given rows.
 *
 * @param rows - What `BrowseInsightAssets` returns for any folder.
 * @returns The folder and the pixels it ran.
 */
const createFolder = (
	rows: { name: string; type?: string }[] = [],
): { folder: RoomFolder; pixels: string[] } => {
	const pixels: string[] = [];
	const folder = new RoomFolder(async (pixel) => {
		pixels.push(pixel);
		return pixel.startsWith("BrowseInsightAssets") ? rows : "";
	});
	return { folder, pixels };
};

describe("RoomFolder", () => {
	test("never sends a change to the folder root", async () => {
		const { folder, pixels } = createFolder([{ name: "a.md" }]);

		await expect(folder.remove("")).rejects.toThrow(
			"not the folder itself",
		);
		await expect(folder.writeText("", "x")).rejects.toThrow(
			"not the folder itself",
		);
		await expect(folder.createDirectory("")).rejects.toThrow(
			"not the folder itself",
		);
		await expect(folder.readFile("")).rejects.toThrow(
			"not the folder itself",
		);
		expect(
			pixels.some((pixel) => pixel.includes("DeleteInsightAssets")),
		).toBe(false);
		expect(
			pixels.some((pixel) => pixel.includes("SaveInsightAssets")),
		).toBe(false);
	});

	test("deletes an entry by its path in the room's space", async () => {
		const { folder, pixels } = createFolder();

		await folder.remove("docs");

		expect(pixels).toEqual(['DeleteInsightAssets(filePath=["/docs"]);']);
	});

	test("hides the reserved folders from listings, whatever their case", async () => {
		const { folder } = createFolder([
			{ name: "mcp", type: "directory" },
			{ name: "MCP", type: "directory" },
			{ name: ".git", type: "directory" },
			{ name: ".admin", type: "directory" },
			{ name: "notes.md" },
		]);

		const entries = await folder.list("");

		expect(entries.map((entry) => entry.path)).toEqual(["notes.md"]);
		expect(await folder.stat("mcp")).toBeNull();
		expect(await folder.stat("mcp/pixel_mcp.json")).toBeNull();
	});

	test("refuses to read or change anything in the mcp folder", async () => {
		const { folder, pixels } = createFolder([
			{ name: "mcp", type: "directory" },
			{ name: "a.md" },
		]);

		await expect(folder.readFile("mcp/pixel_mcp.json")).rejects.toThrow(
			"Nothing exists at mcp/pixel_mcp.json.",
		);
		await expect(
			folder.writeText("mcp/pixel_mcp.json", "{}"),
		).rejects.toThrow("Nothing exists");
		await expect(folder.createDirectory("Mcp/tools")).rejects.toThrow(
			"Nothing exists",
		);
		await expect(folder.remove("mcp")).rejects.toThrow("Nothing exists");
		await expect(folder.move("a.md", "mcp/a.md")).rejects.toThrow(
			"Nothing exists",
		);
		await expect(folder.move("mcp", "tools")).rejects.toThrow(
			"Nothing exists",
		);
		expect(
			pixels.filter((pixel) => !pixel.startsWith("BrowseInsightAssets")),
		).toEqual([]);
	});

	test("refuses paths the pixels cannot carry", async () => {
		const { folder, pixels } = createFolder();

		await expect(folder.writeText('say "hi".md', "x")).rejects.toThrow(
			"cannot contain double quotes or backslashes",
		);
		expect(pixels).toEqual([]);
	});
});
