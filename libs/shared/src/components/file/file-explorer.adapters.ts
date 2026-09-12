import type { FileItem, FileMode } from "./file.types";
import {
	ensureDirectoryPath,
	mapStorageEntriesToFileItems,
} from "./file-explorer.utils";

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
	/** Run a follow-up Pixel after the upload lands, e.g. to push it onward. */
	run(pixel: string): Promise<unknown>;
}

/** What a mode supports. Drives which affordances render at all. */
export interface FileExplorerCapabilities {
	/** Server-side search. STORAGE filters client-side instead. */
	search: boolean;
	/** Rename / move / copy / create. */
	mutate: boolean;
	upload: boolean;
	download: boolean;
	/** Independent of `mutate` — STORAGE supports delete but not the rest. */
	delete: boolean;
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
	/**
	 * Read a file's contents. `base64` selects the `*Base64` reactor, for
	 * bytes that are not text (images, PDFs, pptx).
	 *
	 * Callers must still decide *whether* to run it: an INSIGHT read before
	 * the insight exists has to emit no Pixel at all, which is the caller's
	 * gate, not the builder's.
	 */
	read(path: string, base64?: boolean): string;
	/**
	 * Overwrite a file's contents. `base64` selects the `*Base64` reactor, for
	 * bytes that are not text (a re-serialised pptx) — the same switch
	 * {@link read} takes.
	 */
	save(path: string, content: string, base64?: boolean): string;
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
 * The reactor a family uses for each operation.
 *
 * Spelled out per family rather than assembled from a family word. The names
 * are close enough to look derivable and are not: `Rename*Asset`,
 * `Copy*Asset`, `Download*Asset` and `Unzip*AssetFile` are singular while
 * `Browse*Assets`, `Search*Assets`, `Delete*Assets`, `Get*Assets`,
 * `Save*Assets` and `New*Assets*` are plural. Writing them out also means a
 * reactor name can be found by searching for it, which an interpolated
 * `` `Browse${family.name}Assets` `` could not.
 */
interface AssetReactors {
	browse: string;
	search: string;
	rename: string;
	copy: string;
	remove: string;
	read: string;
	/** The `*Base64` read, for bytes that are not text. */
	readBase64: string;
	save: string;
	/** The `*Base64` write, for bytes that are not text. */
	saveBase64: string;
	download: string;
	createFile: string;
	createDirectory: string;
	unzip: string;
}

/**
 * The four asset families (`APP`, `ENGINE`, `INSIGHT`, `USER`) share one
 * reactor argument shape and differ only in their reactor names and the scope
 * argument. Argument order and quoting are inconsistent across the reactors
 * themselves, so both a leading and a trailing form are kept.
 */
interface AssetFamily {
	reactors: AssetReactors;
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
		delete: true,
	},
	browse: (path) =>
		`${family.reactors.browse}(filePath=["${path}"]${family.scopeTail});`,
	search: (path, term) =>
		`${family.reactors.search}(filePath=["${path}"]${family.scopeTail}, search=["${term}"]);`,
	rename: (oldPath, newPath) =>
		`${family.reactors.rename}(${family.scopeLead}filePath=["${oldPath}"], newValue=["${newPath}"]);`,
	copy: (oldPath, newPath) =>
		`${family.reactors.copy}(${family.scopeLeadBare}filePath="${oldPath}", newValue="${newPath}");`,
	remove: (path) =>
		`${family.reactors.remove}(${family.scopeLead}filePath=["${path}"]);`,
	download: (path) =>
		`${family.reactors.download}(${family.scopeLead}filePath=[${JSON.stringify(path)}]);`,
	// read/save/download quote the path with JSON.stringify; browse/search/
	// rename/copy/remove/create/unzip above still interpolate it raw, which
	// breaks on a path containing a quote or backslash. Identical output for
	// every other path, so converting the rest is a safe follow-up rather
	// than part of this change.
	read: (path, base64 = false) =>
		`${base64 ? family.reactors.readBase64 : family.reactors.read}(filePath=[${JSON.stringify(path)}]${family.scopeTail});`,
	save: (path, content, base64 = false) =>
		`${base64 ? family.reactors.saveBase64 : family.reactors.save}(${family.scopeLead}filePath=[${JSON.stringify(path)}], content=["<encode>${content}</encode>"]);`,
	createFile: (path) =>
		`${family.reactors.createFile}(${family.scopeLead}filePath=["${path}"]);`,
	createDirectory: (path) =>
		`${family.reactors.createDirectory}(${family.scopeLead}filePath=["${path}"]);`,
	// deliberately unterminated — this reactor has always been run without a
	// trailing semicolon
	unzip: (path) =>
		`${family.reactors.unzip}(${family.scopeLead}filePath=["${path}"])`,
	upload: family.upload,
	mapEntries: (raw) => (Array.isArray(raw) ? (raw as FileItem[]) : []),
});

