import { PaperclipIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useFileDrop } from "./file-drop.context";

/** Props for {@link RoomInputMenuUpload}. */
interface RoomInputMenuUploadProps {
	/** Called after the file picker opens, such as to close the menu. */
	onSelect?: () => void;
	/** Locks the item, as while a turn is running. */
	disabled?: boolean;
}

/** The plus menu's Attach item, which opens the enclosing `FileDropProvider`'s file picker. */
export const RoomInputMenuUpload = ({
	onSelect = () => null,
	disabled = false,
}: RoomInputMenuUploadProps) => {
	const { t } = useTranslation("room");
	const { openFilePicker } = useFileDrop();

	return (
		<DropdownMenuItem
			disabled={disabled}
			onSelect={() => {
				openFilePicker();
				onSelect();
			}}
		>
			<PaperclipIcon aria-hidden="true" />
			<span className="flex-1">{t("menuUpload.attachDocument")}</span>
		</DropdownMenuItem>
	);
};
