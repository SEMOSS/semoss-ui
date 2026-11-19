import type { Dirent, Stats } from "node:fs";
import {
	cp,
	lstat,
	mkdir,
	readdir,
	readFile,
	realpath,
	rename,
	stat,
	writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import type { LocalFileEntry } from "../../../contract/local-folders";

/** The largest file a read hands the page. */
export const MAX_READ_BYTES = 50 * 1024 * 1024;

/**
 * Entries a folder never shows and nothing may touch. `.git` holds hooks and
 * config that run code on the user's next git command.
 */
const HIDDEN_NAMES: ReadonlySet<string> = new Set([".git"]);

/**
 * Whether an entry's name is hidden, however it is written: any case (macOS
 * and Windows ignore it), any Unicode form, and with the trailing dots and
 * spaces Windows drops (`.git.` is `.git` there).
 *
 * @param name - One path segment.
 * @returns True for a hidden entry.
 */
export const isHiddenName = (name: string): boolean =>
	HIDDEN_NAMES.has(
		name
			.normalize("NFC")
			.toLowerCase()
			.replace(/[. ]+$/, ""),
	);

/**
 * Whether any segment of a path inside a folder is hidden.
 *
 * @param folder - The folder's real path.
 * @param path - A resolved path inside it.
 * @returns True when the path is, or is under, a hidden entry.
 */
const isUnderHiddenName = (folder: string, path: string): boolean =>
	relative(folder, path).split(sep).some(isHiddenName);

/**
 * Files the system would run rather than show when opened: apps, scripts,
 * installers and shortcuts on macOS, Windows and Linux.
 */
const RUNNABLE_EXTENSIONS: ReadonlySet<string> = new Set([
	".app",
	".command",
	".tool",
	".terminal",
	".workflow",
	".action",
	".scpt",
	".applescript",
	".pkg",
	".mpkg",
	".sh",
	".bash",
	".zsh",
	".csh",
	".ksh",
	".fish",
	".py",
	".pyw",
	".rb",
	".pl",
	".php",
	".jar",
	".exe",
	".com",
	".bat",
	".cmd",
	".msi",
	".msix",
	".appx",
	".ps1",
	".psm1",
	".vbs",
	".vbe",
	".js",
	".jse",
	".wsf",
	".wsh",
	".hta",
	".scr",
	".cpl",
	".pif",
	".lnk",
	".url",
	".reg",
	".inf",
	".desktop",
	".appimage",
	".run",
	".webloc",
	".inetloc",
	".fileloc",
]);

/**
 * Documents a file marked executable still only shows: FAT, exFAT and many
 * network drives mark every file executable, and these never run.
 */
const DOCUMENT_EXTENSIONS: ReadonlySet<string> = new Set([
	".txt",
	".md",
	".markdown",
	".csv",
	".tsv",
	".json",
	".xml",
	".yaml",
	".yml",
	".log",
	".pdf",
	".rtf",
	".doc",
	".docx",
	".xls",
	".xlsx",
	".ppt",
	".pptx",
	".odt",
	".ods",
	".odp",
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".bmp",
	".tif",
	".tiff",
	".heic",
	".svg",
	".mp3",
	".wav",
	".m4a",
	".mp4",
	".mov",
	".webm",
]);

/**
 * A name's extension as the system reads it: lower case, without the trailing
 * dots and spaces and the `:stream` suffix Windows ignores (`run.bat.` and
 * `run.bat:x` are `run.bat` there).
 *
 * @param path - The entry.
 * @returns Its extension, such as `.bat`, or empty for none.
 */
const extensionOf = (path: string): string =>
	extname(
		basename(path)
			.replace(/:.*$/, "")
			.replace(/[. ]+$/, ""),
	).toLowerCase();

/**
 * Whether opening an entry would run something: a runnable kind of file or
 * bundle, or a file marked executable that is not a plain document.
 *
 * @param path - The entry's real path.
 * @param stats - What it is.
 * @returns True when opening it should be confirmed first.
 */
export const isRunnable = (
	path: string,
	stats: Pick<Stats, "mode" | "isFile">,
): boolean => {
	const extension = extensionOf(path);
	return (
		RUNNABLE_EXTENSIONS.has(extension) ||
		(stats.isFile() &&
			(stats.mode & 0o111) !== 0 &&
			!DOCUMENT_EXTENSIONS.has(extension))
	);
};

/** What the file calls need from the system. */
export interface LocalFsSystem {
	/** Move a path to the system's trash. */
	trash: (path: string) => Promise<void>;
	/** Open a path with its app; resolves to an error message, empty on success. */
	openPath: (path: string) => Promise<string>;
	/** Show a path in the file manager. */
	reveal: (path: string) => void;
	/**
	 * Ask the user, in the main process, before opening something that would
	 * run; resolves to true to open it.
	 */
	confirmRun: (path: string) => Promise<boolean>;
}

/** File calls inside one attached folder. Every path is inside it, `/` being it. */
export interface LocalFs {
	list(root: string, path: string): Promise<LocalFileEntry[]>;
	stat(root: string, path: string): Promise<LocalFileEntry | null>;
	read(root: string, path: string): Promise<Uint8Array>;
	write(root: string, path: string, bytes: Uint8Array): Promise<void>;
	createFile(root: string, path: string): Promise<void>;
	createDirectory(root: string, path: string): Promise<void>;
	move(root: string, from: string, to: string): Promise<void>;
	copy(root: string, from: string, to: string): Promise<void>;
	remove(root: string, path: string): Promise<void>;
	open(root: string, path: string): Promise<void>;
	reveal(root: string, path: string): Promise<void>;
}

/**
 * Whether a path is a folder or inside it.
 *
 * @param folder - A resolved folder.
 * @param path - A resolved path.
 * @returns True for the folder itself or anything under it.
 */
export const isInsideFolder = (folder: string, path: string): boolean =>
	path === folder ||
	path.startsWith(folder.endsWith(sep) ? folder : `${folder}${sep}`);

/**
 * Whether a file error means nothing is there.
 *
 * @param error - The error.
 * @returns True for a missing path.
 */
const isMissing = (error: unknown): boolean =>
	(error as NodeJS.ErrnoException)?.code === "ENOENT";

/**
 * A path inside an attached folder, as the page names it, on the machine.
 *
 * The path is taken relative to the folder however it is written: leading
 * slashes are dropped, `..` cannot climb out, and an absolute path from
 * another drive is refused. Symbolic links are followed as far as the path
 * exists, and refused when they lead out of the folder, so the page reaches
 * nothing the user did not attach.
 *
 * @param root - The attached folder's real path.
 * @param path - The path inside it, such as `/notes/a.md`.
 * @returns The path on the machine.
 * @throws Error for a path outside the folder, or one under a hidden entry.
 */
export const resolveInsideFolder = async (
	root: string,
	path: string,
): Promise<string> => {
	if (typeof path !== "string" || path.includes("\0")) {
		throw new Error("That path is not valid");
	}
	const rootReal = await realpath(root);
	const target = resolve(rootReal, path.replace(/^[/\\]+/, ""));
	if (!isInsideFolder(rootReal, target)) {
		throw new Error("That path is outside the attached folder");
	}
	if (isUnderHiddenName(rootReal, target)) {
		throw new Error("That path is not available");
	}

	// the nearest part of the path that exists, links followed, has to be
	// inside the folder too, and not lead into a hidden entry
	let probe = target;
	for (;;) {
		try {
			const real = await realpath(probe);
			if (!isInsideFolder(rootReal, real)) {
				throw new Error("That path leads outside the attached folder");
			}
			if (isUnderHiddenName(rootReal, real)) {
				throw new Error("That path is not available");
			}
			break;
		} catch (error) {
			if (!isMissing(error)) throw error;
			const parent = dirname(probe);
			if (parent === probe) break;
			probe = parent;
		}
	}
	return target;
};

/**
 * Like {@link resolveInsideFolder}, for a call that changes something: the
 * attached folder itself is never written, moved, or deleted.
 *
 * @param root - The attached folder's real path.
 * @param path - The path inside it.
 * @returns The path on the machine.
 */
const resolveChangeable = async (
	root: string,
	path: string,
): Promise<string> => {
	const target = await resolveInsideFolder(root, path);
	if (target === (await realpath(root))) {
		throw new Error(
			"The attached folder itself cannot be changed; detach it instead",
		);
	}
	return target;
};

/**
 * An entry for the page.
 *
 * @param rootReal - The attached folder's real path.
 * @param target - The entry on the machine.
 * @param stats - Its stats.
 * @returns The entry, with its path inside the folder.
 */
const toEntry = (
	rootReal: string,
	target: string,
	stats: Stats,
): LocalFileEntry => {
	const inside = relative(rootReal, target).split(sep).join("/");
	return {
		name: inside.split("/").pop() || "",
		path: `/${inside}`,
		...(stats.isDirectory() ? { type: "directory" as const } : {}),
		...(stats.isFile() ? { size: stats.size } : {}),
		lastModified: stats.mtime.toISOString(),
	};
};

/**
 * The file calls the page makes in attached folders.
 *
 * @param system - The trash, opening, and revealing, from Electron's `shell`.
 * @returns The calls.
 */
export const createLocalFs = (system: LocalFsSystem): LocalFs => ({
	list: async (root, path) => {
		const rootReal = await realpath(root);
		const directory = await resolveInsideFolder(root, path);
		let dirents: Dirent[];
		try {
			dirents = await readdir(directory, { withFileTypes: true });
		} catch (error) {
			if (isMissing(error)) throw new Error(`No folder at ${path}`);
			throw error;
		}
		const entries: LocalFileEntry[] = [];
		for (const dirent of dirents) {
			if (isHiddenName(dirent.name)) continue;
			const target = resolve(directory, dirent.name);
			try {
				// a link is listed as what it leads to; one leading out is shown,
				// but every call on it is refused
				entries.push(toEntry(rootReal, target, await stat(target)));
			} catch {
				// a broken link, or one that cannot be read: leave it out
			}
		}
		return entries;
	},
	stat: async (root, path) => {
		const target = await resolveInsideFolder(root, path);
		try {
			return toEntry(await realpath(root), target, await stat(target));
		} catch (error) {
			if (isMissing(error)) return null;
			throw error;
		}
	},
	read: async (root, path) => {
		const target = await resolveInsideFolder(root, path);
		const stats = await stat(target);
		if (stats.isDirectory()) throw new Error(`${path} is a folder`);
		if (stats.size > MAX_READ_BYTES) {
			throw new Error(
				`${path} is too large to open here (${stats.size} bytes)`,
			);
		}
		return new Uint8Array(await readFile(target));
	},
	write: async (root, path, bytes) => {
		const target = await resolveChangeable(root, path);
		const existing = await lstat(target).catch(() => null);
		if (existing?.isDirectory()) throw new Error(`${path} is a folder`);
		await mkdir(dirname(target), { recursive: true });
		await writeFile(target, bytes);
	},
	createFile: async (root, path) => {
		const target = await resolveChangeable(root, path);
		await mkdir(dirname(target), { recursive: true });
		await writeFile(target, new Uint8Array(), { flag: "wx" }).catch(
			(error) => {
				if ((error as NodeJS.ErrnoException).code === "EEXIST") {
					throw new Error(`${path} already exists`);
				}
				throw error;
			},
		);
	},
	createDirectory: async (root, path) => {
		const target = await resolveInsideFolder(root, path);
		await mkdir(target, { recursive: true });
	},
	move: async (root, from, to) => {
		const source = await resolveChangeable(root, from);
		const destination = await resolveChangeable(root, to);
		if (await lstat(destination).catch(() => null)) {
			throw new Error(`${to} already exists`);
		}
		if (isInsideFolder(source, destination)) {
			throw new Error("A folder cannot be moved into itself");
		}
		await mkdir(dirname(destination), { recursive: true });
		await rename(source, destination);
	},
	copy: async (root, from, to) => {
		const source = await resolveInsideFolder(root, from);
		const destination = await resolveChangeable(root, to);
		if (await lstat(destination).catch(() => null)) {
			throw new Error(`${to} already exists`);
		}
		if (isInsideFolder(source, destination)) {
			throw new Error("A folder cannot be copied into itself");
		}
		await cp(source, destination, {
			recursive: true,
			errorOnExist: true,
			force: false,
			// a link is copied as a link, never followed out of the folder
			dereference: false,
			verbatimSymlinks: true,
		});
	},
	remove: async (root, path) => {
		const target = await resolveChangeable(root, path);
		await lstat(target).catch((error) => {
			if (isMissing(error)) throw new Error(`Nothing exists at ${path}`);
			throw error;
		});
		await system.trash(target);
	},
	open: async (root, path) => {
		// the file a link leads to, which is what the system opens
		const target = await realpath(await resolveInsideFolder(root, path));
		if (
			isRunnable(target, await stat(target)) &&
			!(await system.confirmRun(target))
		) {
			throw new Error("The user chose not to open it");
		}
		const message = await system.openPath(target);
		if (message) throw new Error(message);
	},
	reveal: async (root, path) => {
		system.reveal(await resolveInsideFolder(root, path));
	},
});
