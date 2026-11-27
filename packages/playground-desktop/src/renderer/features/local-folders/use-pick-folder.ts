import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";
import { useLocalFolders } from "./use-local-folders";

/** What {@link usePickFolder} gives Attach Folder in the Desktop tree. */
interface PickFolder {
	/** Open the machine's folder picker and attach what the user picks. */
	pick: () => void;
	/** Whether the picker is open, which locks Attach Folder. */
	isPicking: boolean;
}

/**
 * Attach Folder from the Desktop tree in a room's Files: the picker, and a
 * toast when the attach fails.
 *
 * @param store - The room's attached folders.
 * @returns The action and whether it is locked.
 */
export const usePickFolder = (store: RoomLocalFoldersStore): PickFolder => {
	const { t } = useTranslation("desktop");
	const isPicking = useLocalFolders(store, (snapshot) => snapshot.isPicking);

	const pick = () => {
		store.attach().catch((error: unknown) => {
			toast.error(
				t("localFolders.attachFailed", {
					message: getErrorMessage(error, ""),
				}),
			);
		});
	};

	return { pick: pick, isPicking: isPicking };
};
