import type { FileItem, FileMode } from "./file.types";
import { mapStorageEntriesToFileItems } from "./file-explorer.utils";

/** Response shape shared by every `insight.actions.upload*` call. */
export interface FileUploadResponse {
	response: Response;
	data: {
		fileName: string;
		fileLocation: string;
	}[];
}

/**
 * The subset of `useInsight().actions` the adapters need. Declared
 * structurally because the SDK exposes its actions as an object literal on the
 * insight store rather than a named type.
 */
export interface FileExplorerUploadActions {
	uploadApp(
		appId: string,
		path: string,
		files: File | File[],
	): Promise<FileUploadResponse>;
	uploadEngine(
		engineId: string,
		path: string,
		files: File | File[],
	): Promise<FileUploadResponse>;
	uploadInsight(
		path: string,
		files: File | File[],
	): Promise<FileUploadResponse>;
	uploadUser(path: string, files: File | File[]): Promise<FileUploadResponse>;
}

/** What a mode supports. Drives which affordances render at all. */
export interface FileExplorerCapabilities {
	/** Server-side search. STORAGE filters client-side instead. */
	search: boolean;
	/** Rename / move / copy / delete / create. */
	mutate: boolean;
	upload: boolean;
	download: boolean;
}

/**
 * Everything mode-specific about an asset tree: what it can do, and the Pixel
 * for each operation. One implementation per `FileMode`, so the explorer
 * components never branch on `mode.type`.
 */
export interface FileExplorerAdapter {
	capabilities: FileExplorerCapabilities;
	/** List the direct children of a directory. */
	browse(path: string): string;
	/** Search under a directory (`path` empty means the whole tree). */
	search(path: string, term: string): string;
	/** Move or rename — the same reactor for both. */
	rename(oldPath: string, newPath: string): string;
	copy(oldPath: string, newPath: string): string;
	remove(path: string): string;
	/** Resolves to a file key, not the bytes. */
	download(path: string): string;
	/** `path` is the full destination path, name included. */
	createFile(path: string): string;
	/** `path` is the full destination path, name included. */
	createDirectory(path: string): string;
	unzip(path: string): string;
	upload(
		actions: FileExplorerUploadActions,
		path: string,
		files: File[],
	): Promise<FileUploadResponse>;
	/** Normalize a raw list response into `FileItem`s. */
	mapEntries(raw: unknown): FileItem[];
}

/**
 * The four asset families (`APP`, `ENGINE`, `INSIGHT`, `USER`) share one
 * reactor naming scheme and differ only in the family word and the scope
 * argument. Argument order and quoting are inconsistent across the reactors
 * themselves, so both a leading and a trailing form are kept.
 */
interface AssetFamily {
	/** The word inside the reactor name, e.g. `App` in `BrowseAppAssets`. */
	name: "App" | "Engine" | "Insight" | "User";
	/** Bracketed leading scope, e.g. `project=["p1"], ` — may be empty. */
	scopeLead: string;
	/** Bracketed trailing scope, e.g. `, project=["p1"]` — may be empty. */
	scopeTail: string;
	/** Bare-quoted leading scope for the `Copy*Asset` reactors. */
	scopeLeadBare: string;
	upload(
		actions: FileExplorerUploadActions,
		path: string,
		files: File[],
	): Promise<FileUploadResponse>;
}

/**
 * Build the adapter for one asset family.
 *
 * @param family - The family's reactor word, scope fragments, and uploader.
 * @return A fully capable adapter over that family's reactors.
 */
