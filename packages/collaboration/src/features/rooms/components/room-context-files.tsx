import { X } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { UploadedRoomFile } from "../api/upload-room-files";

interface RoomContextFilesProps {
	/** Session-owned files queued for the next message. */
	files: readonly UploadedRoomFile[];
	/** Removes a queued file without deleting the saved file. */
	onRemove: (path: string) => void;
	/** Prevents changing the queue while the composer is unavailable. */
	isDisabled?: boolean;
}

/** The same removable saved-file queue in a draft and a saved conversation. */
export function RoomContextFiles({
	files,
	onRemove,
	isDisabled = false,
}: RoomContextFilesProps) {
	const { t } = useTranslation("room");
	if (!files.length) return null;
	return (
		<ul
			aria-label={t("contextItems.label")}
			className="flex min-w-0 flex-wrap gap-2 px-3 pt-3"
		>
			{files.map((file) => (
				<li
					key={file.fileLocation}
					className="flex min-w-0 max-w-full items-center gap-1 rounded-md border border-border py-1 ps-3 pe-1 text-sm"
				>
					<span
						className="min-w-0 flex-1 truncate"
						title={file.fileName}
					>
						{file.fileName}
					</span>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="pointer-coarse:size-11 shrink-0"
								aria-label={t("contextItems.remove", {
									name: file.fileName,
								})}
								disabled={isDisabled}
								onClick={() => onRemove(file.fileLocation)}
							>
								<X aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{t("contextItems.remove", { name: file.fileName })}
						</TooltipContent>
					</Tooltip>
				</li>
			))}
		</ul>
	);
}
