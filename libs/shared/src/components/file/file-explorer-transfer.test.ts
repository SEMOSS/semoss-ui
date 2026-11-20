import { afterEach, describe, expect, it } from "vitest";
import type { FileItem } from "./file.types";
import {
	collectTransferEntries,
	endTransferDrag,
	getForeignTransferDrag,
	registerTransferSource,
	startTransferDrag,
} from "./file-explorer-transfer";

/** A tree of `path → children` for directories and `path → text` for files. */
const TREE: Record<string, FileItem[] | string> = {
	"/docs/": [
		{ name: "a.md", path: "/docs/a.md" },
		{ name: "img", path: "/docs/img/", type: "directory" },
		{ name: "empty", path: "/docs/empty/", type: "directory" },
	],
	"/docs/a.md": "alpha",
	"/docs/img/": [{ name: "b.png", path: "/docs/img/b.png" }],
	"/docs/img/b.png": "beta",
	"/docs/empty/": [],
	"/c.txt": "gamma",
};

const source = {
	list: async (path: string) => {
		const entry = TREE[path];
		if (!Array.isArray(entry)) throw new Error(`not a folder: ${path}`);
		return entry;
	},
	read: async (path: string) => {
		const entry = TREE[path];
		if (typeof entry !== "string") throw new Error(`not a file: ${path}`);
		return new TextEncoder().encode(entry);
	},
};

const cleanups: (() => void)[] = [];
afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup();
	endTransferDrag();
});

describe("file explorer transfer", () => {
	it("offers a drag only to the other explorers", () => {
		cleanups.push(registerTransferSource("from", source));
		startTransferDrag({ instanceId: "from", items: [] });

		expect(getForeignTransferDrag("from")).toBeNull();
		expect(getForeignTransferDrag("to")?.instanceId).toBe("from");

		endTransferDrag();
		expect(getForeignTransferDrag("to")).toBeNull();
	});

	it("ignores a drag whose explorer has gone", () => {
		const unregister = registerTransferSource("from", source);
		startTransferDrag({ instanceId: "from", items: [] });
		unregister();

		expect(getForeignTransferDrag("to")).toBeNull();
	});

	it("reads folders with everything in them, relative to where they land", async () => {
		cleanups.push(registerTransferSource("from", source));

		const entries = await collectTransferEntries({
			instanceId: "from",
			items: [
				{ name: "docs", path: "/docs/", type: "directory" },
				{ name: "c.txt", path: "/c.txt" },
			],
		});

		expect(entries.directories).toEqual(["docs", "docs/img", "docs/empty"]);
		expect(
			entries.files.map((file) => [
				file.path,
				new TextDecoder().decode(file.bytes),
			]),
		).toEqual([
			["docs/a.md", "alpha"],
			["docs/img/b.png", "beta"],
			["c.txt", "gamma"],
		]);
	});
});
