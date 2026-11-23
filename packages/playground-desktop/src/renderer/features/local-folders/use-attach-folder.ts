import { useComposer } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useDesktopTools } from "./desktop-tools.context";
import { useLocalFolders } from "./use-local-folders";

/** What {@link useAttachFolder} gives the composer's Attach Folder. */
interface AttachFolder {
	/** Open the folder picker and attach what the user picks. */
	attach: () => void;
	/** Whether the picker is open or a turn is running, which locks it. */
	isLocked: boolean;
}

/**
 * Attach folders from this machine to the composer's room: an open room
 * attaches to itself, and a new chat to the room it prepares, which keeps
 * them; the first message then carries their tools. It leaves the Workspace
 * as it is; the folders show in Files when the user opens it.
 *
 * @returns The action and whether it is locked.
 */
export const useAttachFolder = (): AttachFolder => {
	const { t } = useTranslation("desktop");
	const { room, isDraft, isBusy, prepareRoom } = useComposer();
	const tools = useDesktopTools();
	// a new chat's draft has no folders; the room it prepares does
	const isPicking = useLocalFolders(
		isDraft ? null : tools.foldersFor(room.roomId),
		(snapshot) => snapshot.isPicking,
	);

	const attach = async (): Promise<void> => {
		const target = await prepareRoom();
		if (!target) {
			toast.error(t("localFolders.attachFailed", { message: "" }));
			return;
		}
		const folders = tools.foldersFor(target.roomId);
		try {
			await folders.attach();
		} catch (error) {
			toast.error(
				t("localFolders.attachFailed", {
					message: getErrorMessage(error, ""),
				}),
			);
		}
	};

	return { attach: () => void attach(), isLocked: isBusy || isPicking };
};
