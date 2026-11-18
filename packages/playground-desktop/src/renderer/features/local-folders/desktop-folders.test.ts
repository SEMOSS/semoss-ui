import { describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { createMemoryFileSource } from "../../test/memory-file-source";
import { DesktopFolders } from "./desktop-folders";

// jsdom's Blob has no arrayBuffer; browsers and Electron do
vi.stubGlobal("Blob", NodeBlob);

const setup = () => {
	const notes = createMemoryFileSource({
		"/q3.md": "# Q3",
		"/sub/a.txt": "a",
	});
	const code = createMemoryFileSource({ "/main.ts": "export {};" });
	const folders = new DesktopFolders([
		{ name: "notes", source: notes },
		{ name: "code", source: code },
	]);
	return { folders, notes, code };
};

describe("DesktopFolders", () => {
	it("lists each attached folder at the top", async () => {
		const { folders } = setup();

		expect(await folders.list("")).toEqual([
			{ path: "notes", name: "notes", kind: "directory" },
			{ path: "code", name: "code", kind: "directory" },
		]);
	});

	it("lists a folder's entries under its name", async () => {
		const { folders } = setup();

		const entries = await folders.list("notes");

		expect(entries.map((entry) => entry.path).sort()).toEqual([
			"notes/q3.md",
			"notes/sub",
		]);
		expect(
			entries.find((entry) => entry.path === "notes/q3.md"),
		).toMatchObject({ kind: "file", size: 4 });
	});

	it("finds an entry through its folder's listing", async () => {
		const { folders } = setup();

		expect(await folders.stat("notes/sub/a.txt")).toMatchObject({
			path: "notes/sub/a.txt",
			kind: "file",
		});
		expect(await folders.stat("notes")).toMatchObject({
			kind: "directory",
		});
		expect(await folders.stat("notes/missing.md")).toBeNull();
	});

	it("reads and writes in the folder a path names", async () => {
		const { folders, code } = setup();

		await folders.writeText("code/util.ts", "export const x = 1;");

		expect(code.files.get("/util.ts")).toBe("export const x = 1;");
		const blob = await folders.readFile("notes/q3.md");
		expect(new TextDecoder().decode(await blob.arrayBuffer())).toBe("# Q3");
	});

	it("refuses a path outside every attached folder", async () => {
		const { folders } = setup();

		await expect(folders.list("other")).rejects.toThrow(
			"other is not an attached folder",
		);
	});

	it("never writes, moves, or deletes an attached folder itself", async () => {
		const { folders } = setup();

		await expect(folders.remove("notes")).rejects.toThrow(
			"attached folder itself",
		);
		await expect(folders.writeText("notes", "x")).rejects.toThrow(
			"attached folder itself",
		);
	});

	it("refuses a move between attached folders", async () => {
		const { folders } = setup();

		await expect(folders.move("notes/q3.md", "code/q3.md")).rejects.toThrow(
			"not supported",
		);
	});

	it("moves within one folder", async () => {
		const { folders, notes } = setup();

		await folders.move("notes/q3.md", "notes/archive/q3.md");

		expect(notes.files.has("/q3.md")).toBe(false);
		expect(notes.files.get("/archive/q3.md")).toBe("# Q3");
	});
});
