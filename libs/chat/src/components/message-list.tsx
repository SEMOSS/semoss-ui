import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { useChatContext } from "../chat-provider";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

export interface MessageRenderHelpers {
	/** Call with true (thumbs up) or false (thumbs down) to rate this message. */
	onRate: (rating: boolean) => void;
	/** Download the message content as Word or PDF. */
	onDownload: (format: "word" | "pdf") => Promise<void>;
}

export interface MessageListProps {
	className?: string;
	/** Override how each message renders — omit to use the default MessageBubble with feedback toolbar. */
	renderMessage?: (
		message: ChatMessage,
		helpers: MessageRenderHelpers,
	) => ReactNode;
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
 * Reads messages and typing state from the nearest `ChatProvider` context
 * and renders them via MessageBubble (with feedback toolbar wired up) or
 * a custom `renderMessage` callback. Auto-scrolls to the latest message.
 *
 * Must be rendered inside a `<ChatProvider>`.
 */
export function MessageList({
	className,
	renderMessage,
	emptyState,
}: MessageListProps) {
	const { messages, isTyping, recordFeedback, downloadMessage } =
		useChatContext();
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

	const buildHelpers = useCallback(
		(message: ChatMessage): MessageRenderHelpers => ({
			onRate: (rating: boolean) =>
				void recordFeedback(message.id, rating),
			onDownload: (format: "word" | "pdf") =>
				downloadMessage(message.id, format),
		}),
		[recordFeedback, downloadMessage],
	);

	return (
		<div
			data-slot="message-list"
			className={cn("flex flex-col gap-2 overflow-y-auto", className)}
		>
			{isEmpty
				? emptyState
				: messages.map((message) => {
						const helpers = buildHelpers(message);
						return (
							<div key={message.id} data-slot="message-list-item">
								{renderMessage ? (
									renderMessage(message, helpers)
								) : (
									<MessageBubble
										message={message}
										onRate={helpers.onRate}
										onDownload={helpers.onDownload}
									/>
								)}
							</div>
						);
					})}
			{isWaitingForFirstChunk ? <TypingIndicator /> : null}
			<div data-slot="message-list-anchor" ref={bottomRef} />
		</div>
	);
}
