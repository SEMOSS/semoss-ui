import { type ReactNode, useEffect, useRef, useState } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@semoss/ui/next";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { MessageBubble, type ToolResponseDetails } from "./message-bubble";
import { ToolResponseSidebar } from "./tool-response-sidebar";
import { TypingIndicator } from "./typing-indicator";

export interface MessageRenderHelpers {
	openToolResponse: (tool: ToolResponseDetails) => void;
}

export interface MessageListProps {
	messages: ChatMessage[];
	isTyping?: boolean;
	className?: string;
	roomId?: string | null;
	/** Override how each message renders — omit to use the default MessageBubble. */
	renderMessage?: (
		message: ChatMessage,
		helpers: MessageRenderHelpers,
	) => ReactNode;
	/** Shown when there are no messages yet and nothing is streaming. */
	emptyState?: ReactNode;
	/** Optional handler to open a selected tool response in a side panel. */
	onOpenToolResponse?: (tool: ToolResponseDetails) => void;
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
 * Composes MessageBubble + a generic TypingIndicator for the gap before
 * any content has streamed in, and auto-scrolls to the latest message.
 * Tool-call state renders inline within each message via MessageBubble
 * now (see ChatMessage's parts model) — there's no separate
 * floating ToolCallView/activeTool concept anymore. For a fully custom
 * message look, pass `renderMessage` instead of swapping out this whole
 * component.
 */
export function MessageList({
	messages,
	isTyping = false,
	className,
	roomId,
	renderMessage,
	emptyState,
	onOpenToolResponse,
}: MessageListProps) {
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

	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="h-full min-h-0 w-full overflow-hidden"
		>
			<ResizablePanel className="min-w-0">
				<div
					data-slot="message-list"
					className={cn(
						"flex h-full flex-col gap-2 overflow-y-auto",
						className,
					)}
				>
					{isEmpty
						? emptyState
						: messages.map((message) => (
								<div
									key={message.id}
									data-slot="message-list-item"
								>
									{renderMessage ? (
										renderMessage(message, {
											openToolResponse,
										})
									) : (
										<MessageBubble
											message={message}
											roomId={roomId}
											onOpenToolResponse={
												openToolResponse
											}
										/>
									)}
								</div>
							))}
					{isWaitingForFirstChunk ? <TypingIndicator /> : null}
					<div data-slot="message-list-anchor" ref={bottomRef} />
				</div>
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
