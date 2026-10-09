import { X } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button } from "@semoss/ui/next";
import type { UploadedRoomFile } from "../api/upload-room-files";

interface RoomContextFilesProps {
	/** Saved files queued for the next message. */
	files: readonly UploadedRoomFile[];
	/** Removes a queued receipt without deleting its saved file. */
	onRemove: (path: string) => void;
	/** Prevents changes while the host is submitting or running. */
	disabled: boolean;
}

/** Removable context files shared by draft and saved-room composers. */
export function RoomContextFiles({
	files,
	onRemove,
	disabled,
}: RoomContextFilesProps) {
	const { t } = useTranslation("room");
	return (
		<>
			{files.map((file) => (
				<div
					key={file.fileLocation}
					className="flex min-w-0 items-center gap-2 rounded-md border border-border px-3 py-1 text-sm"
				>
					<span
						className="min-w-0 flex-1 truncate"
						title={file.fileName}
					>
						{file.fileName}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 shrink-0"
						aria-label={t("contextItems.remove", {
							name: file.fileName,
						})}
						disabled={disabled}
						onClick={() => onRemove(file.fileLocation)}
					>
						<X aria-hidden="true" />
					</Button>
				</div>
			))}
		</>
	);
}