const createAssetAdapter = (family: AssetFamily): FileExplorerAdapter => ({
	capabilities: {
		search: true,
		mutate: true,
		upload: true,
		download: true,
	},
	browse: (path) =>
		`Browse${family.name}Assets(filePath=["${path}"]${family.scopeTail});`,
	search: (path, term) =>
		`Search${family.name}Assets(filePath=["${path}"]${family.scopeTail}, search=["${term}"]);`,
	rename: (oldPath, newPath) =>
		`Rename${family.name}Asset(${family.scopeLead}filePath=["${oldPath}"], newValue=["${newPath}"]);`,
	copy: (oldPath, newPath) =>
		`Copy${family.name}Asset(${family.scopeLeadBare}filePath="${oldPath}", newValue="${newPath}");`,
	remove: (path) =>
		`Delete${family.name}Assets(${family.scopeLead}filePath=["${path}"]);`,
	download: (path) =>
		`Download${family.name}Asset(${family.scopeLead}filePath=["${path}"]);`,
	createFile: (path) =>
		`New${family.name}AssetsFile(${family.scopeLead}filePath=["${path}"]);`,
	createDirectory: (path) =>
		`New${family.name}AssetsDirectory(${family.scopeLead}filePath=["${path}"]);`,
	// deliberately unterminated — this reactor has always been run without a
	// trailing semicolon
	unzip: (path) =>
		`Unzip${family.name}AssetFile(${family.scopeLead}filePath=["${path}"])`,
	upload: family.upload,
	mapEntries: (raw) => (Array.isArray(raw) ? (raw as FileItem[]) : []),
});

/**
 * Build the adapter for a storage bucket.
 *
 * Buckets are browse-only: the reactor family has no rename, delete, upload,
 * search, or download, so every mutating builder throws rather than returning
 * an empty Pixel that would silently no-op.
 *
 * @param storage - The bucket's engine id.
 * @return A browse-only adapter.
 */
const createStorageAdapter = (storage: string): FileExplorerAdapter => {
	/**
	 * A builder for something buckets cannot do.
	 *
	 * @param operation - Named in the thrown message.
	 * @return A builder that always throws.
	 */
	const unsupported = (operation: string) => (): never => {
		throw new Error(`Storage assets do not support ${operation}`);
	};

	return {
		capabilities: {
			search: false,
			mutate: false,
			upload: false,
			download: false,
		},
		browse: (path) =>
			`ListStoragePathDetails(storage=["${storage}"], storagePath=["${path}"]);`,
		search: unsupported("search"),
		rename: unsupported("rename"),
		copy: unsupported("copy"),
		remove: unsupported("delete"),
		download: unsupported("download"),
		createFile: unsupported("create"),
		createDirectory: unsupported("create"),
		unzip: unsupported("unzip"),
		upload: unsupported("upload"),
		mapEntries: mapStorageEntriesToFileItems,
	};
};

/**
 * Resolve the adapter for a file mode.
 *
 * @param mode - The asset tree being browsed.
 * @return The adapter carrying that mode's capabilities and Pixels.
 */
export const getFileExplorerAdapter = (mode: FileMode): FileExplorerAdapter => {
	if (mode.type === "APP") {
		return createAssetAdapter({
			name: "App",
			scopeLead: `project=["${mode.app}"], `,
			scopeTail: `, project=["${mode.app}"]`,
			scopeLeadBare: `project="${mode.app}", `,
			upload: (actions, path, files) =>
				actions.uploadApp(mode.app, path, files),
		});
	}

	if (mode.type === "ENGINE") {
		return createAssetAdapter({
			name: "Engine",
			scopeLead: `engine=["${mode.engine}"], `,
			scopeTail: `, engine=["${mode.engine}"]`,
			scopeLeadBare: `engine="${mode.engine}", `,
			upload: (actions, path, files) =>
				actions.uploadEngine(mode.engine, path, files),
		});
	}

	if (mode.type === "INSIGHT") {
		return createAssetAdapter({
			name: "Insight",
			scopeLead: "",
			scopeTail: "",
			scopeLeadBare: "",
			upload: (actions, path, files) =>
				actions.uploadInsight(path, files),
		});
	}

	if (mode.type === "USER") {
		return createAssetAdapter({
			name: "User",
			scopeLead: "",
			scopeTail: "",
			scopeLeadBare: "",
			upload: (actions, path, files) => actions.uploadUser(path, files),
		});
	}

	return createStorageAdapter(mode.storage);
};
