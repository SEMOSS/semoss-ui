import { FileUpIcon } from "lucide-react";
import type React from "react";
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
	return (
		<DropdownMenuItem
			onSelect={() => {
				fileRef.current?.click();

				onSelect();
			}}
		>
			<FileUpIcon />
			<span className="flex-1">Attach Document</span>
		</DropdownMenuItem>
	);
};
