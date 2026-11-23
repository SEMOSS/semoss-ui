import { CopyIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { getErrorMessage } from "@semoss/utility/error";
import type { InputMessageStore } from "../../room/store/input-message.store";
import type { RoomStore } from "../../room/store/room.store";
import { useMessage } from "../../room/store/use-message";
import { TooltipButton } from "../tooltip-button";
import {
	type AttachmentPreview,
	getAttachmentIcon,
	readAttachmentPreview,
} from "./attachment-icon";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";
import { MessageActions } from "./message-actions";

/** Props for {@link InputMessage}. */
interface InputMessageProps {
	/** The room the message is in, which opens a saved attachment in its Workbench. */
	room: RoomStore;

	/** The user's message to render. */
	message: InputMessageStore;
}

/**
 * A message the user sent: its attachments, its text, and a Copy action. An
 * attachment saved to the room opens in the Workbench; one sent inline opens in
 * a preview dialog, as an image or a PDF.
 */
export const InputMessage = ({ room, message }: InputMessageProps) => {
	const { t } = useTranslation("chat");
	const [openPreview, setOpenPreview] = useState<AttachmentPreview | null>(
		null,
	);

	const { id, parts, dateCreated } = useMessage(message, (current) => ({
		id: current.id,
		parts: current.parts,
		dateCreated: current.dateCreated,
	}));

	// keep each part's index, so keys stay stable as parts of the other kind change
	const mediaParts = parts.flatMap((p, i) =>
		p.type === "MEDIA" ? [{ p, i }] : [],
	);
	const textParts = parts.flatMap((p, i) =>
		p.type === "TEXT" ? [{ p, i }] : [],
	);

	/** Copy the message as text, its files and tool results by name. */
	const handleCopy = async () => {
		const text = message.parts
			.map((part) => {
				if (part.type === "TEXT") {
					return part.text;
				} else if (part.type === "MEDIA") {
					return `<${part.mediaInfo.fileName}>`;
				} else if (part.type === "TOOL_RESULT") {
					return `<${part.toolResult.toolName}>`;
				}

				return "";
			})
			.join("\n");

		if (!text) {
			toast.warning(t("notifications.noCopyContent"));
			return;
		}

		try {
			await copyTextToClipboard(text);

			toast.success(t("notifications.copySuccess"));
		} catch (e) {
			toast.error(getErrorMessage(e));
		}
	};

	return (
		<>
			<div className="group/message relative ms-auto flex max-w-full flex-col items-end">
				<div className="items-start self-stretch rounded-lg bg-accent px-4 py-3 leading-normal">
					{mediaParts.length > 0 && (
						<div className="mb-2 flex flex-row gap-2 overflow-x-auto pb-1">
							{mediaParts.map(({ p, i }) => {
								const { Icon, ext } = getAttachmentIcon(
									p.mediaInfo.fileName,
								);
								const preview = readAttachmentPreview(
									p.mediaInfo,
								);
								return (
									<Tooltip key={`${id}-media-${i}`}>
										<TooltipTrigger asChild>
											<button
												type="button"
												className="group relative flex size-22 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border bg-muted"
												onClick={() => {
													// a saved file opens where it is stored
													if (
														p.mediaInfo.fileLocation
													) {
														room.openWorkbenchFilePanel(
															p.mediaInfo
																.fileLocation,
															p.mediaInfo
																.fileName,
														);
													} else if (preview) {
														setOpenPreview(preview);
													}
												}}
												aria-label={t(
													"attachments.view",
													{
														name: p.mediaInfo
															.fileName,
													},
												)}
											>
												{preview?.kind === "image" ? (
													<img
														className="h-full w-full object-cover"
														src={preview.src}
														alt={
															p.mediaInfo.fileName
														}
													/>
												) : (
													<>
														<Icon
															aria-hidden="true"
															className="size-8 shrink-0 text-muted-foreground"
															strokeWidth={1.25}
														/>
														<span className="max-w-16 truncate font-medium text-muted-foreground text-xs uppercase">
															{ext}
														</span>
													</>
												)}
											</button>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-48 truncate text-xs">
												{p.mediaInfo.fileName}
											</p>
										</TooltipContent>
									</Tooltip>
								);
							})}
						</div>
					)}
					{textParts.map(({ p, i }) => (
						<span
							key={`${id}-text-${i}`}
							dir="auto"
							className="whitespace-pre-wrap text-base text-foreground"
						>
							{p.uiText && p.uiText !== p.text
								? p.uiText
								: p.text}
						</span>
					))}
				</div>
				<MessageActions align="end" dateCreated={dateCreated}>
					<TooltipButton
						variant="ghost"
						size="icon"
						aria-label={t("input.copyMessage")}
						disabled={parts.length === 0}
						onClick={handleCopy}
						tooltip={t("input.copyMessage")}
						tooltipSide="bottom"
						isTooltipHoverable
					>
						<CopyIcon aria-hidden="true" />
					</TooltipButton>
				</MessageActions>
			</div>

			<AttachmentPreviewDialog
				preview={openPreview}
				onClose={() => setOpenPreview(null)}
			/>
		</>
	);
};
