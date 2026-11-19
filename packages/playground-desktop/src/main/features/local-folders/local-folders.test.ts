// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	GRANTS_FILE_NAME,
	openFolderGrants,
	parseGrantsFile,
} from "./folder-grants";
import {
	createLocalFs,
	isHiddenName,
	isRunnable,
	resolveInsideFolder,
} from "./local-fs";

/** A fresh folder to attach, beside one it must not reach. */
const setup = () => {
	const base = realpathSync(mkdtempSync(join(tmpdir(), "local-folders-")));
	const root = join(base, "notes");
	const outside = join(base, "secret");
	mkdirSync(join(root, "sub"), { recursive: true });
	mkdirSync(outside);
	mkdirSync(join(root, ".git"));
	writeFileSync(join(root, "q3.md"), "# Q3");
	writeFileSync(join(outside, "key.txt"), "secret");
	const trash = vi.fn(async () => undefined);
	const openPath = vi.fn(async () => "");
	const reveal = vi.fn();
	const confirmRun = vi.fn(async () => false);
	const fs = createLocalFs({ trash, openPath, reveal, confirmRun });
	return { base, root, outside, fs, trash, openPath, reveal, confirmRun };
};

describe("resolveInsideFolder", () => {
	test("keeps every path inside the attached folder", async () => {
		const { root } = setup();

		expect(await resolveInsideFolder(root, "/q3.md")).toBe(
			join(root, "q3.md"),
		);
		expect(await resolveInsideFolder(root, "sub/new.md")).toBe(
			join(root, "sub", "new.md"),
		);
		// a leading slash means the folder's top, not the machine's
		expect(await resolveInsideFolder(root, "/etc/passwd")).toBe(
			join(root, "etc", "passwd"),
		);
	});

	test("refuses a path that climbs out", async () => {
		const { root } = setup();

		await expect(
			resolveInsideFolder(root, "../secret/key.txt"),
		).rejects.toThrow("outside the attached folder");
		await expect(
			resolveInsideFolder(root, "sub/../../secret"),
		).rejects.toThrow("outside the attached folder");
	});

	test("refuses a link that leads out, and anything under it", async () => {
		const { root, outside } = setup();
		symlinkSync(outside, join(root, "escape"));

		await expect(resolveInsideFolder(root, "/escape")).rejects.toThrow(
			"leads outside",
		);
		await expect(
			resolveInsideFolder(root, "/escape/key.txt"),
		).rejects.toThrow("leads outside");
		await expect(
			resolveInsideFolder(root, "/escape/new/file.txt"),
		).rejects.toThrow("leads outside");
	});

	test("refuses the hidden .git folder", async () => {
		const { root } = setup();

		await expect(resolveInsideFolder(root, "/.git/config")).rejects.toThrow(
			"not available",
		);
	});
});

describe("hidden entries", () => {
	test("hide .git however its name is written", () => {
		for (const name of [
			".git",
			".GIT",
			".Git",
			".git.",
			".git ",
			".git. .",
		]) {
			expect(isHiddenName(name)).toBe(true);
		}
		for (const name of ["git", ".github", ".gitignore", "a.git"]) {
			expect(isHiddenName(name)).toBe(false);
		}
	});

	test("refuse .git by another case, and a link that leads into it", async () => {
		const { root } = setup();
		await expect(
			resolveInsideFolder(root, ".GIT/hooks/pre-commit"),
		).rejects.toThrow("not available");
		symlinkSync(join(root, ".git"), join(root, "innocent"));
		await expect(
			resolveInsideFolder(root, "innocent/config"),
		).rejects.toThrow("not available");
		await expect(resolveInsideFolder(root, "innocent")).rejects.toThrow(
			"not available",
		);
	});
});

