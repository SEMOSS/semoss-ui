import { FolderPlusIcon } from "lucide-react";
import { useComposer } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useAttachFolder } from "./use-attach-folder";

/**
 * The plus menu's Attach Folder item: an open room attaches to itself, and a
 * new chat to the room it prepares.
 */
export const AttachFolderItem = () => {
	const { t } = useTranslation("desktop");
	const { closeMenu } = useComposer();
	const { attach, isLocked } = useAttachFolder();

	return (
		<DropdownMenuItem
			disabled={isLocked}
			onSelect={() => {
				attach();
				closeMenu();
			}}
		>
			<FolderPlusIcon aria-hidden="true" />
			<span className="flex-1">{t("localFolders.attach")}</span>
		</DropdownMenuItem>
	);
};
