import { describe, expect, it, vi } from "vitest";
import { createMemoryFileSource } from "../../test/memory-file-source";
import { createDesktopFilesSource } from "./desktop-files-source";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
}));

/** Two attached folders, notes and code, as one Desktop tree. */
const setup = () => {
	const notes = createMemoryFileSource({
		"/q3.md": "# Q3",
		"/old/a.md": "a",
	});
	const code = createMemoryFileSource({ "/main.ts": "export {};" });
	const source = createDesktopFilesSource([
		{ id: "f1", name: "notes", source: notes },
		{ id: "f2", name: "code", source: code },
	]);
	return { source, notes, code };
};

describe("the Desktop tree's source", () => {
	it("lists the attached folders at its top level", async () => {
		const { source } = setup();

		expect(await source.list("/")).toEqual([
			{ name: "notes", path: "/notes/", type: "directory" },
			{ name: "code", path: "/code/", type: "directory" },
		]);
	});

	it("lists a folder's files under the folder's name", async () => {
		const { source } = setup();

		const items = await source.list("/notes/");

		expect(items.map((item) => item.path).sort()).toEqual([
			"/notes/old",
			"/notes/q3.md",
		]);
	});

	it("reads and writes through the folder the path is in", async () => {
		const { source, code } = setup();

		await source.write("/code/main.ts", new TextEncoder().encode("1"));

		expect(new TextDecoder().decode(await code.read("/main.ts"))).toBe("1");
		expect(
			new TextDecoder().decode(await source.read("/code/main.ts")),
		).toBe("1");
	});

	it("writes nothing at its top level or over a folder itself", async () => {
		const { source } = setup();

		await expect(source.createFile("/stray.md")).rejects.toThrow(
			"desktop:localFolders.notInFolder",
		);
		await expect(source.remove("/notes/")).rejects.toThrow(
			"desktop:localFolders.notInFolder",
		);
	});

	it("moves a file within its folder, and never between folders", async () => {
		const { source, notes } = setup();

		await source.move("/notes/q3.md", "/notes/old/q3.md");
		expect((await notes.list("/old")).map((item) => item.name)).toContain(
			"q3.md",
		);

		await expect(
			source.move("/notes/old/a.md", "/code/a.md"),
		).rejects.toThrow("desktop:localFolders.betweenFolders");
	});

	it("says which folder a path is in, and maps a folder's path back", () => {
		const { source } = setup();

		expect(source.locate("/notes/old/a.md")).toEqual({
			folderId: "f1",
			path: "/old/a.md",
		});
		expect(source.locate("/code/")).toEqual({ folderId: "f2", path: "/" });
		expect(source.locate("/")).toBeNull();
		expect(source.toDesktopPath("f2", "/main.ts")).toBe("/code/main.ts");
	});

	it("searches every folder, or one, and says when one left matches out", async () => {
		const search = vi.fn(async (_path: string, term: string) => [
			{ name: `${term}.md`, path: `/deep/${term}.md` },
		]);
		const notes = {
			...createMemoryFileSource({}),
			capabilities: {
				...createMemoryFileSource({}).capabilities,
				search: true,
			},
			search: search,
			isSearchTruncated: true,
		};
		const code = {
			...createMemoryFileSource({}),
			capabilities: {
				...createMemoryFileSource({}).capabilities,
				search: true,
			},
			search: vi.fn(async () => []),
			isSearchTruncated: false,
		};
		const source = createDesktopFilesSource([
			{ id: "f1", name: "notes", source: notes },
			{ id: "f2", name: "code", source: code },
		]);

		expect(source.capabilities.search).toBe(true);
		expect(await source.search?.("", "todo")).toEqual([
			{ name: "todo.md", path: "/notes/deep/todo.md" },
		]);
		expect(source.isSearchTruncated).toBe(true);

		await source.search?.("/code/", "todo");
		expect(code.search).toHaveBeenLastCalledWith("/", "todo");
		expect(source.isSearchTruncated).toBe(false);
	});
});
