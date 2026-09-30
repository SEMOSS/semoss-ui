import { describe, expect, test } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { getFolderPathName, getParentFolderPath } from "../folders/folder-path";
import type { FolderEntry, WorkFolderProvider } from "../teamwork.types";
import {
	buildFolderToolDefinitions,
	executeFolderTool,
	FOLDER_TOOL_NAMES,
	getUsualFolderToolExecution,
	isFolderChangeTool,
	ROOM_FILES_NAME,
} from "./folder-tools";

/**
 * A work folder held in memory. Directories are implied by the files in them
 * and by explicit entries, the way a real file system reports them. Blobs come
 * from Node, whose Blob reads back reliably in every test environment.
 */
const createMemoryFolder = (
	files: Record<string, string>,
	directories: string[] = [],
): WorkFolderProvider & {
	files: Map<string, string>;
	directories: Set<string>;
} => {
	const fileMap = new Map(Object.entries(files));
	const directorySet = new Set(directories);
	for (const path of fileMap.keys()) {
		let parent = getParentFolderPath(path);
		while (parent) {
			directorySet.add(parent);
			parent = getParentFolderPath(parent);
		}
	}

	const exists = (path: string) =>
		path === "" || fileMap.has(path) || directorySet.has(path);

	return {
		files: fileMap,
		directories: directorySet,
		list: async (path) => {
			if (path && !directorySet.has(path)) {
				throw new DOMException("missing", "NotFoundError");
			}
			const entries: FolderEntry[] = [];
			for (const directory of directorySet) {
				if (getParentFolderPath(directory) === path) {
					entries.push({
						path: directory,
						name: getFolderPathName(directory),
						kind: "directory",
					});
				}
			}
			for (const [file, content] of fileMap) {
				if (getParentFolderPath(file) === path) {
					entries.push({
						path: file,
						name: getFolderPathName(file),
						kind: "file",
						size: content.length,
					});
				}
			}
			return entries;
		},
		readFile: async (path) => {
			const content = fileMap.get(path);
			if (content === undefined) {
				throw new DOMException("missing", "NotFoundError");
			}
			return new NodeBlob([content]) as unknown as Blob;
		},
		writeText: async (path, content) => {
			fileMap.set(path, content);
			let parent = getParentFolderPath(path);
			while (parent) {
				directorySet.add(parent);
				parent = getParentFolderPath(parent);
			}
		},
		createDirectory: async (path) => {
			directorySet.add(path);
		},
		move: async (from, to) => {
			const content = fileMap.get(from);
			if (content === undefined || exists(to)) {
				throw new Error("cannot move");
			}
			fileMap.delete(from);
			fileMap.set(to, content);
		},
		remove: async (path) => {
			fileMap.delete(path);
			directorySet.delete(path);
			for (const file of [...fileMap.keys()]) {
				if (file.startsWith(`${path}/`)) {
					fileMap.delete(file);
				}
			}
		},
		stat: async (path) => {
			if (path === "") {
				return { path: "", name: "root", kind: "directory" };
			}
			if (fileMap.has(path)) {
				return {
					path: path,
					name: getFolderPathName(path),
					kind: "file",
					size: fileMap.get(path)?.length,
				};
			}
			if (directorySet.has(path)) {
				return {
					path: path,
					name: getFolderPathName(path),
					kind: "directory",
				};
			}
			return null;
		},
	};
};

describe("getUsualFolderToolExecution", () => {
	test("reads run on their own and changes ask", () => {
		expect(getUsualFolderToolExecution(FOLDER_TOOL_NAMES.READ)).toBe(
			"auto",
		);
		expect(getUsualFolderToolExecution(FOLDER_TOOL_NAMES.SEARCH)).toBe(
			"auto",
		);
		expect(getUsualFolderToolExecution(FOLDER_TOOL_NAMES.WRITE)).toBe(
			"ask",
		);
		expect(getUsualFolderToolExecution(FOLDER_TOOL_NAMES.DELETE)).toBe(
			"ask",
		);
	});
});

describe("buildFolderToolDefinitions", () => {
	const context = { executionOf: getUsualFolderToolExecution };

	test("leaves out the tools that do not run", () => {
		const names = buildFolderToolDefinitions({
			...context,
			executionOf: (name) =>
				isFolderChangeTool(name)
					? null
					: getUsualFolderToolExecution(name),
		}).map((definition) => definition.name);
		expect(names).toEqual([
			FOLDER_TOOL_NAMES.LIST,
			FOLDER_TOOL_NAMES.READ,
			FOLDER_TOOL_NAMES.SEARCH,
		]);
	});

	test("tells the model which calls wait for the user", () => {
		const byName = (
			executionOf: typeof context.executionOf,
		): Record<string, string> =>
			Object.fromEntries(
				buildFolderToolDefinitions({ ...context, executionOf }).map(
					(definition) => [definition.name, definition.description],
				),
			);
		const usual = byName(getUsualFolderToolExecution);
		expect(usual[FOLDER_TOOL_NAMES.WRITE]).toContain(
			"The user reviews each change",
		);
		expect(usual[FOLDER_TOOL_NAMES.DELETE]).toContain(
			"The user approves every deletion",
		);
		expect(usual[FOLDER_TOOL_NAMES.READ]).not.toContain("The user");

		const flipped = byName((name) =>
			getUsualFolderToolExecution(name) === "auto" ? "ask" : "auto",
		);
		expect(flipped[FOLDER_TOOL_NAMES.READ]).toContain(
			"The user approves each call",
		);
		expect(flipped[FOLDER_TOOL_NAMES.DELETE]).not.toContain("The user");
	});

	test("the chat's own files are described as shared with its other tools", () => {
		const [list] = buildFolderToolDefinitions(context);
		expect(list.description).toContain(
			`${ROOM_FILES_NAME} (this chat's own files)`,
		);
		expect(list.description).toContain(
			"the chat's other tools read and write them too",
		);
	});
});

