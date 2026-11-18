import { useComposer } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useDesktopTools } from "./use-desktop-tools";
import { useLocalFolders } from "./use-local-folders";

/** What {@link useAttachFolder} gives the composer's Attach Folder. */
interface AttachFolder {
	/** Open the folder picker, attach what the user picks, and show Files. */
	attach: () => void;
	/** Whether the picker is open or a turn is running, which locks it. */
	isLocked: boolean;
}

/**
 * Attach folders from this machine to the composer's room: an open room
 * attaches to itself, and a new chat to the room it prepares, which keeps
 * them; the first message then carries their tools. Files shows them once
 * they are attached.
 *
 * @returns The action and whether it is locked.
 */
export const useAttachFolder = (): AttachFolder => {
	const { t } = useTranslation("desktop");
	const { room, isNewChat, isBusy, prepareRoom, openFiles } = useComposer();
	const tools = useDesktopTools();
	// a new chat's draft has no folders; the room it prepares does
	const isPicking = useLocalFolders(
		isNewChat ? null : tools.foldersFor(room.roomId),
		(snapshot) => snapshot.isPicking,
	);

	const attach = async (): Promise<void> => {
		const target = await prepareRoom();
		if (!target) return;
		const folders = tools.foldersFor(target.roomId);
		try {
			await folders.attach();
		} catch (error) {
			toast.error(
				t("localFolders.attachFailed", {
					message: getErrorMessage(error, ""),
				}),
			);
			return;
		}
		if (folders.folders.length > 0) openFiles();
	};

	return { attach: () => void attach(), isLocked: isBusy || isPicking };
};
