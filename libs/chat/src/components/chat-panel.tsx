import type { ReactNode } from "react";
import type { ChatOptions } from "../chat-options";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { useChat } from "../use-chat";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

export interface ChatPanelProps {
	/** Passed straight through to useChat() — this component owns the chat session. */
	options: ChatOptions;
	className?: string;
	placeholder?: string;
	emptyState?: ReactNode;
	renderMessage?: (message: ChatMessage) => ReactNode;
}

/**
 * Batteries-included: wires useChat() straight into MessageList + ChatInput
 * for apps that don't want to think about composition at all. For anything
 * more custom (a header showing room info, a different layout), compose
 * MessageList/ChatInput yourself with your own useChat() call instead —
 * that escape hatch is the point of keeping them as separate exports.
 */
export function ChatPanel({
	options,
	className,
	placeholder,
	emptyState,
	renderMessage,
}: ChatPanelProps) {
	const { messages, isTyping, sendMessage } = useChat(options);

	return (
		<div
			data-slot="chat-panel"
			className={cn("flex h-full min-h-0 flex-col gap-2", className)}
		>
			<MessageList
				messages={messages}
				isTyping={isTyping}
				className="min-h-0 flex-1"
				renderMessage={renderMessage}
				emptyState={emptyState}
			/>
			<ChatInput
				onSend={sendMessage}
				disabled={isTyping}
				placeholder={placeholder}
			/>
		</div>
	);
}
