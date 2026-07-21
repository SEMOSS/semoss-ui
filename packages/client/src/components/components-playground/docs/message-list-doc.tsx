import { useState } from "react";
import { ChatProvider, useChatContext } from "@semoss/chat";
import { ChatInput, MessageBubble, MessageList } from "@semoss/chat/components";
import { Button } from "@semoss/ui/next";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { useEngineConnect } from "../engine-connect-context";
import { type PropDoc, PropsTable } from "../props-table";
import { RequiresEngine } from "../requires-engine";

const PROPS: PropDoc[] = [
	{
		name: "className",
		type: "string",
		description: "Merged onto the scroll container.",
	},
	{
		name: "renderMessage",
		type: "(message: ChatMessage, helpers: MessageRenderHelpers) => ReactNode",
		description:
			"Override the per-message renderer instead of the default MessageBubble.",
	},
	{
		name: "emptyState",
		type: "ReactNode",
		description:
			"Shown when there are no messages and nothing is streaming.",
	},
];

const MessageListDemo = ({
	useCustomRenderer,
}: {
	useCustomRenderer: boolean;
}) => {
	const { isTyping, sendMessage } = useChatContext();

	return (
		<div className="flex h-72 flex-col rounded-md border border-border">
			<MessageList
				className="min-h-0 flex-1 p-3"
				emptyState={
					<div className="py-6 text-center text-muted-foreground text-sm">
						Send a message to start the conversation.
					</div>
				}
				renderMessage={
					useCustomRenderer
						? (message, helpers) => (
								<div className="rounded-md border border-border/60 p-2">
									<MessageBubble
										message={message}
										onRate={helpers.onRate}
										onDownload={helpers.onDownload}
									/>
								</div>
							)
						: undefined
				}
			/>
			<div className="border-border border-t p-2">
				<ChatInput onSubmit={sendMessage} isGenerating={isTyping} />
			</div>
		</div>
	);
};

export const MessageListDoc = () => {
	const { engine } = useEngineConnect();
	const [useCustomRenderer, setUseCustomRenderer] = useState(false);

	return (
		<DocPage
			title="MessageList"
			description="Reads messages and typing state from the nearest ChatProvider, then renders MessageBubble by default (or your custom renderMessage callback) with auto-scroll and typing-indicator behavior built in."
		>
			<DemoSection
				preview={
					<div className="flex flex-col gap-3">
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setUseCustomRenderer((v) => !v)}
							>
								{useCustomRenderer
									? "Use default renderer"
									: "Use custom renderer"}
							</Button>
						</div>
						<RequiresEngine>
							<ChatProvider
								key={engine?.engineId}
								options={{ engineId: engine?.engineId ?? "" }}
							>
								<MessageListDemo
									useCustomRenderer={useCustomRenderer}
								/>
							</ChatProvider>
						</RequiresEngine>
					</div>
				}
				code={`import { ChatProvider, useChatContext } from "@semoss/chat";
import { ChatInput, MessageList } from "@semoss/chat/components";

// Key new chats by engineId; key resumed chats by roomId.
const { isTyping, sendMessage } = useChatContext();

<ChatProvider key={roomId ?? engineId} options={{ engineId, roomId }}>
	<MessageList className="flex-1" />
	<ChatInput onSubmit={sendMessage} isGenerating={isTyping} />
</ChatProvider>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
