// @vitest-environment node

import { describe, expect, test } from "vitest";
import {
	mkdirSync,
	mkdtempSync,
	realpathSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { searchFolder } from "./search-folder";

/**
 * An attached folder with files at several depths, a hidden `.git`, and a
 * link to a folder outside it.
 */
const setup = () => {
	const base = realpathSync(mkdtempSync(join(tmpdir(), "search-folder-")));
	const root = join(base, "notes");
	const outside = join(base, "secret");
	mkdirSync(join(root, "q3", "drafts"), { recursive: true });
	mkdirSync(join(root, ".git"));
	mkdirSync(outside);
	writeFileSync(join(root, "todo.md"), "");
	writeFileSync(join(root, "q3", "Todo-later.md"), "");
	writeFileSync(join(root, "q3", "drafts", "todo-draft.md"), "");
	writeFileSync(join(root, ".git", "todo-hook"), "");
	writeFileSync(join(outside, "todo-secret.md"), "");
	symlinkSync(outside, join(root, "linked"));
	return { root };
};

/**
 * The paths a search found.
 *
 * @param result - The search's result.
 * @returns Their paths, in order.
 */
const pathsOf = (result: Awaited<ReturnType<typeof searchFolder>>) =>
	result.entries.map((entry) => entry.path);

describe("searchFolder", () => {
	test("finds names at any depth, nearest first, in any case", async () => {
		const { root } = setup();

		const result = await searchFolder(root, "/", "todo");

		expect(pathsOf(result)).toEqual([
			"/todo.md",
			"/q3/Todo-later.md",
			"/q3/drafts/todo-draft.md",
		]);
		expect(result.isTruncated).toBe(false);
		expect(result.entries[2]).toMatchObject({ name: "todo-draft.md" });
	});

	test("finds what the folder shows: nothing under .git, and no walk through a link", async () => {
		const { root } = setup();

		const result = await searchFolder(root, "", "todo");

		expect(pathsOf(result).some((path) => path.includes(".git"))).toBe(
			false,
		);
		expect(pathsOf(result).some((path) => path.includes("secret"))).toBe(
			false,
		);
	});

	test("matches a link by its own name", async () => {
		const { root } = setup();

		const result = await searchFolder(root, "/", "link");

		expect(pathsOf(result)).toEqual(["/linked"]);
	});

	test("searches under a folder inside it", async () => {
		const { root } = setup();

		const result = await searchFolder(root, "/q3/drafts", "todo");

		expect(pathsOf(result)).toEqual(["/q3/drafts/todo-draft.md"]);
	});

	test("stops at its limit and says some were left out", async () => {
		const { root } = setup();

		const result = await searchFolder(root, "/", "todo", { limit: 2 });

		expect(pathsOf(result)).toEqual(["/todo.md", "/q3/Todo-later.md"]);
		expect(result.isTruncated).toBe(true);
	});

	test("returns what it has once stopped or out of time", async () => {
		const { root } = setup();
		const controller = new AbortController();
		controller.abort();

		const stopped = await searchFolder(root, "/", "todo", {
			signal: controller.signal,
		});
		const late = await searchFolder(root, "/", "todo", { deadline: 0 });

		expect(stopped).toEqual({ entries: [], isTruncated: true });
		expect(late).toEqual({ entries: [], isTruncated: true });
	});

	test("finds nothing for an empty term", async () => {
		const { root } = setup();

		expect(await searchFolder(root, "/", "  ")).toEqual({
			entries: [],
			isTruncated: false,
		});
	});

	test("refuses to start outside the folder, or in .git", async () => {
		const { root } = setup();

		await expect(searchFolder(root, "/../secret", "todo")).rejects.toThrow(
			"outside the attached folder",
		);
		await expect(searchFolder(root, "/.git", "todo")).rejects.toThrow(
			"not available",
		);
	});
});
