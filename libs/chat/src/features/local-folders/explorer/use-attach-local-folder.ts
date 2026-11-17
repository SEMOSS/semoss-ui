import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { RoomLocalFoldersStore } from "../store/room-local-folders.store";
import { useLocalFolders } from "../store/use-local-folders";

/** What {@link useAttachLocalFolder} gives a button or menu item. */
export interface AttachLocalFolder {
	/** Open the folder picker and attach what the user picks; null without a host. */
	attach: (() => void) | null;
	/** Whether the picker is open, so the control can wait. */
	isPicking: boolean;
}

/**
 * Attach folders from the user's machine to a room, telling the user when it
 * fails.
 *
 * @param store - The room's attached folders, or null where the host cannot
 * reach the user's files.
 * @returns The action and whether the picker is open.
 */
export const useAttachLocalFolder = (
	store: RoomLocalFoldersStore | null,
): AttachLocalFolder => {
	const { t } = useTranslation("room");
	const isPicking = useLocalFolders(store, (snapshot) => snapshot.isPicking);
	const attach = useCallback(() => {
		store?.attach().catch((error: unknown) => {
			toast.error(
				t("localFolders.attachFailed", {
					message: getErrorMessage(error, ""),
				}),
			);
		});
	}, [store, t]);
	return { attach: store ? attach : null, isPicking };
};
