import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	ScrollArea,
} from "@semoss/ui/next";
import { useChatContext } from "../contexts/chat-provider";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { MessageBubble, type ToolResponseDetails } from "./message-bubble";
import { ToolResponseSidebar } from "./tool-response-sidebar";
import { TypingIndicator } from "./typing-indicator";

export interface MessageRenderHelpers {
	openToolResponse: (tool: ToolResponseDetails) => void;
	openFile: (file: { fileName: string; path: string }) => void;
	/** Call with true (thumbs up) or false (thumbs down) to rate this message. */
	onRate: (rating: boolean) => void;
	/** Download the message content as Word or PDF. */
	onDownload: (format: "word" | "pdf") => Promise<void>;
}

export interface MessageListProps {
	className?: string;
	roomId?: string | null;
	/** Override how each message renders — omit to use the default MessageBubble with feedback toolbar. */
	renderMessage?: (
		message: ChatMessage,
		helpers: MessageRenderHelpers,
	) => ReactNode;
	/** Shown when there are no messages yet and nothing is streaming. */
	emptyState?: ReactNode;
	/** Override the waiting-for-first-chunk indicator — omit to use the
	 * default rotating-message TypingIndicator. Same escape hatch as
	 * `renderMessage`, for consumers whose product needs a different loading
	 * treatment (e.g. a bouncing-dots style) without forking this component. */
	renderTypingIndicator?: () => ReactNode;
	/** Optional handler to open a selected tool response in a side panel. */
	onOpenToolResponse?: (tool: ToolResponseDetails) => void;
	/** Optional handler to open an attached file in a side panel. */
	onOpenFile?: (file: { fileName: string; path: string }) => void;
}

function totalStreamedChars(messages: ChatMessage[]): number {
	let total = 0;
	for (const message of messages) {
		for (const part of message.parts) {
			if (part.type === "text" || part.type === "thinking") {
				total += part.text.length;
			}
		}
	}
	return total;
}

/**
 * Reads messages and typing state from the nearest `ChatProvider` context
 * and renders them via MessageBubble (with feedback toolbar wired up) or
 * a custom `renderMessage` callback. Auto-scrolls to the latest message.
 *
 * Must be rendered inside a `<ChatProvider>`.
 */
export function MessageList({
	className,
	roomId,
	renderMessage,
	emptyState,
	onOpenToolResponse,
	onOpenFile,
	renderTypingIndicator,
}: MessageListProps) {
	const { messages, isTyping, recordFeedback, downloadMessage } =
		useChatContext();
	const bottomRef = useRef<HTMLDivElement>(null);
	const [localToolResponse, setLocalToolResponse] =
		useState<ToolResponseDetails | null>(null);
	const streamedChars = totalStreamedChars(messages);
	const openToolResponse = onOpenToolResponse ?? setLocalToolResponse;
	const sidebarTool = onOpenToolResponse ? null : localToolResponse;

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — re-scroll whenever the message count, typing state, or streamed content grows, even though the effect body doesn't read any of these directly.
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages.length, isTyping, streamedChars]);

	const lastMessage = messages[messages.length - 1];
	const isWaitingForFirstChunk =
		isTyping &&
		(!lastMessage ||
			lastMessage.role !== "assistant" ||
			lastMessage.parts.length === 0);
	const isEmpty = messages.length === 0 && !isTyping;

	const buildHelpers = useCallback(
		(message: ChatMessage): MessageRenderHelpers => ({
			openToolResponse: (tool) => openToolResponse(tool),
			openFile: (file) => onOpenFile?.(file),
			onRate: (rating: boolean) =>
				void recordFeedback(message.id, rating),
			onDownload: (format: "word" | "pdf") =>
				downloadMessage(message.id, format),
		}),
		[downloadMessage, onOpenFile, openToolResponse, recordFeedback],
	);

	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="h-full min-h-0 w-full overflow-hidden"
		>
			<ResizablePanel className="min-w-0">
				<ScrollArea
					data-slot="message-list"
					className={cn(
						"[&_[data-slot=scroll-area-viewport]>div]:block! h-full w-full overflow-hidden",
						className,
					)}
				>
					<div className="flex min-h-full flex-col gap-2">
						{isEmpty
							? emptyState
							: messages.map((message) => {
									const helpers = buildHelpers(message);
									return (
										<div
											key={message.id}
											data-slot="message-list-item"
										>
											{renderMessage ? (
												renderMessage(message, helpers)
											) : (
												<MessageBubble
													message={message}
													roomId={roomId}
													onOpenToolResponse={
														helpers.openToolResponse
													}
													onOpenFile={
														helpers.openFile
													}
													onRate={helpers.onRate}
													onDownload={
														helpers.onDownload
													}
												/>
											)}
										</div>
									);
								})}
						{isWaitingForFirstChunk
							? (renderTypingIndicator?.() ?? <TypingIndicator />)
							: null}
						<div data-slot="message-list-anchor" ref={bottomRef} />
					</div>
				</ScrollArea>
			</ResizablePanel>
			{sidebarTool && (
				<>
					<ResizableHandle withHandle />
					<ResizablePanel
						defaultSize={40}
						minSize={20}
						className="min-w-0 p-2 ps-0"
					>
						<ToolResponseSidebar
							tool={sidebarTool}
							onClose={() => setLocalToolResponse(null)}
						/>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}
