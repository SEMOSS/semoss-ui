import { type ReactNode, useState } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@semoss/ui/next";
import type { ChatOptions } from "../chat-options";
import { ChatProvider, useChatContext } from "../chat-provider";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { ChatInput } from "./chat-input";
import type { ToolResponseDetails } from "./message-bubble";
import { MessageList, type MessageRenderHelpers } from "./message-list";
import { ToolResponseSidebar } from "./tool-response-sidebar";

export interface ChatPanelProps {
	/** Passed straight through to ChatProvider — this component owns the chat session. */
	options: ChatOptions;
	/** Passed to ChatProvider to control global imperative targeting. */
	isActive?: boolean;
	className?: string;
	placeholder?: string;
	emptyState?: ReactNode;
	renderMessage?: (
		message: ChatMessage,
		helpers: MessageRenderHelpers,
	) => ReactNode;
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
	const { messages, isTyping, roomId, sendMessage } = useChatContext();
	const [activeToolResponse, setActiveToolResponse] =
		useState<ToolResponseDetails | null>(null);

	return (
		<div
			data-slot="chat-panel"
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden",
				className,
			)}
		>
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full min-h-0 w-full flex-1 overflow-hidden"
			>
				<ResizablePanel className="min-w-0">
					<div className="flex h-full min-h-0 flex-col gap-2">
						<MessageList
							messages={messages}
							isTyping={isTyping}
							roomId={roomId}
							className="min-h-0 flex-1"
							renderMessage={renderMessage}
							emptyState={emptyState}
							onOpenToolResponse={setActiveToolResponse}
						/>
						<ChatInput
							onSubmit={sendMessage}
							disabled={isTyping}
							placeholder={placeholder}
						/>
					</div>
				</ResizablePanel>
				{activeToolResponse && (
					<>
						<ResizableHandle withHandle />
						<ResizablePanel
							defaultSize={40}
							minSize={20}
							className="min-w-0 p-2 ps-0"
						>
							<ToolResponseSidebar
								tool={activeToolResponse}
								onClose={() => setActiveToolResponse(null)}
							/>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
}
