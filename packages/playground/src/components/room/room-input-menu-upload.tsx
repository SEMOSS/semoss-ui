import { PaperclipIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useFileDrag } from "@/contexts";

interface RoomInputMenuUploadProps {
	/** Callback when the item is selected */
	onSelect?: () => void;
}

export const RoomInputMenuUpload = ({
	onSelect = () => null,
}: RoomInputMenuUploadProps) => {
	const { t } = useTranslation("room");
	const { openFilePicker } = useFileDrag();

	return (
		<DropdownMenuItem
			onSelect={() => {
				openFilePicker();
				onSelect();
			}}
		>
			<PaperclipIcon />
			<span className="flex-1">{t("menuUpload.attachDocument")}</span>
		</DropdownMenuItem>
	);
};
