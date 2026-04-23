import { PaperclipIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useFileDrag } from "@/contexts";

interface RoomInputMenuUploadProps {
	/** Callback when the item is selected */
	onSelect?: () => void;
}

export const RoomInputMenuUpload: React.FC<RoomInputMenuUploadProps> = ({
	onSelect = () => null,
}) => {
	const { t } = useTranslation("room");
	const { setShouldStayOpen } = useFileDrag();

	return (
		<DropdownMenuItem
			onSelect={() => {
				setShouldStayOpen(true);
				onSelect();
			}}
		>
			<PaperclipIcon />
			<span className="flex-1">{t("menuUpload.attachDocument")}</span>
		</DropdownMenuItem>
	);
};
