import {
	type ClientTool,
	describeFolderTool,
	executeFolderTool,
	FOLDER_TOOL_OPERATIONS,
	type FolderToolOperation,
	type HostFiles,
	summarizeFolderToolCall,
	type ToolsHost,
	type ToolsHostChange,
} from "@semoss/chat";
import { getI18n } from "@semoss/i18n";
import { DESKTOP_FOLDERS_NAME } from "./desktop-folders";
import { createDesktopHostFiles } from "./desktop-host-files";
import type { LocalFolder, LocalFoldersHost } from "./local-folders-host";
import { RoomLocalFoldersStore } from "./room-local-folders.store";

/** What the desktop's tools are called before their operation. */
const DESKTOP_TOOL_PREFIX = "desktop";

/** What the model reads back for a desktop call where the folders are not. */
const DESKTOP_TOOLS_UNAVAILABLE =
	"Desktop folders are only available in the desktop app where they were attached. Tell the user to open this chat there, or attach the folders again.";

/** The desktop's tools host, with the folders it keeps for each room. */
export interface DesktopToolsHost extends ToolsHost {
	/**
	 * A room's attached folders, for the desktop's own Attach Folder.
	 *
	 * @param roomId - The room.
	 */
	foldersFor(roomId: string): RoomLocalFoldersStore;
}

/** What the host keeps for one room the chat has open. */
interface RoomEntry {
	readonly store: RoomLocalFoldersStore;
	readonly listeners: Set<(change?: ToolsHostChange) => void>;
	/** The room's tools and files, built for the folders they were built from. */
	cache: {
		folders: readonly LocalFolder[];
		tools: readonly ClientTool[];
		files: HostFiles;
	} | null;
}

/**
 * Whether a tool name is one of the desktop's folder tools.
 *
 * @param name - The name the model called.
 * @returns True for `desktop_list`, `desktop_read`, and the rest.
 */
const isDesktopToolName = (name: string): boolean =>
	name.startsWith(`${DESKTOP_TOOL_PREFIX}_`) &&
	(FOLDER_TOOL_OPERATIONS as readonly string[]).includes(
		name.slice(DESKTOP_TOOL_PREFIX.length + 1),
	);

/**
 * The folder tools over a room's attached folders, each folder a top level
 * entry named after it.
 *
 * @param entry - The room.
 * @param notify - Tells the chat a folder's files changed.
 * @returns The tools, or none when nothing is attached.
 */
const buildTools = (
	entry: RoomEntry,
	notify: (change: ToolsHostChange) => void,
): ClientTool[] => {
	const folders = entry.store.folders;
	if (folders.length === 0) {
		return [];
	}
	const names = folders.map((folder) => JSON.stringify(folder.name));
	const space = {
		prefix: DESKTOP_TOOL_PREFIX,
		description: `${DESKTOP_FOLDERS_NAME} (folders on the user's own computer that they attached to this chat; changes are saved straight to their disk)`,
		scope: `Each attached folder is a top level entry named after it: ${names.join(", ")}. Start every path with one of them, such as ${JSON.stringify(`${folders[0]?.name}/notes.md`)}. These are not Room Files; to share one of these files with a tool that reads Room Files, write a copy there.`,
	};
	return FOLDER_TOOL_OPERATIONS.map((operation: FolderToolOperation) => {
		const tool = describeFolderTool(space, operation);
		return {
			...tool,
			title: getI18n().t(`desktop:localFolders.titles.${operation}`),
			// it follows the Room Files tool that does the same
			modeKey: `folder_${operation}`,
			summarize: (args) => summarizeFolderToolCall(tool.name, args),
			run: async (args) => {
				const outcome = await executeFolderTool(
					entry.store.toolFolder,
					tool.name,
					args,
				);
				if (outcome.hasChanges) {
					for (const folder of entry.store.folders) {
						notify({ mountId: folder.id });
					}
				}
				return { isError: outcome.isError, payload: outcome.payload };
			},
		};
	});
};

/**
 * The tools the desktop runs for the chat: the folder tools over the folders
 * attached to each room from this machine, and those folders in the room's
 * Files. It keeps a room's folders while the chat has the room open.
 *
 * @param foldersHost - The way to the machine's folders, through the main process.
 * @returns The host. Make one per window, so its rooms' folders keep their identity.
 */
export const createDesktopToolsHost = (
	foldersHost: LocalFoldersHost,
): DesktopToolsHost => {
	const rooms = new Map<string, RoomEntry>();

	/** Tell everyone listening to a room. */
	const notify = (entry: RoomEntry, change?: ToolsHostChange): void => {
		for (const listener of entry.listeners) {
			listener(change);
		}
	};

	/** The room's entry, made on first use. */
	const entryFor = (roomId: string): RoomEntry => {
		const existing = rooms.get(roomId);
		if (existing) {
			return existing;
		}
		const entry: RoomEntry = {
			listeners: new Set(),
			cache: null,
			store: new RoomLocalFoldersStore({
				host: foldersHost,
				getRoomId: () => roomId,
				onFoldersChanged: () => notify(entry),
				onFilesChanged: (mountId, paths) =>
					notify(entry, { mountId: mountId, paths: paths }),
			}),
		};
		rooms.set(roomId, entry);
		return entry;
	};

	/** The room's tools and files, the same while its folders are. */
	const cacheFor = (roomId: string): NonNullable<RoomEntry["cache"]> => {
		const entry = entryFor(roomId);
		const folders = entry.store.folders;
		if (entry.cache?.folders !== folders) {
			entry.cache = {
				folders: folders,
				tools: buildTools(entry, (change) => notify(entry, change)),
				files: createDesktopHostFiles(entry.store),
			};
		}
		return entry.cache;
	};

	return {
		owns: isDesktopToolName,
		list: (roomId) => (rooms.has(roomId) ? cacheFor(roomId).tools : []),
		files: (roomId) => cacheFor(roomId).files,
		subscribe: (roomId, onChange) => {
			const entry = entryFor(roomId);
			entry.listeners.add(onChange);
			return () => {
				entry.listeners.delete(onChange);
				// the chat let go of the room; its folders stay attached
				if (entry.listeners.size === 0) {
					entry.store.dispose();
					rooms.delete(roomId);
				}
			};
		},
		load: (roomId) => entryFor(roomId).store.load(),
		discard: async (roomId) => {
			const store = entryFor(roomId).store;
			// nothing is kept for a room that is gone
			await Promise.all(
				store.folders.map((folder) =>
					store.detach(folder.id).catch(console.error),
				),
			);
		},
		unavailableMessage: DESKTOP_TOOLS_UNAVAILABLE,
		foldersFor: (roomId) => entryFor(roomId).store,
	};
};
