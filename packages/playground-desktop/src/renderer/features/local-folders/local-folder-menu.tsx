import { FolderOpenIcon, MoreHorizontalIcon, UnlinkIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { LocalFolder } from "./local-folders-host";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";

/** Props for {@link LocalFolderMenu}. */
interface LocalFolderMenuProps {
	/** The room's attached folders. */
	store: RoomLocalFoldersStore;
	/** The folder the menu is for. */
	folder: LocalFolder;
}

/**
 * The menu on an attached folder's heading in Files: show it in the machine's
 * file manager, or detach it from the room. Detaching leaves the folder on the
 * machine as it is, and the user can attach it again, so it does not ask.
 *
 * @param props - The room's folders and the one the menu is for.
 * @returns The menu.
 */
export const LocalFolderMenu = ({ store, folder }: LocalFolderMenuProps) => {
	const { t } = useTranslation("desktop");

	const handleReveal = () => {
		store.reveal(folder.id, "/").catch((error: unknown) => {
			toast.error(
				t("localFolders.openFailed", {
					message: getErrorMessage(error, ""),
				}),
			);
		});
	};

	const handleDetach = () => {
		store
			.detach(folder.id)
			.then(() => {
				toast.success(
					t("localFolders.detached", { name: folder.name }),
				);
			})
			.catch((error: unknown) => {
				toast.error(
					t("localFolders.detachFailed", {
						message: getErrorMessage(error, ""),
					}),
				);
			});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={t("localFolders.folderActions", {
						name: folder.name,
					})}
				>
					<MoreHorizontalIcon aria-hidden className="size-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onSelect={handleReveal}>
					<FolderOpenIcon aria-hidden />
					{t("localFolders.reveal", {
						fileManager: store.fileManagerName,
					})}
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={handleDetach}>
					<UnlinkIcon aria-hidden />
					{t("localFolders.detach")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
