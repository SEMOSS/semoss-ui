import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CopyIcon,
	DownloadIcon,
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
	Loader2Icon,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	ButtonGroup,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { decodeBase64ToBytes } from "@semoss/utility/encoding";
import { getErrorMessage } from "@semoss/utility/error";
import { getFileExtension } from "@semoss/utility/file";
import { getImageMimeType } from "@semoss/utility/image";
import { STREAMING_PLACEHOLDER_ID } from "@/constants";
import { MessageActions } from "@/features/conversation/message-actions";
import { groupToolActivity } from "@/features/conversation/tool-activity";
import { useActiveIndex } from "@/hooks/use-active-index";
import { useRoot } from "@/hooks/use-root";
import { InputMessageStore } from "@/stores/message/input-message.store";
import type { ResponseMessageStore } from "@/stores/message/response-message.store";
import type { RoomStore } from "@/stores/room/room.store";
import { ResponseMessageSubagent } from "./response-message-subagent";
import { ResponseMessageText } from "./response-message-text";
import { ResponseMessageThinking } from "./response-message-thinking";
import { ResponseMessageToolGroup } from "./response-message-tool-group";

const getExtIcon = (fileName: string) => {
	const ext = getFileExtension(fileName);
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

/**
 * Whether the message has streamed any real content yet. A freshly-created
 * streaming message starts with zero parts, so an empty array means nothing
 * has streamed. Used to tell a first view (start animations from 0) apart
 * from a return view (jump to the latest part/chunk/content).
 */
const hasStreamedContent = (parts: ResponseMessageStore["parts"]) =>
	parts.some(
		(part) =>
			(part.type === "TEXT" && part.text.length > 0) ||
			(part.type === "THINKING" && part.thinking.length > 0) ||
			part.type === "TOOL_CALL" ||
			part.type === "MEDIA",
	);

export interface ResponseMessageProps {
	/** Room */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;

	/** Tool-only messages folded into this one — see room-content.tsx */
	subsequentTools?: ResponseMessageStore[];
}

export const ResponseMessage = observer(
	({ room, message, subsequentTools = [] }: ResponseMessageProps) => {
		const { t } = useTranslation("chat");
		const { root } = useRoot();

		const allParts = [
			...message.parts,
			...subsequentTools.flatMap((sub) => sub.parts),
		];

		const isThinking =
			message.isThinking || subsequentTools.some((m) => m.isThinking);

		const [previewPdf, setPreviewPdf] = useState<{
			fileName: string;
			base64Data: string;
		} | null>(null);
		const [previewImage, setPreviewImage] = useState<{
			fileName: string;
			base64Data: string;
			mimeType: string;
		} | null>(null);
		const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
		const [downloadingFormat, setDownloadingFormat] = useState<
			string | null
		>(null);
		const [isFeedbackTextOpen, setIsFeedbackTextOpen] = useState(false);
		const [feedbackText, setFeedbackText] = useState(
			message.feedback?.feedbackText ?? "",
		);
		const [pendingRating, setPendingRating] = useState<boolean | null>(
			null,
		);
		const feedbackTextRef = useRef<HTMLTextAreaElement>(null);
		const actionTriggerRef = useRef<HTMLButtonElement | null>(null);

		// Captured once at mount: was this the first time we saw this message
		// stream (it had no content yet), or are we returning to one already in
		// progress? Drives whether animations play from 0 or jump to the latest
		// part/chunk/content. Anchored here at the message level so a late-
		// mounting part (e.g. text revealed after thinking) still inherits the
		// correct decision instead of inferring it from its own mount.
		const [isFirstView] = useState(() => !hasStreamedContent(allParts));

		// Sequential reveal queue: parts animate in order, each waiting for the
		// part above to finish. Text parts type via their own nested typewriter;
		// thinking/media/tool parts snap to their final state but still wait their
		// turn. Once the message stops streaming, every part renders in full. On a
		// return view, seed at the latest part to jump straight to the frontier.
		const { chunkCallbacks, getChunkStatus } = useActiveIndex(
			allParts.length,
			isThinking,
			undefined,
			!isFirstView,
		);

		// Non-text parts (thinking, media, tools) snap to their final state, so
		// advance the queue past the active one the moment it's reached — the next
		// part can then reveal. Text parts report their own completion once their
		// typewriter catches up, so they're skipped here. Runs after every render
		// (no dep array): each advance re-renders, which re-runs this and cascades
		// to the next part until it lands on a text part or a part the hook holds
		// (the last one while streaming), where the advance call bails harmlessly.
		useEffect(() => {
			for (let i = 0; i < allParts.length; i++) {
				if (getChunkStatus(i) !== "active") continue;
				if (allParts[i].type !== "TEXT") {
					chunkCallbacks[i]();
				}
				break;
			}
		});

		// get the parent input message
		let inputMessage: InputMessageStore | null = null;
		if (message.parent instanceof InputMessageStore) {
			inputMessage = message.parent;
		}

		const feedbackTextEnabled =
			!!root.theme.featureFlags?.enableFeedbackText;

		/**
		 * Record the feedback
		 * @param rating - positive or negative
		 */
		const recordFeedback = async (rating: boolean) => {
			const isDeleting = message.feedback?.rating === rating;

			if (feedbackTextEnabled && !isDeleting) {
				// Open text input for the user to optionally add a comment
				setPendingRating(rating);
				setFeedbackText("");
				setIsFeedbackTextOpen(true);
				return;
			}

			try {
				await message.recordFeedback(isDeleting ? null : rating);
				if (isDeleting) {
					setFeedbackText("");
					setIsFeedbackTextOpen(false);
				} else {
					toast.success(t("notifications.feedbackSuccess"));
				}
			} catch (e: unknown) {
				toast.error(getErrorMessage(e));
			}
		};

		/**
		 * Submit the feedback with optional text comment
		 */
		const submitFeedbackText = async () => {
			if (pendingRating === null) return;
			try {
				await message.recordFeedback(
					pendingRating,
					feedbackText.trim(),
				);
				toast.success(t("notifications.feedbackSuccess"));
				setIsFeedbackTextOpen(false);
				setPendingRating(null);
			} catch (e: unknown) {
				toast.error(getErrorMessage(e));
			}
		};

		/**
		 * Rewrite the message
		 */
		const rewriteMessage = async () => {
			try {
				await message.rewriteMessage();

				toast.success(t("notifications.rewriteSuccess"));
			} catch (e: unknown) {
				toast.error(getErrorMessage(e));
			}
		};

		const downloadResponse = async (format: "word" | "pdf") => {
			setDownloadingFormat(format);
			try {
				await message.downloadResponse(format);
				toast.success(
					`Response downloaded successfully as ${format.toUpperCase()}`,
				);
				setIsDownloadDialogOpen(false);
			} catch (e: unknown) {
				toast.error(
					getErrorMessage(e) || "Failed to download response",
				);
			} finally {
				setDownloadingFormat(null);
			}
		};

		/**
		 * Copy image to clipboard
		 */
		const copyImage = async () => {
			const mediaPart = message.parts.find((p) => p.type === "MEDIA");
			if (
				!mediaPart ||
				mediaPart.type !== "MEDIA" ||
				!mediaPart.mediaInfo.base64Data
			)
				return;
			try {
				const mimeType = mediaPart.mediaInfo.mimeType;
				if (!mimeType || !mimeType.startsWith("image/")) {
					toast.error("Invalid image format");
					return;
				}
				const arr = decodeBase64ToBytes(mediaPart.mediaInfo.base64Data);
				const blob = new Blob([arr], { type: mimeType });
				await navigator.clipboard.write([
					new ClipboardItem({ [mimeType]: blob }),
				]);
				toast.success(t("notifications.copySuccess"));
			} catch (e: unknown) {
				toast.error(getErrorMessage(e));
			}
		};

		const downloadFormats = [
			{ value: "word", label: "Word Document", extension: ".docx" },
			{ value: "pdf", label: "PDF Document", extension: ".pdf" },
		] as const;

		const runsByPartIdx = groupToolActivity(allParts, (id) =>
			room.getTool(id),
		);

		const hasText = message.parts.some((part) => part.type === "TEXT");

		const hasVisibleContent = message.hasVisibleContent;

		const hasImage = message.parts.some(
			(part) => part.type === "MEDIA" && part.mediaInfo.base64Data,
		);

		const parentHasContent = inputMessage?.parts.some(
			(part) => part.type === "TEXT" || part.type === "MEDIA",
		);

		return (
			<div className="group/message relative min-w-0">
				<div className="flex w-full min-w-0 flex-col gap-4">
					{allParts.map((p, pIdx) => {
						const key = `message-part-${pIdx}`;
						const status = getChunkStatus(pIdx);

						// Not this part's turn yet — wait for the part above to finish.
						if (status === "not_started") {
							return null;
						}

						if (p.type === "TEXT") {
							return (
								<ResponseMessageText
									key={key}
									message={message}
									part={p}
									status={status}
									onComplete={chunkCallbacks[pIdx]}
									isFirstView={isFirstView}
								/>
							);
						} else if (p.type === "MEDIA") {
							const { Icon, ext } = getExtIcon(
								p.mediaInfo.fileName,
							);
							const isImage =
								p.mediaInfo.mimeType?.startsWith("image/") ||
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
										?.toLowerCase() ?? "",
								);
							const imgSrc =
								isImage && p.mediaInfo.base64Data
									? `data:${p.mediaInfo.mimeType?.startsWith("image/") ? p.mediaInfo.mimeType : getImageMimeType(getFileExtension(p.mediaInfo.fileName))};base64,${p.mediaInfo.base64Data}`
									: "";
							const handleClick = () => {
								if (isImage && p.mediaInfo.base64Data) {
									const imgExt =
										p.mediaInfo.fileName
											?.split(".")
											.pop()
											?.toLowerCase() ?? "png";
									const mimeMap: Record<string, string> = {
										jpg: "image/jpeg",
										jpeg: "image/jpeg",
										gif: "image/gif",
										webp: "image/webp",
										svg: "image/svg+xml",
										bmp: "image/bmp",
									};
									setPreviewImage({
										fileName: p.mediaInfo.fileName,
										base64Data: p.mediaInfo.base64Data,
										mimeType:
											p.mediaInfo.mimeType ||
											mimeMap[imgExt] ||
											"image/png",
									});
								} else if (p.mediaInfo.fileLocation) {
									room.openFileSidebarPanel(
										p.mediaInfo.fileLocation,
										p.mediaInfo.fileName,
									);
								} else if (p.mediaInfo.base64Data) {
									setPreviewPdf({
										fileName: p.mediaInfo.fileName,
										base64Data: p.mediaInfo.base64Data,
									});
								}
							};
							return isImage && !!p.mediaInfo.base64Data ? (
								<Tooltip key={`${message.id}-part-${pIdx}`}>
									<TooltipTrigger asChild>
										<button
											type="button"
											className="w-fit cursor-zoom-in overflow-hidden rounded-lg border border-border"
											onClick={handleClick}
											aria-label={`View ${p.mediaInfo.fileName}`}
										>
											<img
												className="max-h-120 max-w-full object-contain"
												src={imgSrc}
												alt={p.mediaInfo.fileName}
											/>
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p className="max-w-48 truncate text-xs">
											{p.mediaInfo.fileName}
										</p>
									</TooltipContent>
								</Tooltip>
							) : (
								<div key={`${message.id}-part-${pIdx}`}>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												className="group relative flex size-22 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border bg-muted"
												onClick={handleClick}
												aria-label={`View ${p.mediaInfo.fileName}`}
											>
												<Icon
													className="size-8 shrink-0 text-muted-foreground"
													strokeWidth={1.25}
												/>
												<span className="max-w-16 truncate font-medium text-muted-foreground text-xs uppercase">
													{ext}
												</span>
											</button>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-48 truncate text-xs">
												{p.mediaInfo.fileName}
											</p>
										</TooltipContent>
									</Tooltip>
								</div>
							);
						} else if (p.type === "THINKING") {
							if (
								!p.thinking &&
								inputMessage &&
								!inputMessage.visible
							) {
								return null;
							}
							return (
								<ResponseMessageThinking
									key={key}
									message={message}
									part={p}
									status={status}
									isFirstView={isFirstView}
								/>
							);
						} else if (p.type === "TOOL_CALL") {
							const tools = runsByPartIdx.get(pIdx);
							return tools ? (
								<ResponseMessageToolGroup
									key={p.toolCall.id}
									tools={tools}
								/>
							) : null;
						} else if (p.type === "SUBAGENT") {
							return (
								<ResponseMessageSubagent
									key={key}
									message={message}
									part={p}
								/>
							);
						}

						return null;
					})}
					{!hasVisibleContent &&
						message.id !== STREAMING_PLACEHOLDER_ID && (
							<p className="text-muted-foreground text-sm italic">
								{t("response.emptyResponse")}
							</p>
						)}
				</div>

				{inputMessage && inputMessage.siblings.length > 1 && (
					<ButtonGroup className="items-center gap-0.5 pt-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("response.previousMessage")}
									disabled={
										message.isThinking ||
										!inputMessage.previousSibling
									}
									onClick={() => {
										if (!inputMessage.previousSibling) {
											return;
										}

										inputMessage.previousSibling.activateMessage();
									}}
								>
									<ArrowLeftIcon
										aria-hidden="true"
										className="rtl:-scale-x-100"
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t("response.previousMessage")}
							</TooltipContent>
						</Tooltip>
						<span className="text-muted-foreground text-xs">
							{inputMessage.position + 1}/
							{inputMessage.siblings.length}
						</span>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("response.nextMessage")}
									disabled={
										message.isThinking ||
										!inputMessage.nextSibling
									}
									onClick={() => {
										if (!inputMessage.nextSibling) {
											return;
										}

										inputMessage.nextSibling.activateMessage();
									}}
								>
									<ArrowRightIcon
										aria-hidden="true"
										className="rtl:-scale-x-100"
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t("response.nextMessage")}
							</TooltipContent>
						</Tooltip>
					</ButtonGroup>
				)}

				<MessageActions
					isDialogOpen={isDownloadDialogOpen || isFeedbackTextOpen}
				>
					{root.theme.featureFlags?.enableRewrite &&
						parentHasContent && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										disabled={
											message.isThinking ||
											!inputMessage?.parent?.parent
										}
										variant="ghost"
										size="icon-sm"
										aria-label={t(
											"response.rewriteMessage",
										)}
										onClick={() => {
											rewriteMessage();
										}}
									>
										<RefreshCwIcon aria-hidden="true" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{t("response.rewriteMessage")}
								</TooltipContent>
							</Tooltip>
						)}

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("response.goodResponse")}
								aria-pressed={message.feedback?.rating === true}
								disabled={message.isThinking}
								onClick={(event) => {
									actionTriggerRef.current =
										event.currentTarget;
									recordFeedback(true);
								}}
							>
								<ThumbsUpIcon
									aria-hidden="true"
									fill={
										message.feedback?.rating === true
											? "currentColor"
											: "none"
									}
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("response.goodResponse")}
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("response.poorResponse")}
								aria-pressed={
									message.feedback?.rating === false
								}
								disabled={message.isThinking}
								onClick={(event) => {
									actionTriggerRef.current =
										event.currentTarget;
									recordFeedback(false);
								}}
							>
								<ThumbsDownIcon
									aria-hidden="true"
									fill={
										message.feedback?.rating === false
											? "currentColor"
											: "none"
									}
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("response.poorResponse")}
						</TooltipContent>
					</Tooltip>

					{feedbackTextEnabled && isFeedbackTextOpen && (
						<Dialog
							open={isFeedbackTextOpen}
							onOpenChange={(open) => {
								if (!open) {
									setIsFeedbackTextOpen(false);
									setPendingRating(null);
									setFeedbackText("");
								}
							}}
						>
							<DialogContent
								className="sm:max-w-md"
								onCloseAutoFocus={(event) => {
									event.preventDefault();
									actionTriggerRef.current?.focus();
								}}
							>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										{pendingRating === true ? (
											<ThumbsUpIcon
												className="size-5"
												fill="currentColor"
											/>
										) : (
											<ThumbsDownIcon
												className="size-5"
												fill="currentColor"
											/>
										)}
										{pendingRating === true
											? t("response.goodResponse")
											: t("response.poorResponse")}
									</DialogTitle>
								</DialogHeader>
								<Textarea
									ref={feedbackTextRef}
									aria-label={t(
										"response.feedbackPlaceholder",
									)}
									placeholder={t(
										"response.feedbackPlaceholder",
									)}
									value={feedbackText}
									onChange={(e) =>
										setFeedbackText(e.target.value)
									}
									rows={3}
									className="text-sm"
								/>
								<div className="flex justify-end gap-2">
									<Button
										variant="ghost"
										onClick={() => {
											setIsFeedbackTextOpen(false);
											setPendingRating(null);
											setFeedbackText("");
										}}
									>
										{t("response.feedbackCancel")}
									</Button>
									<Button onClick={submitFeedbackText}>
										{t("response.feedbackSubmit")}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					)}

					{hasImage && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("response.copyResponse")}
									disabled={message.isThinking}
									onClick={copyImage}
								>
									<CopyIcon aria-hidden="true" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t("response.copyResponse")}
							</TooltipContent>
						</Tooltip>
					)}

					{hasText && (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={t("response.copyResponse")}
										disabled={
											message.isThinking ||
											message.parts.length === 0
										}
										onClick={async () => {
											const text = allParts
												.map((part) => {
													if (part.type === "TEXT") {
														return part.text;
													} else if (
														part.type === "MEDIA"
													) {
														return `<${part.mediaInfo.fileName}?`;
													} else if (
														part.type ===
														"TOOL_CALL"
													) {
														return `<${part.toolCall.name}?`;
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
												await navigator.clipboard.writeText(
													text,
												);

												toast.success(
													t(
														"notifications.copySuccess",
													),
												);
											} catch (e: unknown) {
												toast.error(getErrorMessage(e));
											}
										}}
									>
										<CopyIcon aria-hidden="true" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{t("response.copyResponse")}
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={t("Download Response")}
										disabled={
											message.isThinking ||
											message.parts.length === 0
										}
										onClick={(event) => {
											actionTriggerRef.current =
												event.currentTarget;
											setIsDownloadDialogOpen(true);
										}}
									>
										<DownloadIcon aria-hidden="true" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{t("Download Response")}
								</TooltipContent>
							</Tooltip>
						</>
					)}
				</MessageActions>

				<Dialog
					open={isDownloadDialogOpen}
					onOpenChange={setIsDownloadDialogOpen}
				>
					<DialogContent
						className="sm:max-w-md"
						onCloseAutoFocus={(event) => {
							event.preventDefault();
							actionTriggerRef.current?.focus();
						}}
					>
						<DialogHeader>
							<DialogTitle>Download Response</DialogTitle>
							<DialogDescription>
								Choose the format for your download:
							</DialogDescription>
						</DialogHeader>
						<div className="grid grid-cols-2 gap-3 py-4">
							{downloadFormats.map((format) => (
								<Button
									key={format.value}
									variant="outline"
									className="h-auto flex-col gap-1 p-4"
									disabled={downloadingFormat !== null}
									onClick={() =>
										downloadResponse(format.value)
									}
								>
									{downloadingFormat === format.value ? (
										<Loader2Icon className="size-4 animate-spin" />
									) : (
										<>
											<span className="font-medium">
												{format.label}
											</span>
											<span className="text-muted-foreground text-xs">
												{format.extension}
											</span>
										</>
									)}
								</Button>
							))}
						</div>
					</DialogContent>
				</Dialog>

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
					<DialogContent className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-3 p-4 sm:max-w-[calc(100vw-2rem)]">
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
							<div className="flex flex-1 items-center justify-center overflow-hidden">
								<img
									className="max-h-full max-w-full rounded object-contain"
									src={`data:${previewImage.mimeType};base64,${previewImage.base64Data}`}
									alt={previewImage.fileName}
								/>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
