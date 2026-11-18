import { ExternalLinkIcon } from "lucide-react";
import type { HostFiles } from "@semoss/chat";
import { getI18n } from "@semoss/i18n";
import type { FileExplorerSecondaryAction } from "@semoss/shared";
import { Muted, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { AttachFolderButton } from "./attach-folder-button";
import { LocalFolderMenu } from "./local-folder-menu";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";

/** The Files panel's group of folders from the user's machine. */
const DESKTOP_MOUNT_GROUP = "desktop";

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
 * What a room's Files panel lists beside Room Files on the desktop: a Desktop
 * section with each folder attached from the user's machine, its own tree
 * under it, and the actions on its files: Open with Default App, and Show in
 * the machine's file manager.
 *
 * @param store - The room's attached folders.
 * @returns The sources for the chat's Files panel.
 */
export const createDesktopHostFiles = (
	store: RoomLocalFoldersStore,
): HostFiles => {
	const { t } = getI18n();
	const openWithApp = t("desktop:localFolders.openWithApp");

	return {
		missingMountMessage: t("desktop:localFolders.notHere"),
		groups: [
			{
				id: DESKTOP_MOUNT_GROUP,
				label: t("desktop:localFolders.desktop"),
				actions: <AttachFolderButton store={store} />,
				emptyState: (
					<div className="flex flex-col items-start gap-2 border-b px-4 py-3">
						<Muted className="text-xs">
							{t("desktop:localFolders.empty")}
						</Muted>
						<AttachFolderButton store={store} isLabelled />
					</div>
				),
				mountActions: (mount) => (
					<LocalFolderMenu
						store={store}
						folder={{ id: mount.id, name: mount.name }}
					/>
				),
			},
		],
		mounts: store.folders.map((folder) => ({
			id: folder.id,
			name: folder.name,
			group: DESKTOP_MOUNT_GROUP,
			source: store.sourceFor(folder.id),
		})),
		// an open Desktop file opens in place, so what the other app saves
		// comes back to the tab through the folder's watch
		fileActions: ({ mode, path }) =>
			mode.type === "MOUNT"
				? [
						{
							name: openWithApp,
							icon: ExternalLinkIcon,
							action: () =>
								report(() => store.open(mode.mountId, path)),
						},
					]
				: [],
		secondaryActions: (item, mode) => {
			if (mode.type !== "MOUNT") {
				return [];
			}
			const reveal: FileExplorerSecondaryAction = {
				name: t("desktop:localFolders.reveal", {
					fileManager: store.fileManagerName,
				}),
				action: () =>
					report(() => store.reveal(mode.mountId, item.path)),
			};
			if (item.type === "directory") {
				return [reveal];
			}
			return [
				{
					name: openWithApp,
					action: () =>
						report(() => store.open(mode.mountId, item.path)),
				},
				reveal,
			];
		},
	};
};
