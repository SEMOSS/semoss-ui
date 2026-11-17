import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { FileSources } from "@semoss/panels";
import { Muted } from "@semoss/ui/next";
import type { RoomLocalFoldersStore } from "../store/room-local-folders.store";
import { useLocalFolders } from "../store/use-local-folders";
import { AttachFolderButton } from "./attach-folder-button";
import { LocalFolderMenu } from "./local-folder-menu";

/** The Files panel's group of folders from the user's machine. */
export const DESKTOP_MOUNT_GROUP = "desktop";

/**
 * What the room's Files panel lists beside Room Files: a Desktop section with
 * each folder attached from the user's machine, its own tree under it. Storage
 * engines would be one more group here.
 *
 * @param store - The room's attached folders, or null where the host cannot
 * reach the user's files.
 * @returns The sources for `FileSourcesProvider`, or null for none.
 */
export const useRoomFileSources = (
	store: RoomLocalFoldersStore | null,
): FileSources | null => {
	const { t } = useTranslation("room");
	const folders = useLocalFolders(store, (snapshot) => snapshot.folders);

	return useMemo<FileSources | null>(() => {
		if (!store) {
			return null;
		}
		return {
			primaryLabel: t("localFolders.roomFiles"),
			// the room's own Files, not another explorer such as a connector's
			isShownIn: (mode) => mode.type === "INSIGHT",
			missingMountMessage: t("localFolders.notHere"),
			groups: [
				{
					id: DESKTOP_MOUNT_GROUP,
					label: t("localFolders.desktop"),
					actions: <AttachFolderButton store={store} />,
					emptyState: (
						<div className="flex flex-col items-start gap-2 border-b px-4 py-3">
							<Muted className="text-xs">
								{t("localFolders.empty")}
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
			mounts: folders.map((folder) => ({
				id: folder.id,
				name: folder.name,
				group: DESKTOP_MOUNT_GROUP,
				source: store.sourceFor(folder.id),
			})),
		};
	}, [folders, store, t]);
};
