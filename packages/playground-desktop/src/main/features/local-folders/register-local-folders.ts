import { type BrowserWindow, dialog, shell } from "electron";
import { realpath, stat } from "node:fs/promises";
import {
	COMMAND_CHANNEL,
	type DesktopCommand,
} from "../../../contract/ipc-contract";
import {
	isLocalFolderRef,
	type LocalFolderGrant,
	type LocalFolderRef,
} from "../../../contract/local-folders";
import { handleIpc } from "../ipc/handle-ipc";
import type { FolderGrant, FolderGrants } from "./folder-grants";
import type { FolderWatchers } from "./folder-watchers";
import { createLocalFs } from "./local-fs";

/** What the local folder handlers act on. */
interface RegisterLocalFoldersOptions {
	/** The app's origin, the only one allowed to call. */
	readonly appOrigin: string;
	/** The saved grants. */
	readonly grants: FolderGrants;
	/** The watched folders. */
	readonly watchers: FolderWatchers;
	/** The partition of the server in use, or null before one is saved. */
	readonly getPartition: () => string | null;
	/** The app's window, which the picker belongs to and commands go to. */
	readonly getWindow: () => BrowserWindow | null;
}

/**
 * A grant as the page sees it: no path.
 *
 * @param grant - The saved grant.
 * @returns Its id and name.
 */
const toPageGrant = ({ id, name }: FolderGrant): LocalFolderGrant => ({
	id,
	name,
});

/**
 * A room id argument.
 *
 * @param value - The argument.
 * @returns The id.
 * @throws Error for anything but non-empty text.
 */
const readRoomId = (value: unknown): string => {
	if (typeof value !== "string" || !value) {
		throw new Error("A room id is required");
	}
	return value;
};

/**
 * A path argument.
 *
 * @param value - The argument.
 * @returns The path.
 * @throws Error for anything but text.
 */
const readPath = (value: unknown): string => {
	if (typeof value !== "string") {
		throw new Error("A path is required");
	}
	return value;
};

/**
 * The key a folder's watch goes by: its server, room, and attachment, so a
 * server's watches close together.
 *
 * @param partition - The server's partition.
 * @param ref - The room and attachment.
 * @returns The key.
 */
const watchKey = (partition: string, ref: LocalFolderRef): string =>
	`${partition}|${ref.roomId}|${ref.folderId}`;

/**
 * Wire the local folder channels. Folders are attached only through the
 * system's own folder picker, and every file call names a folder by its room
 * and attachment and a path inside it, which `local-fs` keeps inside.
 *
 * @param options - What the handlers act on.
 */
export const registerLocalFolders = ({
	appOrigin,
	grants,
	watchers,
	getPartition,
	getWindow,
}: RegisterLocalFoldersOptions): void => {
	const fs = createLocalFs({
		trash: (path) => shell.trashItem(path),
		openPath: (path) => shell.openPath(path),
		reveal: (path) => shell.showItemInFolder(path),
	});

	const partitionInUse = (): string => {
		const partition = getPartition();
		if (!partition) throw new Error("No server is in use");
		return partition;
	};

	/** The attached folder a call names, on the server in use. */
	const folderOf = (value: unknown): FolderGrant => {
		if (!isLocalFolderRef(value)) {
			throw new Error("An attached folder is required");
		}
		const grant = grants.get(
			partitionInUse(),
			value.roomId,
			value.folderId,
		);
		if (!grant) throw new Error("That folder is not attached to this chat");
		return grant;
	};

	handleIpc("local-folders:list", appOrigin, (roomId) =>
		grants.list(partitionInUse(), readRoomId(roomId)).map(toPageGrant),
	);

	handleIpc("local-folders:pick", appOrigin, async (roomId) => {
		const room = readRoomId(roomId);
		const partition = partitionInUse();
		const window = getWindow();
		const options: Electron.OpenDialogOptions = {
			title: "Attach Folders",
			buttonLabel: "Attach",
			properties: ["openDirectory", "multiSelections", "createDirectory"],
		};
		const result = window
			? await dialog.showOpenDialog(window, options)
			: await dialog.showOpenDialog(options);
		if (result.canceled || result.filePaths.length === 0) {
			return grants.list(partition, room).map(toPageGrant);
		}
		const folders: string[] = [];
		for (const path of result.filePaths) {
			const real = await realpath(path);
			if ((await stat(real)).isDirectory()) folders.push(real);
		}
		return grants.add(partition, room, folders).map(toPageGrant);
	});

	handleIpc("local-folders:detach", appOrigin, (ref) => {
		const grant = folderOf(ref);
		const { roomId } = ref as LocalFolderRef;
		const partition = partitionInUse();
		watchers.closeMatching(
			watchKey(partition, { roomId, folderId: grant.id }),
		);
		return grants.remove(partition, roomId, grant.id).map(toPageGrant);
	});

	handleIpc("local-folders:watch", appOrigin, (ref) => {
		const grant = folderOf(ref);
		const { roomId } = ref as LocalFolderRef;
		watchers.watch(
			watchKey(partitionInUse(), { roomId, folderId: grant.id }),
			grant.path,
			(paths) => {
				const command: DesktopCommand = {
					type: "local-folders-changed",
					roomId,
					folderId: grant.id,
					paths,
				};
				getWindow()?.webContents.send(COMMAND_CHANNEL, command);
			},
		);
	});

	handleIpc("local-folders:unwatch", appOrigin, (ref) => {
		if (!isLocalFolderRef(ref)) return;
		const partition = getPartition();
		if (partition) watchers.unwatch(watchKey(partition, ref));
	});

	handleIpc("local-fs:list", appOrigin, (ref, path) =>
		fs.list(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:stat", appOrigin, (ref, path) =>
		fs.stat(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:read", appOrigin, (ref, path) =>
		fs.read(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:write", appOrigin, (ref, path, bytes) => {
		if (!(bytes instanceof Uint8Array)) {
			throw new Error("A file's contents are required");
		}
		return fs.write(folderOf(ref).path, readPath(path), bytes);
	});
	handleIpc("local-fs:create-file", appOrigin, (ref, path) =>
		fs.createFile(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:create-directory", appOrigin, (ref, path) =>
		fs.createDirectory(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:move", appOrigin, (ref, from, to) =>
		fs.move(folderOf(ref).path, readPath(from), readPath(to)),
	);
	handleIpc("local-fs:copy", appOrigin, (ref, from, to) =>
		fs.copy(folderOf(ref).path, readPath(from), readPath(to)),
	);
	handleIpc("local-fs:remove", appOrigin, (ref, path) =>
		fs.remove(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:open", appOrigin, (ref, path) =>
		fs.open(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:reveal", appOrigin, (ref, path) =>
		fs.reveal(folderOf(ref).path, readPath(path)),
	);
};
