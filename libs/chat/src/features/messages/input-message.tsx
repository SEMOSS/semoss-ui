import { CopyIcon, FileBadgeIcon, ImageIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { getErrorMessage } from "@semoss/utility/error";
import { getFileExtension } from "@semoss/utility/file";
import { getImageMimeType } from "@semoss/utility/image";
import { MessageActions } from "../conversation/message-actions";
import type { RoomStore } from "../room/room.store";
import { getAttachmentIcon } from "./attachment-icon";
import type { InputMessageStore } from "./input-message.store";
import { useMessage } from "./use-message";

/** Props for {@link InputMessage}. */
interface InputMessageProps {
	/** The room the message is in, which opens a saved attachment in its sidebar. */
	room: RoomStore;

	/** The user's message to render. */
	message: InputMessageStore;
}

/**
 * A message the user sent: its attachments, its text, and a Copy action. An
 * attachment saved to the room opens in the sidebar; one sent inline opens in
 * a preview dialog, as an image or a PDF.
 */
export const InputMessage = ({ room, message }: InputMessageProps) => {
	const { t } = useTranslation("chat");
	const [previewPdf, setPreviewPdf] = useState<{
		fileName: string;
		base64Data: string;
	} | null>(null);
	const [previewImage, setPreviewImage] = useState<{
		fileName: string;
		base64Data: string;
		mimeType: string;
	} | null>(null);

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
								return (
									<Tooltip key={`${id}-media-${i}`}>
										<TooltipTrigger asChild>
											<button
												type="button"
												className="group relative flex size-22 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border bg-muted"
												onClick={() => {
													if (
														p.mediaInfo.fileLocation
													) {
														room.openFileSidebarPanel(
															p.mediaInfo
																.fileLocation,
															p.mediaInfo
																.fileName,
														);
													} else if (
														p.mediaInfo.base64Data
													) {
														const isImg =
															p.mediaInfo.mimeType?.startsWith(
																"image/",
															) ||
															[
																"png",
																"jpg",
																"jpeg",
																"gif",
																"webp",
																"svg",
																"bmp",
																"img",
															].includes(
																p.mediaInfo.fileName
																	?.split(".")
																	.pop()
																	?.toLowerCase() ??
																	"",
															);
														if (isImg) {
															const imgExt =
																p.mediaInfo.fileName
																	?.split(".")
																	.pop()
																	?.toLowerCase() ??
																"png";
															const mimeMap: Record<
																string,
																string
															> = {
																jpg: "image/jpeg",
																jpeg: "image/jpeg",
																gif: "image/gif",
																webp: "image/webp",
																svg: "image/svg+xml",
																bmp: "image/bmp",
															};
															setPreviewImage({
																fileName:
																	p.mediaInfo
																		.fileName,
																base64Data:
																	p.mediaInfo
																		.base64Data,
																mimeType:
																	p.mediaInfo
																		.mimeType ||
																	mimeMap[
																		imgExt
																	] ||
																	"image/png",
															});
														} else {
															setPreviewPdf({
																fileName:
																	p.mediaInfo
																		.fileName,
																base64Data:
																	p.mediaInfo
																		.base64Data,
															});
														}
													}
												}}
												aria-label={`View ${p.mediaInfo.fileName}`}
											>
												{p.mediaInfo.base64Data &&
												(p.mediaInfo.mimeType?.startsWith(
													"image/",
												) ||
													[
														"png",
														"jpg",
														"jpeg",
														"gif",
														"webp",
														"svg",
														"bmp",
														"img",
													].includes(
														p.mediaInfo.fileName
															?.split(".")
															.pop()
															?.toLowerCase() ??
															"",
													)) ? (
													<img
														className="h-full w-full object-cover"
														src={`data:${p.mediaInfo.mimeType?.startsWith("image/") ? p.mediaInfo.mimeType : getImageMimeType(getFileExtension(p.mediaInfo.fileName))};base64,${p.mediaInfo.base64Data}`}
														alt={
															p.mediaInfo.fileName
														}
													/>
												) : (
													<>
														<Icon
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
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label={t("input.copyMessage")}
								disabled={parts.length === 0}
								onClick={async () => {
									const text = message.parts
										.map((part) => {
											if (part.type === "TEXT") {
												return part.text;
											} else if (part.type === "MEDIA") {
												return `<${part.mediaInfo.fileName}?`;
											} else if (
												part.type === "TOOL_RESULT"
											) {
												return `<${part.toolResult.toolName}?`;
											}

											return "";
										})
										.join("\n");

									if (!text) {
										toast.warning(
											t("notifications.noCopyContent"),
										);
										return;
									}

									try {
										await copyTextToClipboard(text);

										toast.success(
											t("notifications.copySuccess"),
										);
									} catch (e) {
										toast.error(getErrorMessage(e));
									}
								}}
							>
								<CopyIcon aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("input.copyMessage")}
						</TooltipContent>
					</Tooltip>
				</MessageActions>
			</div>

			<Dialog
				open={previewPdf !== null}
				onOpenChange={(open) => {
					if (!open) setPreviewPdf(null);
				}}
			>
				<DialogContent className="flex h-[80vh] max-w-4xl flex-col gap-3 p-4">
					<div className="flex items-center gap-2 border-b pb-3">
						<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
							<FileBadgeIcon className="size-4 text-muted-foreground" />
						</div>
						<span
							className="truncate text-muted-foreground text-sm"
							title={previewPdf?.fileName}
						>
							{previewPdf?.fileName}
						</span>
					</div>
					{previewPdf && (
						<object
							className="flex-1"
							data={`data:application/pdf;base64,${previewPdf.base64Data}`}
							type="application/pdf"
							aria-label={`Preview of ${previewPdf.fileName}`}
						>
							<p className="p-4 text-muted-foreground text-sm">
								Your browser doesn't support PDF viewing.
							</p>
						</object>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={previewImage !== null}
				onOpenChange={(open) => {
					if (!open) setPreviewImage(null);
				}}
			>
				<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-3 p-4">
					<div className="flex items-center gap-2 border-b pb-3">
						<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
							<ImageIcon className="size-4 text-muted-foreground" />
						</div>
						<span
							className="truncate text-muted-foreground text-sm"
							title={previewImage?.fileName}
						>
							{previewImage?.fileName}
						</span>
					</div>
					{previewImage && (
						<img
							className="max-h-[78vh] max-w-full rounded object-contain"
							src={`data:${previewImage.mimeType};base64,${previewImage.base64Data}`}
							alt={previewImage.fileName}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};
