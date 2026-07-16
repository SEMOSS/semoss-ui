import type { ReactNode } from "react";
import type { ChatOptions } from "../chat-options";
import { ChatProvider, useChatContext } from "../chat-provider";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

export interface ChatPanelProps {
	/** Passed straight through to ChatProvider — this component owns the chat session. */
	options: ChatOptions;
	/** Passed to ChatProvider to control global imperative targeting. */
	isActive?: boolean;
	className?: string;
	placeholder?: string;
	emptyState?: ReactNode;
	renderMessage?: (message: ChatMessage) => ReactNode;
}

/**
 * Batteries-included: wraps a ChatProvider and wires useChatContext()
 * straight into MessageList + ChatInput for apps that don't want to
 * think about composition at all. For anything more custom (a header
 * showing room info, a different layout), compose MessageList/ChatInput
 * yourself inside your own ChatProvider instead — that escape hatch is
 * the point of keeping them as separate exports.
 */
export function ChatPanel({
	options,
	isActive,
	className,
	placeholder,
	emptyState,
	renderMessage,
}: ChatPanelProps) {
	return (
		<ChatProvider options={options} isActive={isActive}>
			<ChatPanelInner
				className={className}
				placeholder={placeholder}
				emptyState={emptyState}
				renderMessage={renderMessage}
			/>
		</ChatProvider>
	);
}

function ChatPanelInner({
	className,
	placeholder,
	emptyState,
	renderMessage,
}: Omit<ChatPanelProps, "options">) {
	const { messages, isTyping, sendMessage } = useChatContext();

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