/**
 * Build the adapter for a storage bucket.
 *
 * Buckets support browse, upload (push), and delete. The reactor family has
 * no rename, copy, create, search, or download/unzip, so those builders throw
 * rather than returning an empty Pixel that would silently no-op.
 *
 * @param storage - The bucket's engine id.
 * @return An adapter over `ListStoragePathDetails` / `PushToStorage` /
 * `DeleteFromStorage`.
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
			upload: true,
			download: false,
			delete: true,
		},
		browse: (path) =>
			`ListStoragePathDetails(storage=["${storage}"], storagePath=["${path}"]);`,
		read: unsupported("read"),
		save: unsupported("save"),
		search: unsupported("search"),
		rename: unsupported("rename"),
		copy: unsupported("copy"),
		remove: (path) =>
			`Storage(storage = "${storage}") | DeleteFromStorage(storagePath='${path}', leaveFolderStructure=false);`,
		download: unsupported("download"),
		createFile: unsupported("create"),
		createDirectory: unsupported("create"),
		unzip: unsupported("unzip"),
		// buckets have no direct "upload into the tree" reactor — the file is
		// first HTTP-uploaded to a server-side scratch location (the same
		// endpoint every other family's upload goes through) to get a
		// `fileLocation`, then pushed into the bucket from there.
		upload: async (actions, path, files) => {
			const response = await actions.uploadInsight(path, files);
			const uploaded = response?.data || [];

			for (const file of uploaded) {
				const fileLocation = file.fileLocation.replace(/\\/g, "/");
				const destPath = `${ensureDirectoryPath(path)}${file.fileName}`;
				await actions.run(
					`Storage(storage = "${storage}") | PushToStorage(storagePath='${destPath}', filePath='${fileLocation}', metadata=[]);`,
				);
			}

			return response;
		},
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
			reactors: {
				browse: "BrowseAppAssets",
				search: "SearchAppAssets",
				rename: "RenameAppAsset",
				copy: "CopyAppAsset",
				remove: "DeleteAppAssets",
				read: "GetAppAssets",
				readBase64: "GetAppAssetsBase64",
				save: "SaveAppAssets",
				saveBase64: "SaveAppAssetsBase64",
				download: "DownloadAppAsset",
				createFile: "NewAppAssetsFile",
				createDirectory: "NewAppAssetsDirectory",
				unzip: "UnzipAppAssetFile",
			},
			scopeLead: `project=["${mode.app}"], `,
			scopeTail: `, project=["${mode.app}"]`,
			scopeLeadBare: `project="${mode.app}", `,
			upload: (actions, path, files) =>
				actions.uploadApp(mode.app, path, files),
		});
	}

	if (mode.type === "ENGINE") {
		return createAssetAdapter({
			reactors: {
				browse: "BrowseEngineAssets",
				search: "SearchEngineAssets",
				rename: "RenameEngineAsset",
				copy: "CopyEngineAsset",
				remove: "DeleteEngineAssets",
				read: "GetEngineAssets",
				readBase64: "GetEngineAssetsBase64",
				save: "SaveEngineAssets",
				saveBase64: "SaveEngineAssetsBase64",
				download: "DownloadEngineAsset",
				createFile: "NewEngineAssetsFile",
				createDirectory: "NewEngineAssetsDirectory",
				unzip: "UnzipEngineAssetFile",
			},
			scopeLead: `engine=["${mode.engine}"], `,
			scopeTail: `, engine=["${mode.engine}"]`,
			scopeLeadBare: `engine="${mode.engine}", `,
			upload: (actions, path, files) =>
				actions.uploadEngine(mode.engine, path, files),
		});
	}

	if (mode.type === "INSIGHT") {
		return createAssetAdapter({
			reactors: {
				browse: "BrowseInsightAssets",
				search: "SearchInsightAssets",
				rename: "RenameInsightAsset",
				copy: "CopyInsightAsset",
				remove: "DeleteInsightAssets",
				read: "GetInsightAssets",
				readBase64: "GetInsightAssetsBase64",
				save: "SaveInsightAssets",
				saveBase64: "SaveInsightAssetsBase64",
				download: "DownloadInsightAsset",
				createFile: "NewInsightAssetsFile",
				createDirectory: "NewInsightAssetsDirectory",
				unzip: "UnzipInsightAssetFile",
			},
			scopeLead: "",
			scopeTail: "",
			scopeLeadBare: "",
			upload: (actions, path, files) =>
				actions.uploadInsight(path, files),
		});
	}

	if (mode.type === "USER") {
		return createAssetAdapter({
			reactors: {
				browse: "BrowseUserAssets",
				search: "SearchUserAssets",
				rename: "RenameUserAsset",
				copy: "CopyUserAsset",
				remove: "DeleteUserAssets",
				read: "GetUserAssets",
				readBase64: "GetUserAssetsBase64",
				save: "SaveUserAssets",
				saveBase64: "SaveUserAssetsBase64",
				download: "DownloadUserAsset",
				createFile: "NewUserAssetsFile",
				createDirectory: "NewUserAssetsDirectory",
				unzip: "UnzipUserAssetFile",
			},
			scopeLead: "",
			scopeTail: "",
			scopeLeadBare: "",
			upload: (actions, path, files) => actions.uploadUser(path, files),
		});
	}

	return createStorageAdapter(mode.storage);
};
