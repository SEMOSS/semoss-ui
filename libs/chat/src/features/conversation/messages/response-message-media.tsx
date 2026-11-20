import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type { PixelMessageMediaPart } from "../../../types";
import type { RoomStore } from "../../room/store/room.store";
import {
	type AttachmentPreview,
	getAttachmentIcon,
	readAttachmentPreview,
} from "./attachment-icon";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";

/** Props for {@link ResponseMessageMedia}. */
interface ResponseMessageMediaProps {
	/** The room the response is in, which opens a stored file in its Workspace. */
	room: RoomStore;
	/** The file the response holds. */
	mediaInfo: PixelMessageMediaPart["mediaInfo"];
}

/**
 * A file in a response. An image sent inline shows itself and opens full
 * size; any other file shows its type's icon and extension, and opens in the
 * Workspace when it is stored, or as a PDF preview when it is inline.
 */
export const ResponseMessageMedia = ({
	room,
	mediaInfo,
}: ResponseMessageMediaProps) => {
	const { t } = useTranslation("chat");
	const [openPreview, setOpenPreview] = useState<AttachmentPreview | null>(
		null,
	);
	const preview = readAttachmentPreview(mediaInfo);
	const { Icon, ext } = getAttachmentIcon(mediaInfo.fileName);

	/** Open the image full size, else the stored file, else the inline file. */
	const handleClick = () => {
		if (preview?.kind === "image") {
			setOpenPreview(preview);
		} else if (mediaInfo.fileLocation) {
			room.openWorkbenchFilePanel(
				mediaInfo.fileLocation,
				mediaInfo.fileName,
			);
		} else if (preview) {
			setOpenPreview(preview);
		}
	};

	const label = t("attachments.view", { name: mediaInfo.fileName });

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					{preview?.kind === "image" ? (
						<button
							type="button"
							className="w-fit cursor-zoom-in overflow-hidden rounded-lg border border-border"
							onClick={handleClick}
							aria-label={label}
						>
							<img
								className="max-h-120 max-w-full object-contain"
								src={preview.src}
								alt={mediaInfo.fileName}
							/>
						</button>
					) : (
						<button
							type="button"
							className="group relative flex size-22 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border bg-muted"
							onClick={handleClick}
							aria-label={label}
						>
							<Icon
								aria-hidden="true"
								className="size-8 shrink-0 text-muted-foreground"
								strokeWidth={1.25}
							/>
							<span className="max-w-16 truncate font-medium text-muted-foreground text-xs uppercase">
								{ext}
							</span>
						</button>
					)}
				</TooltipTrigger>
				<TooltipContent>
					<p className="max-w-48 truncate text-xs">
						{mediaInfo.fileName}
					</p>
				</TooltipContent>
			</Tooltip>
			<AttachmentPreviewDialog
				preview={openPreview}
				onClose={() => setOpenPreview(null)}
			/>
		</>
	);
};
