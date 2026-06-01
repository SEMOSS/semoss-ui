import {
	CopyIcon,
	FileArchiveIcon,
	FileAudioIcon,
	FileBadgeIcon,
	FileChartPieIcon,
	FileCodeIcon,
	FileIcon,
	FileJsonIcon,
	FileSpreadsheetIcon,
	FileTerminalIcon,
	FileTextIcon,
	FileTypeIcon,
	FileVideoIcon,
	ImageIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
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
import type { InputMessageStore, RoomStore } from "@/stores";
import { DateDisplay } from "../common";

const getExtIcon = (fileName: string) => {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	if (["xls", "xlsx", "csv"].includes(ext))
		return { Icon: FileSpreadsheetIcon, ext };
	if (
		[
			"py",
			"js",
			"ts",
			"tsx",
			"jsx",
			"java",
			"cpp",
			"c",
			"go",
			"rs",
		].includes(ext)
	)
		return { Icon: FileCodeIcon, ext };
	if (["sh", "bash", "zsh", "bat", "ps1"].includes(ext))
		return { Icon: FileTerminalIcon, ext };
	if (ext === "json") return { Icon: FileJsonIcon, ext };
	if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
		return { Icon: FileArchiveIcon, ext };
	if (["ppt", "pptx"].includes(ext)) return { Icon: FileChartPieIcon, ext };
	if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext))
		return { Icon: FileAudioIcon, ext };
	if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
		return { Icon: FileVideoIcon, ext };
	if (["html", "xml", "md", "mdx", "rtf"].includes(ext))
		return { Icon: FileTypeIcon, ext };
	if (ext === "pdf") return { Icon: FileBadgeIcon, ext };
	if (["doc", "docx", "msg", "txt"].includes(ext))
		return { Icon: FileTextIcon, ext };
	return { Icon: FileIcon, ext };
};

interface InputMessageProps {
	/** Room */
	room: RoomStore;

	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ room, message }) => {
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

		const mediaParts = message.parts.flatMap((p, i) =>
			p.type === "MEDIA" ? [{ p, i }] : [],
		);
		const textParts = message.parts.flatMap((p, i) =>
			p.type === "TEXT" ? [{ p, i }] : [],
		);

		return (
			<>
				<div className="group ms-auto flex max-w-[750px] flex-col items-end">
					<div className="items-start self-stretch rounded-lg bg-accent px-4 py-3 leading-normal">
						{mediaParts.length > 0 && (
							<div className="mb-2 flex flex-row gap-2 overflow-x-auto pb-1">
								{mediaParts.map(({ p, i }) => {
									const { Icon, ext } = getExtIcon(
										p.mediaInfo.fileName,
									);
									return (
										<Tooltip
											key={`${message.id}-media-${i}`}
										>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="group relative flex size-22 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border bg-muted"
													onClick={() => {
														if (
															p.mediaInfo
																.fileLocation
														) {
															room.addSidebarNode(
																`FILE--${p.mediaInfo.fileLocation}`,
																{
																	type: "tab",
																	name: p
																		.mediaInfo
																		.fileName,
																	component:
																		"room-file-editor",
																	config: {
																		name: p
																			.mediaInfo
																			.fileName,
																		path: p
																			.mediaInfo
																			.fileLocation,
																	},
																	enableClose: true,
																},
															);
														} else if (
															p.mediaInfo
																.base64Data
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
																		?.split(
																			".",
																		)
																		.pop()
																		?.toLowerCase() ??
																		"",
																);
															if (isImg) {
																const imgExt =
																	p.mediaInfo.fileName
																		?.split(
																			".",
																		)
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
																setPreviewImage(
																	{
																		fileName:
																			p
																				.mediaInfo
																				.fileName,
																		base64Data:
																			p
																				.mediaInfo
																				.base64Data,
																		mimeType:
																			p
																				.mediaInfo
																				.mimeType ||
																			mimeMap[
																				imgExt
																			] ||
																			"image/png",
																	},
																);
															} else {
																setPreviewPdf({
																	fileName:
																		p
																			.mediaInfo
																			.fileName,
																	base64Data:
																		p
																			.mediaInfo
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
															src={`data:${p.mediaInfo.mimeType?.startsWith("image/") ? p.mediaInfo.mimeType : ({ jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp" } as Record<string, string>)[p.mediaInfo.fileName?.split(".").pop()?.toLowerCase() ?? ""] || "image/png"};base64,${p.mediaInfo.base64Data}`}
															alt={
																p.mediaInfo
																	.fileName
															}
														/>
													) : (
														<>
															<Icon
																className="size-8 shrink-0 text-muted-foreground"
																strokeWidth={
																	1.25
																}
															/>
															<span className="max-w-16 truncate font-medium text-[10px] text-muted-foreground uppercase">
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
								key={`${message.id}-text-${i}`}
								dir="auto"
								className="whitespace-pre-wrap text-foreground text-small"
							>
								{p.text}
							</span>
						))}
					</div>
					<div className="flex flex-row items-center gap-0.5 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
						<span className="px-2 text-muted-foreground text-xs">
							<DateDisplay date={message.dateCreated} smart />
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={message.parts.length === 0}
									onClick={() => {
										const text = message.parts
											.map((part) => {
												if (part.type === "TEXT") {
													return part.text;
												} else if (
													part.type === "MEDIA"
												) {
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
												t(
													"notifications.noCopyContent",
												),
											);
											return;
										}

										try {
											navigator.clipboard.writeText(text);

											toast.success(
												t("notifications.copySuccess"),
											);
										} catch (e) {
											toast.error(
												e instanceof Error
													? e.message
													: String(e),
											);
										}
									}}
								>
									<CopyIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t("input.copyMessage")}
							</TooltipContent>
						</Tooltip>
					</div>
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
	},
);
