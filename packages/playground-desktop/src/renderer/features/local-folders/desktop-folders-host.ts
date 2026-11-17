import type { LocalFolder, LocalFoldersHost } from "@semoss/chat";
import type { FileItem, FileSource } from "@semoss/shared";
import type { DesktopBridge } from "../../../contract/ipc-contract";
import type {
	LocalFileEntry,
	LocalFolderRef,
} from "../../../contract/local-folders";

/** What an attached folder can do in the explorer: everything but download, since it is already here. */
const FOLDER_CAPABILITIES: FileSource["capabilities"] = {
	search: false,
	mutate: true,
	create: true,
	upload: true,
	download: false,
	delete: true,
};

/**
 * An entry from main, as the explorer has it.
 *
 * @param entry - The entry.
 * @returns The item.
 */
const toItem = (entry: LocalFileEntry): FileItem => ({
	name: entry.name,
	path: entry.path,
	...(entry.type ? { type: entry.type } : {}),
	...(entry.size !== undefined ? { size: entry.size } : {}),
	...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
});

/**
 * The file manager's name on this machine, for Show in Finder.
 *
 * @returns Finder, File Explorer, or Files.
 */
const getFileManagerName = (): string => {
	const platform = navigator.userAgent.toLowerCase();
	if (platform.includes("mac")) return "Finder";
	if (platform.includes("win")) return "File Explorer";
	return "Files";
};

/**
 * One attached folder's files, through the main process.
 *
 * @param bridge - The preload's bridge.
 * @param ref - The room and attachment.
 * @returns The folder's source.
 */
const createFolderSource = (
	bridge: DesktopBridge,
	ref: LocalFolderRef,
): FileSource => ({
	capabilities: FOLDER_CAPABILITIES,
	list: async (path) =>
		(await bridge.invoke("local-fs:list", ref, path)).map(toItem),
	stat: async (path) => {
		const entry = await bridge.invoke("local-fs:stat", ref, path);
		return entry ? toItem(entry) : null;
	},
	read: (path) => bridge.invoke("local-fs:read", ref, path),
	write: (path, bytes) => bridge.invoke("local-fs:write", ref, path, bytes),
	move: (from, to) => bridge.invoke("local-fs:move", ref, from, to),
	copy: (from, to) => bridge.invoke("local-fs:copy", ref, from, to),
	remove: (path) => bridge.invoke("local-fs:remove", ref, path),
	createFile: (path) => bridge.invoke("local-fs:create-file", ref, path),
	createDirectory: (path) =>
		bridge.invoke("local-fs:create-directory", ref, path),
});

/**
 * The chat's way to the user's own files on the desktop: folders attached to
 * a room through the system's folder picker, kept by the main process for the
 * server in use, and read and written through it.
 *
 * @param bridge - The preload's bridge.
 * @returns The host. Make one per window, so its folders' sources keep their identity.
 */
export const createDesktopFoldersHost = (
	bridge: DesktopBridge,
): LocalFoldersHost => {
	const sources = new Map<string, FileSource>();
	const toFolders = (
		grants: readonly { id: string; name: string }[],
	): LocalFolder[] => grants.map(({ id, name }) => ({ id, name }));

	return {
		fileManagerName: getFileManagerName(),
		list: async (roomId) =>
			toFolders(await bridge.invoke("local-folders:list", roomId)),
		pick: async (roomId) =>
			toFolders(await bridge.invoke("local-folders:pick", roomId)),
		detach: async (roomId, folderId) =>
			toFolders(
				await bridge.invoke("local-folders:detach", {
					roomId,
					folderId,
				}),
			),
		source: (roomId, folderId) => {
			const key = `${roomId}|${folderId}`;
			let source = sources.get(key);
			if (!source) {
				source = createFolderSource(bridge, { roomId, folderId });
				sources.set(key, source);
			}
			return source;
		},
		open: (roomId, folderId, path) =>
			bridge.invoke("local-fs:open", { roomId, folderId }, path),
		reveal: (roomId, folderId, path) =>
			bridge.invoke("local-fs:reveal", { roomId, folderId }, path),
		watch: (roomId, folderId, onChange) => {
			const ref = { roomId, folderId };
			const stopListening = bridge.onCommand((command) => {
				if (
					command.type === "local-folders-changed" &&
					command.roomId === roomId &&
					command.folderId === folderId
				) {
					onChange(command.paths ? [...command.paths] : undefined);
				}
			});
			bridge
				.invoke("local-folders:watch", ref)
				.catch((error: unknown) => {
					// the folder still works; it just will not refresh by itself
					console.error("Could not watch the folder", error);
				});
			return () => {
				stopListening();
				void bridge.invoke("local-folders:unwatch", ref);
			};
		},
	};
};
