import { ExternalLinkIcon } from "lucide-react";
import type { HostFiles } from "@semoss/chat";
import { getI18n } from "@semoss/i18n";
import type { FileExplorerSecondaryAction } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { DESKTOP_MOUNT_ID } from "./desktop-files-source";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";

/**
 * Run a folder action, telling the user when it fails.
 *
 * @param run - The action.
 */
const report = async (run: () => Promise<void>): Promise<void> => {
	try {
		await run();
	} catch (error) {
		toast.error(
			getI18n().t("desktop:localFolders.openFailed", {
				message: getErrorMessage(error, ""),
			}),
		);
	}
};

/**
 * Detach a folder, telling the user how it went. Its files stay on the
 * machine.
 *
 * @param store - The room's folders.
 * @param folderId - The attachment.
 * @param name - The folder's name.
 */
const detach = async (
	store: RoomLocalFoldersStore,
	folderId: string,
	name: string,
): Promise<void> => {
	const { t } = getI18n();
	try {
		await store.detach(folderId);
		toast.success(t("desktop:localFolders.detached", { name: name }));
	} catch (error) {
		toast.error(
			t("desktop:localFolders.detachFailed", {
				message: getErrorMessage(error, ""),
			}),
		);
	}
};

/**
 * What the desktop adds to its Desktop tree in a room's Files, which
 * `DesktopFileRoots` adds: the actions on its files, Open with Default App
 * and Show in the machine's file manager, and on each attached folder,
 * Detach.
 *
 * @param store - The room's attached folders.
 * @returns The rest of the desktop's Files for the chat.
 */
export const createDesktopHostFiles = (
	store: RoomLocalFoldersStore,
): HostFiles => {
	const { t } = getI18n();
	const openWithApp = t("desktop:localFolders.openWithApp");
	/**
	 * Which folder a Desktop path is in.
	 *
	 * @param mountId - The panel's or row's mount.
	 * @param path - The path in the Desktop tree.
	 * @returns The folder and its path, or null for anything else.
	 */
	const locate = (mountId: string, path: string) =>
		mountId === DESKTOP_MOUNT_ID ? store.filesSource.locate(path) : null;

	return {
		missingMountMessage: t("desktop:localFolders.notHere"),
		// an open Desktop file opens in place, so what the other app saves
		// comes back to the tab through the folder's watch
		fileActions: ({ mode, path }) => {
			const found =
				mode.type === "MOUNT" ? locate(mode.mountId, path) : null;
			return found
				? [
						{
							name: openWithApp,
							icon: ExternalLinkIcon,
							action: () =>
								report(() =>
									store.open(found.folderId, found.path),
								),
						},
					]
				: [];
		},
		secondaryActions: (item, mode) => {
			const found =
				mode.type === "MOUNT" ? locate(mode.mountId, item.path) : null;
			if (!found) {
				return [];
			}
			const reveal: FileExplorerSecondaryAction = {
				name: t("desktop:localFolders.reveal", {
					fileManager: store.fileManagerName,
				}),
				action: () =>
					report(() => store.reveal(found.folderId, found.path)),
			};
			// an attached folder's own row
			if (found.path === "/") {
				return [
					reveal,
					{
						name: t("desktop:localFolders.detach"),
						action: () => detach(store, found.folderId, item.name),
					},
				];
			}
			if (item.type === "directory") {
				return [reveal];
			}
			return [
				{
					name: openWithApp,
					action: () =>
						report(() => store.open(found.folderId, found.path)),
				},
				reveal,
			];
		},
	};
};
