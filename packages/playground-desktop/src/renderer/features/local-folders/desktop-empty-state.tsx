import { FolderPlusIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button } from "@semoss/ui/next";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";
import { usePickFolder } from "./use-pick-folder";

/** Props for {@link DesktopEmptyState}. */
interface DesktopEmptyStateProps {
	/** The room's attached folders. */
	store: RoomLocalFoldersStore;
}

/**
 * What the Desktop tree in a room's Files shows with no folder attached:
 * Attach Folder, which opens the machine's folder picker.
 *
 * @param props - The room's folders.
 * @returns The button.
 */
export const DesktopEmptyState = ({ store }: DesktopEmptyStateProps) => {
	const { t } = useTranslation("desktop");
	const { pick, isPicking } = usePickFolder(store);

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			disabled={isPicking}
			onClick={pick}
		>
			<FolderPlusIcon aria-hidden />
			{t("localFolders.attach")}
		</Button>
	);
};
