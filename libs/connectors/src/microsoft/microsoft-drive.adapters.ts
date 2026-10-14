import {
	ensureDirectoryPath,
	type FileExplorerAdapter,
	type FileExplorerCapabilities,
	type FileItem,
} from "@semoss/shared";
import type { ConnectorSaveRequest } from "../core/use-connector-saver";
import {
	parseOneDriveFolder,
	parseTeamsFolder,
	readMicrosoftSavedPath,
} from "./microsoft.parsers";
import { MICROSOFT_PIXELS } from "./microsoft.pixels";
import type { MicrosoftDriveItem } from "./microsoft.types";

/** The most items a drive folder, search, or shared list reads. */
const LIST_LIMIT = 200;

/**
 * What a drive offers the file explorer: browsing, and searching when the
 * drive has a search. Saving into the chat's files and the other actions are
 * the host's row actions, not the explorer's own.
 */
const readOnlyCapabilities = (
	canSearch: boolean,
): FileExplorerCapabilities => ({
	search: canSearch,
	// a drive search always covers the whole drive
	searchScope: false,
	mutate: false,
	upload: false,
	download: false,
	delete: false,
});

/**
 * A builder for something the drive does not do from the explorer.
 *
 * @param operation - Named in the thrown message.
 * @return A builder that always throws.
 */
const unsupported = (operation: string) => (): never => {
	throw new Error(`A Microsoft drive does not support ${operation} here`);
};

/** The operations a read-only drive leaves out. */
const READ_ONLY_OPERATIONS = {
	rename: unsupported("rename"),
	copy: unsupported("copy"),
	remove: unsupported("delete"),
	download: unsupported("download"),
	read: unsupported("read"),
	save: unsupported("save"),
	createFile: unsupported("create"),
	createDirectory: unsupported("create"),
	unzip: unsupported("unzip"),
	upload: () =>
		Promise.reject(
			new Error("A Microsoft drive does not support upload here"),
		),
} satisfies Omit<
	FileExplorerAdapter,
	"capabilities" | "browse" | "search" | "mapEntries"
>;

/**
 * An explorer path as the reactors name a folder: no leading or trailing
 * slash, and nothing for the top.
 *
 * @param path - The explorer path, such as `/Reports/2026/`.
 * @return The folder's path, such as `Reports/2026`.
 */
const toDrivePath = (path: string): string | undefined =>
	path.replace(/^\/+|\/+$/g, "") || undefined;

/**
 * The explorer path of an item inside a folder.
 *
 * @param parent - The folder's explorer path.
 * @param name - The item's name.
 * @return The item's path.
 */
const joinPath = (parent: string, name: string): string =>
	`${ensureDirectoryPath(parent || "/")}${name}`;

/**
 * A drive item as an explorer row, carrying the item for the row's actions.
 *
 * @param item - The drive item.
 * @param path - Its explorer path.
 * @return The row.
 */
const toFileItem = (item: MicrosoftDriveItem, path: string): FileItem => ({
	name: item.name,
	path: item.isFolder ? ensureDirectoryPath(path) : path,
	type: item.isFolder ? "directory" : undefined,
	lastModified: item.lastModifiedDateTime,
	data: item,
});

/**
 * Read a listing's items. The explorer maps its empty starting value too, and
 * a response of the wrong shape lists nothing rather than breaking the tree.
 *
 * @param raw - The reactor's output.
 * @param parse - The parser for the listing.
 * @return The items.
 */
const readItems = (
	raw: unknown,
	parse: (raw: unknown) => MicrosoftDriveItem[],
): MicrosoftDriveItem[] => {
	try {
		return parse(raw);
	} catch {
		return [];
	}
};

const isDriveItem = (value: unknown): value is MicrosoftDriveItem =>
	typeof value === "object" &&
	value !== null &&
	"id" in value &&
	"isFolder" in value;

/**
 * The drive item behind a row a Microsoft drive adapter made.
 *
 * @param item - The explorer row.
 * @return The drive item, or undefined for a row from any other source.
 */
export const getDriveItem = (item: FileItem): MicrosoftDriveItem | undefined =>
	isDriveItem(item.data) ? item.data : undefined;

/**
 * How to save a drive row's file into the chat's files.
 *
 * @param row - The explorer row.
 * @param getDownload - The file's download pixel for a name, or null when the
 * file cannot be downloaded.
 * @return The request, or undefined for a folder or a file that cannot be.
 */
