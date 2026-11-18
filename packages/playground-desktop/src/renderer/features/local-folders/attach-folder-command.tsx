import { FolderPlusIcon } from "lucide-react";
import { SlashCommand } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { useAttachFolder } from "./use-attach-folder";

/** The "/" menu's Attach Folder, in its Chat group. Gone while it is locked. */
export const AttachFolderCommand = () => {
	const { t } = useTranslation("desktop");
	const { attach, isLocked } = useAttachFolder();
	if (isLocked) return null;

	return (
		<SlashCommand
			name="attach-folder"
			group="chat"
			label={t("localFolders.attach")}
			description={t("localFolders.attachDescription")}
			keywords={["folder", "desktop", "directory"]}
			icon={<FolderPlusIcon />}
			onSelect={attach}
		/>
	);
};