describe("executeFolderTool", () => {
	test("lists a folder, nested to the requested depth", async () => {
		const folder = createMemoryFolder({
			"a.md": "a",
			"docs/b.md": "b",
			"docs/deep/c.md": "c",
		});

		const shallow = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.LIST,
			{},
			"Reports",
		);
		expect(shallow.isError).toBe(false);
		expect(
			(shallow.payload.entries as { path: string }[]).map(
				(row) => row.path,
			),
		).toEqual(["docs", "a.md"]);

		const deep = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.LIST,
			{ depth: 3 },
			"Reports",
		);
		expect(
			(deep.payload.entries as { path: string }[]).map((row) => row.path),
		).toContain("docs/deep/c.md");
	});

	test("reads a text file window", async () => {
		const folder = createMemoryFolder({ "notes.txt": "one\ntwo\nthree\n" });
		const outcome = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.READ,
			{ path: "notes.txt", offset: 2, limit: 1 },
			"Reports",
		);
		expect(outcome.isError).toBe(false);
		expect(outcome.payload.content).toBe("two\n");
		expect(outcome.payload.truncated).toBe(true);
	});

	test("refuses to read binary files and explains how to share them", async () => {
		const folder = createMemoryFolder({ "deck.pptx": "PK" });
		const outcome = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.READ,
			{ path: "deck.pptx" },
			"Reports",
		);
		expect(outcome.isError).toBe(true);
		expect(String(outcome.payload.error)).toContain("attach");
	});

	test("refuses paths that leave the folder", async () => {
		const folder = createMemoryFolder({ "a.md": "a" });
		const outcome = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.READ,
			{ path: "../outside.md" },
			"Reports",
		);
		expect(outcome.isError).toBe(true);
		expect(String(outcome.payload.error)).toContain(
			"leaves the work folder",
		);
	});

	test("finds files by name and by content", async () => {
		const folder = createMemoryFolder({
			"q3-budget.xlsx": "binary",
			"docs/plan.md": "The budget is final.",
			"docs/other.md": "Nothing here.",
		});

		const byName = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.SEARCH,
			{ query: "budget" },
			"Reports",
		);
		expect(
			(byName.payload.matches as { path: string }[]).map(
				(row) => row.path,
			),
		).toEqual(["q3-budget.xlsx"]);

		const byContent = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.SEARCH,
			{ query: "budget", content: true },
			"Reports",
		);
		const paths = (byContent.payload.matches as { path: string }[]).map(
			(row) => row.path,
		);
		expect(paths).toContain("docs/plan.md");
		expect(paths).not.toContain("docs/other.md");
	});

	test("writes a file and reports it as created, then modified", async () => {
		const folder = createMemoryFolder({});
		const created = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.WRITE,
			{ path: "out/summary.md", content: "# Summary" },
			"Reports",
		);
		expect(created.isError).toBe(false);
		expect(created.changes[0]?.kind).toBe("created");
		expect(folder.files.get("out/summary.md")).toBe("# Summary");

		const modified = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.WRITE,
			{ path: "out/summary.md", content: "# Summary v2" },
			"Reports",
		);
		expect(modified.changes[0]?.kind).toBe("modified");
	});

	test("edits exact text and refuses a missing match", async () => {
		const folder = createMemoryFolder({ "a.md": "Hello World" });
		const edited = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.EDIT,
			{ path: "a.md", old_text: "World", new_text: "There" },
			"Reports",
		);
		expect(edited.isError).toBe(false);
		expect(folder.files.get("a.md")).toBe("Hello There");

		const missing = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.EDIT,
			{ path: "a.md", old_text: "World", new_text: "Again" },
			"Reports",
		);
		expect(missing.isError).toBe(true);
		expect(folder.files.get("a.md")).toBe("Hello There");
	});

	test("will not delete a folder with contents unless told to", async () => {
		const folder = createMemoryFolder({ "old/a.md": "a" });
		const refused = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.DELETE,
			{ path: "old" },
			"Reports",
		);
		expect(refused.isError).toBe(true);
		expect(folder.files.has("old/a.md")).toBe(true);

		const deleted = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.DELETE,
			{ path: "old", recursive: "true" },
			"Reports",
		);
		expect(deleted.isError).toBe(false);
		expect(folder.files.has("old/a.md")).toBe(false);
	});

	test("never addresses the folder root for changes", async () => {
		const folder = createMemoryFolder({ "a.md": "a" });
		const outcome = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.DELETE,
			{ path: "/" },
			"Reports",
		);
		expect(outcome.isError).toBe(true);
		expect(folder.files.has("a.md")).toBe(true);
	});

	test("moves a file", async () => {
		const folder = createMemoryFolder({ "draft.md": "x" });
		const outcome = await executeFolderTool(
			folder,
			FOLDER_TOOL_NAMES.MOVE,
			{ from: "draft.md", to: "final.md" },
			"Reports",
		);
		expect(outcome.isError).toBe(false);
		expect(outcome.changes[0]).toMatchObject({
			kind: "moved",
			from: "draft.md",
			path: "final.md",
		});
		expect(folder.files.has("final.md")).toBe(true);
	});
});