export const getDriveSaveRequest = (
	row: FileItem,
	getDownload: (
		item: MicrosoftDriveItem,
	) => ((fileName: string) => string) | null,
): ConnectorSaveRequest | undefined => {
	const item = getDriveItem(row);
	const buildPixel = item && !item.isFolder ? getDownload(item) : null;
	if (!item || !buildPixel) {
		return undefined;
	}
	return {
		key: item.id,
		name: item.name,
		source: {
			kind: "download",
			fileName: item.name,
			buildPixel: buildPixel,
			readSavedPath: readMicrosoftSavedPath,
		},
	};
};

/**
 * The user's own OneDrive, browsed by path from its top. A search covers the
 * whole drive and lists each hit under its own path.
 *
 * @return The adapter.
 */
export const createOneDriveAdapter = (): FileExplorerAdapter => ({
	...READ_ONLY_OPERATIONS,
	capabilities: readOnlyCapabilities(true),
	browse: (path) =>
		MICROSOFT_PIXELS.oneDriveListFolder({
			path: toDrivePath(path),
			limit: LIST_LIMIT,
		}),
	search: (_path, term) =>
		MICROSOFT_PIXELS.oneDriveSearch({
			search: term,
			scope: "drive",
			limit: LIST_LIMIT,
		}),
	mapEntries: (raw, path) =>
		readItems(raw, parseOneDriveFolder).map((item) =>
			toFileItem(
				item,
				item.path ? `/${item.path}` : joinPath(path, item.name),
			),
		),
});

/**
 * What others shared with the user. Those items sit in other people's drives,
 * so a folder is reached by its ids, remembered under the path it is shown at,
 * and a search's hits start their own paths at the top.
 *
 * @return The adapter, which keeps the folders it has shown.
 */
export const createOneDriveSharedAdapter = (): FileExplorerAdapter => {
	const folders = new Map<string, { driveId?: string; itemId: string }>();

	/**
	 * Explorer rows for one listing, each under a path no other item has.
	 * Shared items can share a name, which a drive's own folder never allows.
	 *
	 * @param items - The listing's items.
	 * @param parent - The folder they were listed in, or the search's scope.
	 * @return The rows.
	 */
	const toRows = (
		items: MicrosoftDriveItem[],
		parent: string,
	): FileItem[] => {
		const used = new Set<string>();
		return items.map((item) => {
			let path = joinPath(parent, item.name);
			for (let copy = 2; used.has(path); copy++) {
				path = joinPath(parent, `${item.name} (${copy})`);
			}
			used.add(path);
			if (item.isFolder) {
				folders.set(ensureDirectoryPath(path), {
					driveId: item.driveId,
					itemId: item.id,
				});
			}
			return toFileItem(item, path);
		});
	};

	return {
		...READ_ONLY_OPERATIONS,
		capabilities: readOnlyCapabilities(true),
		browse: (path) => {
			const folder = folders.get(ensureDirectoryPath(path));
			return folder
				? MICROSOFT_PIXELS.oneDriveListFolder({
						driveId: folder.driveId,
						itemId: folder.itemId,
						limit: LIST_LIMIT,
					})
				: MICROSOFT_PIXELS.oneDriveListShared(LIST_LIMIT);
		},
		search: (_path, term) =>
			MICROSOFT_PIXELS.oneDriveSearch({
				search: term,
				scope: "shared",
				limit: LIST_LIMIT,
			}),
		mapEntries: (raw, path) =>
			toRows(readItems(raw, parseOneDriveFolder), path),
	};
};

/**
 * One Teams channel's files, browsed by path from the channel's folder. Teams
 * has no search, so the explorer filters the folder it shows.
 *
 * @param teamId - The team.
 * @param channelId - The channel.
 * @return The adapter.
 */
export const createTeamsFilesAdapter = (
	teamId: string,
	channelId: string,
): FileExplorerAdapter => ({
	...READ_ONLY_OPERATIONS,
	capabilities: readOnlyCapabilities(false),
	browse: (path) =>
		MICROSOFT_PIXELS.teamsListFiles({
			teamId: teamId,
			channelId: channelId,
			folderPath: toDrivePath(path),
		}),
	search: unsupported("search"),
	mapEntries: (raw, path) =>
		readItems(raw, parseTeamsFolder).map((item) =>
			toFileItem(item, joinPath(path, item.name)),
		),
});
