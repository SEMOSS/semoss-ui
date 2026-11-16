import { PaperclipIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useFileDrop } from "./file-drop.context";

interface RoomInputMenuUploadProps {
	/** Callback when the item is selected */
	onSelect?: () => void;
	disabled?: boolean;
}

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
