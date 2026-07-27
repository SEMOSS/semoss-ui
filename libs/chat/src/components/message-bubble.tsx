import {
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
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@semoss/ui";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	ChatMessage,
	ChatMessagePart,
	ChatToolCallPart,
	ChatToolResultPart,
} from "../types";
import { createMarkdownComponents } from "./markdown-components";
import { MessageFeedbackToolbar } from "./message-feedback-toolbar";
import { ToolCallView } from "./tool-call-view";

const getExtIcon = (fileName: string) => {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	if (["xls", "xlsx", "csv"].includes(ext)) {
		return { Icon: FileSpreadsheetIcon, ext };
	}
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
	) {
		return { Icon: FileCodeIcon, ext };
	}
	if (["sh", "bash", "zsh", "bat", "ps1"].includes(ext)) {
		return { Icon: FileTerminalIcon, ext };
	}
	if (ext === "json") {
		return { Icon: FileJsonIcon, ext };
	}
	if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) {
		return { Icon: FileArchiveIcon, ext };
	}
	if (["ppt", "pptx"].includes(ext)) {
		return { Icon: FileChartPieIcon, ext };
	}
	if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) {
		return { Icon: FileAudioIcon, ext };
	}
	if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
		return { Icon: FileVideoIcon, ext };
	}
	if (["html", "xml", "md", "mdx", "rtf"].includes(ext)) {
		return { Icon: FileTypeIcon, ext };
	}
	if (ext === "pdf") {
		return { Icon: FileBadgeIcon, ext };
	}
	if (["doc", "docx", "msg", "txt"].includes(ext)) {
		return { Icon: FileTextIcon, ext };
	}
	return { Icon: FileIcon, ext };
};

function isImageMedia(part: {
	mediaInfo: { fileName: string; mimeType?: string };
}): boolean {
	return (
		part.mediaInfo.mimeType?.startsWith("image/") ??
		["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "img"].includes(
			part.mediaInfo.fileName?.split(".").pop()?.toLowerCase() ?? "",
		)
	);
}

function resolveImageMimeType(part: {
	mediaInfo: { fileName: string; mimeType?: string };
}): string {
	if (part.mediaInfo.mimeType?.startsWith("image/")) {
		return part.mediaInfo.mimeType;
	}
	const ext = part.mediaInfo.fileName?.split(".").pop()?.toLowerCase() ?? "";
	const mimeMap: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		webp: "image/webp",
		svg: "image/svg+xml",
		bmp: "image/bmp",
	};
	return mimeMap[ext] ?? "image/png";
}

export interface ToolResponseDetails {
	id: string;
	messageId?: string;
	roomId?: string | null;
	name: string;
	status: "running" | "success" | "error";
	arguments?: Record<string, unknown>;
	output?: string;
	originalName?: string;
	title?: string;
	_meta?: ChatToolCallPart["_meta"];
}

export interface MessageBubbleProps {
	message: ChatMessage;
	className?: string;
	roomId?: string | null;
	/**
	 * Thumbs up/down/copy/download action row under a completed assistant
	 * response — omit `onRate` to leave the row off entirely (e.g. a host
	 * not wired up to ChatSession.recordFeedback yet). Never shown for user
	 * messages, error messages, or a still-streaming response — matches
	 * playground's own response-message.tsx gating.
	 */
	onRate?: (rating: boolean) => void;
	onDownload?: (format: "word" | "pdf") => Promise<void>;
	onOpenToolResponse?: (tool: ToolResponseDetails) => void;
	onOpenFile?: (file: { fileName: string; path: string }) => void;
}

function findToolResult(
	parts: ChatMessagePart[],
	toolCallId: string,
): ChatToolResultPart | undefined {
	return parts.find(
		(part): part is ChatToolResultPart =>
			part.type === "tool_result" && part.toolCallId === toolCallId,
	);
}

/**
 * Renders a single ChatMessage's parts in order — text (markdown/GFM),
 * thinking (muted, matching response-message-thinking.tsx's tone), and
 * tool calls inline via ToolCallView with a real running/success/error
 * status (derived from whether a matching tool_result part exists yet).
 * Matches playground's real structure: user messages are a bubble
 * (bg-accent); assistant messages are NOT a bubble — no background,
 * flush against the page, same as response-message.tsx. An error status
 * gets a bordered/tinted treatment using @semoss/ui's own destructive
 * tokens rather than an invented color.
 */
