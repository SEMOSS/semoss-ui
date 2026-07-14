import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

export interface MessageListProps {
	messages: ChatMessage[];
	isTyping?: boolean;
	className?: string;
	/** Override how each message renders — omit to use the default MessageBubble. */
	renderMessage?: (message: ChatMessage) => ReactNode;
	/** Shown when there are no messages yet and nothing is streaming. */
	emptyState?: ReactNode;
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
	renderMessage,
	emptyState,
}: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);
	const streamedChars = totalStreamedChars(messages);

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
		<div
			data-slot="message-list"
			className={cn("flex flex-col gap-2 overflow-y-auto", className)}
		>
			{isEmpty
				? emptyState
				: messages.map((message) => (
						<div key={message.id} data-slot="message-list-item">
							{renderMessage ? (
								renderMessage(message)
							) : (
								<MessageBubble message={message} />
							)}
						</div>
					))}
			{isWaitingForFirstChunk ? <TypingIndicator /> : null}
			<div data-slot="message-list-anchor" ref={bottomRef} />
		</div>
	);
}
