import { FolderPlusIcon, MoreHorizontalIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";
import { usePickFolder } from "./use-pick-folder";

/** Props for {@link DesktopRootMenu}. */
interface DesktopRootMenuProps {
	/** The room's attached folders. */
	store: RoomLocalFoldersStore;
}

/**
 * The menu on the Desktop row in a room's Files: Attach Folder, which opens
 * the machine's folder picker and attaches what the user picks to the room.
 *
 * @param props - The room's folders.
 * @returns The menu.
 */
export const DesktopRootMenu = ({ store }: DesktopRootMenuProps) => {
	const { t } = useTranslation("desktop");
	const { pick, isPicking } = usePickFolder(store);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={t("localFolders.folderActions", {
						name: t("localFolders.desktop"),
					})}
				>
					<MoreHorizontalIcon aria-hidden />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem disabled={isPicking} onSelect={pick}>
					<FolderPlusIcon aria-hidden />
					{t("localFolders.attach")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
