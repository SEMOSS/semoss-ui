import { ChatPanel } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { useEngineConnect } from "../engine-connect-context";
import { type PropDoc, PropsTable } from "../props-table";
import { RequiresEngine } from "../requires-engine";

const PROPS: PropDoc[] = [
	{
		name: "options",
		type: "ChatOptions",
		required: true,
		description:
			"Passed straight through to useChat() — { engineId, roomId?, defaultRoomSettings?, toolAutoExecutionLimit?, gracefulErrors? }.",
	},
	{ name: "className", type: "string", description: "" },
	{ name: "placeholder", type: "string", description: "" },
	{ name: "emptyState", type: "ReactNode", description: "" },
	{
		name: "renderMessage",
		type: "(message: ChatMessage) => ReactNode",
		description: "Override the per-message renderer.",
	},
];

const ChatPanelDemo = () => {
	const { engine } = useEngineConnect();

	return (
		<div className="h-[32rem]">
			<ChatPanel options={{ engineId: engine?.engineId ?? "" }} />
		</div>
	);
};

export const ChatPanelDoc = () => {
	return (
		<DocPage
			title="ChatPanel"
			description="The batteries-included drop-in: calls useChat() itself and wires the result straight into MessageList + ChatInput. Deliberately single-mode — always calls useChat() itself, no controlled variant. Anyone needing engine/MCP composition already has the escape hatch of composing MessageList/ChatInput directly with their own useChat() call, same as chat-playground does."
		>
			<DemoSection
				description="A real, live conversation against your connected engine — this is a genuinely working chat, not a mock."
				preview={
					<RequiresEngine>
						<ChatPanelDemo />
					</RequiresEngine>
				}
				code={`import { ChatPanel } from "@semoss/chat/components";

<ChatPanel options={{ engineId }} />`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
