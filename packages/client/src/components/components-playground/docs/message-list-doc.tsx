import { useState } from "react";
import { MessageList } from "@semoss/chat/components";
import { Button } from "@semoss/ui/next";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { SAMPLE_MESSAGES, TOOL_CALL_MESSAGE } from "../fixtures";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "messages",
		type: "ChatMessage[]",
		required: true,
		description: "Rendered in order via MessageBubble by default.",
	},
	{
		name: "isTyping",
		type: "boolean",
		description: "Shows a TypingIndicator below the last message.",
	},
	{
		name: "className",
		type: "string",
		description: "Merged onto the scroll container.",
	},
	{
		name: "renderMessage",
		type: "(message: ChatMessage) => ReactNode",
		description:
			"Override the per-message renderer instead of the default MessageBubble.",
	},
	{
		name: "emptyState",
		type: "ReactNode",
		description: "Shown when messages is empty.",
	},
];

export const MessageListDoc = () => {
	const [isTyping, setIsTyping] = useState(false);
	const [showToolCall, setShowToolCall] = useState(false);

	const messages = showToolCall
		? [...SAMPLE_MESSAGES, TOOL_CALL_MESSAGE]
		: SAMPLE_MESSAGES;

	return (
		<DocPage
			title="MessageList"
			description="Composes MessageBubble + a TypingIndicator for the gap before any content arrives. Tool calls render inline via each message's parts — no separate floating tool indicator."
		>
			<DemoSection
				preview={
					<div className="flex flex-col gap-3">
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsTyping((v) => !v)}
							>
								{isTyping ? "Stop typing" : "Start typing"}
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setShowToolCall((v) => !v)}
							>
								{showToolCall
									? "Hide tool call"
									: "Show tool call"}
							</Button>
						</div>
						<div className="h-72 rounded-md border border-border">
							<MessageList
								messages={messages}
								isTyping={isTyping}
								className="h-full p-3"
							/>
						</div>
					</div>
				}
				code={`import { MessageList } from "@semoss/chat/components";

const { messages, isTyping } = useChat({ engineId, roomId });

<MessageList messages={messages} isTyping={isTyping} className="h-full" />`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
