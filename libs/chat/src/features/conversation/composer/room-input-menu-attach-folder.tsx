import { FolderPlusIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";

/** Props for {@link RoomInputMenuAttachFolder}. */
interface RoomInputMenuAttachFolderProps {
	/** Opens the machine's folder picker and attaches what the user picks. */
	onAttach: () => void;
	/** Called once the picker opens, such as to close the menu. */
	onSelect?: () => void;
	/** Locks the item, as while a turn is running or the picker is open. */
	disabled?: boolean;
}

/**
 * The plus menu's Attach Folder item: an open room attaches to itself, and a
 * new chat to the room it prepares.
 *
 * @param props - The attach action and the menu's callbacks.
 * @returns The item.
 */
export const RoomInputMenuAttachFolder = ({
	onAttach,
	onSelect = () => null,
	disabled = false,
}: RoomInputMenuAttachFolderProps) => {
	const { t } = useTranslation("room");

	return (
		<DropdownMenuItem
			disabled={disabled}
			onSelect={() => {
				onAttach();
				onSelect();
			}}
		>
			<FolderPlusIcon aria-hidden="true" />
			<span className="flex-1">{t("localFolders.attach")}</span>
		</DropdownMenuItem>
	);
};
