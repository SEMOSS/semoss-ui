import { FileUpIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";

interface RoomInputMenuUploadProps {
	/** File input ref to trigger file upload */
	fileRef: React.RefObject<HTMLInputElement>;

	/** Callback when the item is selected */
	onSelect?: () => void;
}

export const RoomInputMenuUpload: React.FC<RoomInputMenuUploadProps> = ({
	fileRef,
	onSelect = () => null,
}) => {
	const { t } = useTranslation("room");

	return (
		<DropdownMenuItem
			onSelect={() => {
				fileRef.current?.click();

				onSelect();
			}}
		>
			<FileUpIcon />
			<span className="flex-1">{t("menuUpload.attachDocument")}</span>
		</DropdownMenuItem>
	);
};
