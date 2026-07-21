import { useMemo } from "react";
import { Markdown } from "@semoss/ui/next";
import { cn } from "../lib/utils";
import type {
	ChatMessage,
	ChatMessagePart,
	ChatToolCallPart,
	ChatToolResultPart,
} from "../types";
import { createMarkdownComponents } from "./markdown-components";
import { MessageFeedbackToolbar } from "./message-feedback-toolbar";
import { ToolCallView } from "./tool-call-view";

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
}: MessageBubbleProps) {
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
		<div
			data-slot="message-bubble"
			data-role={message.role}
			data-status={message.status}
			className={cn(
				"flex max-w-[750px] flex-col gap-2 text-foreground text-sm leading-normal [&_p+p]:mt-2 [&_p]:m-0",
				isUser && "ms-auto self-stretch rounded-lg bg-accent px-4 py-3",
				!isUser && "mr-auto w-full",
				isError &&
					"rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive",
				className,
			)}
		>
			{message.parts.map((part) => {
				if (part.type === "text") {
					return (
						<Markdown key={part.id} components={markdownComponents}>
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
	);
}