export function MessageBubble({
	message,
	className,
	roomId,
	onRate,
	onDownload,
	onOpenToolResponse,
	onOpenFile,
}: MessageBubbleProps) {
	const [previewPdf, setPreviewPdf] = useState<{
		fileName: string;
		base64Data: string;
	} | null>(null);
	const [previewImage, setPreviewImage] = useState<{
		fileName: string;
		base64Data: string;
		mimeType: string;
	} | null>(null);
	const isUser = message.role === "user";
	const isError = message.status === "error";
	const isStreaming = message.status === "streaming";
	const showFeedbackToolbar = !isUser && !isError && !isStreaming && !!onRate;
	// Only recomputed when streaming status flips — avoids handing Markdown
	// a new components object identity on every part-append while streaming.
	const markdownComponents = useMemo(
		() => createMarkdownComponents(isStreaming),
		[isStreaming],
	);

	return (
		<>
			<div
				data-slot="message-bubble"
				data-role={message.role}
				data-status={message.status}
				className={cn(
					"flex min-w-0 max-w-[750px] flex-col gap-2 text-foreground text-sm leading-normal [&_p+p]:mt-2 [&_p]:m-0",
					isUser &&
						"ms-auto self-stretch rounded-lg bg-accent px-4 py-3",
					!isUser && "mr-auto w-full",
					isError &&
						"rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive",
					className,
				)}
			>
				{message.parts.map((part) => {
					if (part.type === "text") {
						return (
							<Markdown
								key={part.id}
								components={markdownComponents}
							>
								{part.text}
							</Markdown>
						);
					}
					if (part.type === "thinking") {
						return (
							<p
								key={part.id}
								className="text-muted-foreground text-sm italic"
							>
								{part.text}
							</p>
						);
					}
					if (part.type === "tool_call") {
						const result = findToolResult(message.parts, part.id);
						const status = result?.status ?? "running";
						return (
							<ToolCallView
								key={part.id}
								toolName={part.name || "tool"}
								status={status}
								arguments={part.arguments}
								output={result?.output}
								onOpenInSidebar={
									onOpenToolResponse
										? () => {
												onOpenToolResponse({
													id: part.id,
													messageId: message.id,
													roomId,
													name: part.name || "tool",
													status,
													arguments: part.arguments,
													output: result?.output,
													...(part.originalName
														? {
																originalName:
																	part.originalName,
															}
														: {}),
													...(part.title
														? { title: part.title }
														: {}),
													...(part._meta
														? { _meta: part._meta }
														: {}),
												});
											}
										: undefined
								}
							/>
						);
					}
					if (part.type === "media") {
						const { Icon, ext } = getExtIcon(
							part.mediaInfo.fileName,
						);
						const isImage = isImageMedia(part);
						const imageMimeType = resolveImageMimeType(part);
						const imgSrc =
							isImage && part.mediaInfo.base64Data
								? `data:${imageMimeType};base64,${part.mediaInfo.base64Data}`
								: "";
						const handleOpen = () => {
							if (isImage && part.mediaInfo.base64Data) {
								setPreviewImage({
									fileName: part.mediaInfo.fileName,
									base64Data: part.mediaInfo.base64Data,
									mimeType: imageMimeType,
								});
								return;
							}
							if (part.mediaInfo.fileLocation) {
								if (onOpenFile) {
									onOpenFile({
										fileName: part.mediaInfo.fileName,
										path: part.mediaInfo.fileLocation,
									});
								} else {
									window.open(
										part.mediaInfo.fileLocation,
										"_blank",
									);
								}
								return;
							}
							if (part.mediaInfo.base64Data) {
								setPreviewPdf({
									fileName: part.mediaInfo.fileName,
									base64Data: part.mediaInfo.base64Data,
								});
							}
						};
						return isImage && part.mediaInfo.base64Data ? (
							<Tooltip key={part.id}>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="w-fit cursor-zoom-in overflow-hidden rounded-lg border border-border"
										onClick={handleOpen}
										aria-label={`View ${part.mediaInfo.fileName}`}
									>
										<img
											className="max-h-[480px] max-w-full object-contain"
											src={imgSrc}
											alt={part.mediaInfo.fileName}
										/>
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-48 truncate text-xs">
										{part.mediaInfo.fileName}
									</p>
								</TooltipContent>
							</Tooltip>
						) : (
							<Tooltip key={part.id}>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="group relative flex size-22 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border bg-muted"
										onClick={handleOpen}
										aria-label={`View ${part.mediaInfo.fileName}`}
									>
										<Icon
											className="size-8 shrink-0 text-muted-foreground"
											strokeWidth={1.25}
										/>
										<span className="max-w-16 truncate font-medium text-[10px] text-muted-foreground uppercase">
											{ext}
										</span>
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-48 truncate text-xs">
										{part.mediaInfo.fileName}
									</p>
								</TooltipContent>
							</Tooltip>
						);
					}
					// tool_result parts are folded into their tool_call's rendering.
					return null;
				})}
				{showFeedbackToolbar && onRate && (
					<MessageFeedbackToolbar
						rating={message.feedback?.rating}
						onRate={onRate}
						textContent={message.parts
							.filter((part) => part.type === "text")
							.map((part) => part.text)
							.join("")}
						onDownload={onDownload}
					/>
				)}
			</div>
			<Dialog
				open={!!previewPdf}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewPdf(null);
					}
				}}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>{previewPdf?.fileName}</DialogTitle>
					</DialogHeader>
					{previewPdf && (
						<iframe
							title={previewPdf.fileName}
							className="h-[70vh] w-full rounded-md border"
							src={`data:application/pdf;base64,${previewPdf.base64Data}`}
						/>
					)}
				</DialogContent>
			</Dialog>
			<Dialog
				open={!!previewImage}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewImage(null);
					}
				}}
			>
				<DialogContent className="max-w-5xl">
					<DialogHeader>
						<DialogTitle>{previewImage?.fileName}</DialogTitle>
					</DialogHeader>
					{previewImage && (
						<img
							className="max-h-[75vh] w-full object-contain"
							src={`data:${previewImage.mimeType};base64,${previewImage.base64Data}`}
							alt={previewImage.fileName}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