describe("createLocalFs", () => {
	test("lists entries as the explorer has them, hiding .git", async () => {
		const { root, fs } = setup();

		const entries = await fs.list(root, "/");

		expect(entries.map((entry) => entry.path).sort()).toEqual([
			"/q3.md",
			"/sub",
		]);
		expect(entries.find((entry) => entry.path === "/sub")?.type).toBe(
			"directory",
		);
		expect(entries.find((entry) => entry.path === "/q3.md")?.size).toBe(4);
	});

	test("reads, writes, and makes the folders a write needs", async () => {
		const { root, fs } = setup();

		await fs.write(
			root,
			"/deep/er/todo.md",
			new TextEncoder().encode("- ship"),
		);

		expect(readFileSync(join(root, "deep", "er", "todo.md"), "utf8")).toBe(
			"- ship",
		);
		expect(new TextDecoder().decode(await fs.read(root, "/q3.md"))).toBe(
			"# Q3",
		);
	});

	test("never writes, moves, or deletes the attached folder itself", async () => {
		const { root, fs } = setup();

		await expect(fs.remove(root, "/")).rejects.toThrow("cannot be changed");
		await expect(fs.move(root, "/", "/other")).rejects.toThrow(
			"cannot be changed",
		);
		await expect(fs.write(root, "", new Uint8Array([1]))).rejects.toThrow(
			"cannot be changed",
		);
	});

	test("deletes to the trash, never in place", async () => {
		const { root, fs, trash } = setup();

		await fs.remove(root, "/q3.md");

		expect(trash).toHaveBeenCalledWith(join(root, "q3.md"));
		expect(existsSync(join(root, "q3.md"))).toBe(true);
	});

	test("moves within the folder, refusing a taken destination", async () => {
		const { root, fs } = setup();
		writeFileSync(join(root, "taken.md"), "x");

		await expect(fs.move(root, "/q3.md", "/taken.md")).rejects.toThrow(
			"already exists",
		);
		await fs.move(root, "/q3.md", "/sub/q3.md");

		expect(existsSync(join(root, "sub", "q3.md"))).toBe(true);
		expect(existsSync(join(root, "q3.md"))).toBe(false);
	});

	test("makes a new file only where nothing is", async () => {
		const { root, fs } = setup();

		await fs.createFile(root, "/new.md");

		await expect(fs.createFile(root, "/new.md")).rejects.toThrow(
			"already exists",
		);
	});

	test("reports nothing at a path as null", async () => {
		const { root, fs } = setup();

		expect(await fs.stat(root, "/missing.md")).toBeNull();
		expect(await fs.stat(root, "/q3.md")).toMatchObject({ name: "q3.md" });
	});

	test("opens and reveals through the system, inside the folder only", async () => {
		const { root, fs, openPath, reveal } = setup();

		await fs.open(root, "/q3.md");
		await fs.reveal(root, "/sub");

		expect(openPath).toHaveBeenCalledWith(join(root, "q3.md"));
		expect(reveal).toHaveBeenCalledWith(join(root, "sub"));
		await expect(fs.open(root, "../secret/key.txt")).rejects.toThrow(
			"outside",
		);
	});

	test("asks before opening anything that would run", async () => {
		const { root, fs, openPath, confirmRun } = setup();
		writeFileSync(join(root, "run.command"), "echo hi");
		writeFileSync(join(root, "tool"), "#!/bin/sh");
		chmodSync(join(root, "tool"), 0o755);

		await expect(fs.open(root, "/run.command")).rejects.toThrow(
			"chose not to open",
		);
		await expect(fs.open(root, "/tool")).rejects.toThrow(
			"chose not to open",
		);
		expect(openPath).not.toHaveBeenCalled();
		expect(confirmRun).toHaveBeenCalledWith(join(root, "run.command"));

		confirmRun.mockResolvedValueOnce(true);
		await fs.open(root, "/run.command");
		expect(openPath).toHaveBeenCalledWith(join(root, "run.command"));
		// a document opens without asking
		confirmRun.mockClear();
		await fs.open(root, "/q3.md");
		expect(confirmRun).not.toHaveBeenCalled();
	});

	test("knows what would run", () => {
		const file = { mode: 0o644, isFile: () => true };
		const directory = { mode: 0o755, isFile: () => false };
		for (const name of [
			"a.app",
			"a.EXE",
			"a.bat",
			"a.lnk",
			"a.sh",
			"a.desktop",
		]) {
			expect(isRunnable(`/x/${name}`, file)).toBe(true);
		}
		expect(isRunnable("/x/Thing.app", directory)).toBe(true);
		expect(isRunnable("/x/notes.md", file)).toBe(false);
		expect(isRunnable("/x/folder", directory)).toBe(false);
		expect(isRunnable("/x/bin", { ...file, mode: 0o755 })).toBe(true);
		// Windows ignores trailing dots and spaces and a stream suffix
		for (const name of ["run.bat.", "run.bat ", "run.exe:zone"]) {
			expect(isRunnable(`/x/${name}`, file)).toBe(true);
		}
		// a document on a drive that marks every file executable
		expect(isRunnable("/x/notes.md", { ...file, mode: 0o777 })).toBe(false);
		expect(isRunnable("/x/run.sh", { ...file, mode: 0o777 })).toBe(true);
	});
});

describe("folder grants", () => {
	test("attach a folder once per room, with a name of its own", () => {
		const folder = mkdtempSync(join(tmpdir(), "grants-"));
		const grants = openFolderGrants(folder);

		grants.add("p1", "room-1", ["/a/notes", "/b/notes"]);
		const after = grants.add("p1", "room-1", ["/a/notes"]);

		expect(after.map((grant) => grant.name)).toEqual([
			"notes",
			"notes (2)",
		]);
		expect(grants.list("p1", "room-2")).toEqual([]);
		expect(grants.list("p2", "room-1")).toEqual([]);
	});

	test("are saved, and read back on the next launch", () => {
		const folder = mkdtempSync(join(tmpdir(), "grants-"));
		const [grant] = openFolderGrants(folder).add("p1", "room-1", [
			"/a/notes",
		]);

		const reopened = openFolderGrants(folder);

		expect(reopened.get("p1", "room-1", grant?.id ?? "")).toEqual(grant);
		expect(existsSync(join(folder, `${GRANTS_FILE_NAME}.tmp`))).toBe(false);
	});

	test("detach one folder, or every folder on a forgotten server", () => {
		const folder = mkdtempSync(join(tmpdir(), "grants-"));
		const grants = openFolderGrants(folder);
		const [first] = grants.add("p1", "room-1", ["/a/notes", "/a/code"]);
		grants.add("p1", "room-2", ["/a/other"]);

		expect(grants.remove("p1", "room-1", first?.id ?? "")).toHaveLength(1);
		expect(grants.forgetServer("p1")).toHaveLength(2);
		expect(grants.list("p1", "room-1")).toEqual([]);
	});

	test("read a damaged file as no grants, keeping what is well formed", () => {
		expect(parseGrantsFile("not json")).toEqual({
			version: 1,
			servers: {},
		});
		expect(
			parseGrantsFile(
				JSON.stringify({
					version: 1,
					servers: {
						p1: {
							"room-1": [
								{ id: "g1", name: "notes", path: "/a/notes" },
								{ id: "", name: "bad", path: "/x" },
								"junk",
							],
						},
					},
				}),
			).servers,
		).toEqual({
			p1: { "room-1": [{ id: "g1", name: "notes", path: "/a/notes" }] },
		});
	});
});
