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
			"Passed straight through to ChatProvider — { engineId, roomId?, workspaceId?, defaultRoomSettings?, toolAutoExecutionLimit?, gracefulErrors? }.",
	},
	{
		name: "isActive",
		type: "boolean",
		description:
			"Passed to ChatProvider to control global imperative targeting.",
	},
	{ name: "className", type: "string", description: "" },
	{ name: "placeholder", type: "string", description: "" },
	{ name: "emptyState", type: "ReactNode", description: "" },
	{
		name: "renderMessage",
		type: "(message: ChatMessage, helpers: MessageRenderHelpers) => ReactNode",
		description: "Override the per-message renderer.",
	},
];

const ChatPanelDemo = () => {
	const { engine } = useEngineConnect();

	return (
		<div className="h-[32rem]">
			<ChatPanel
				key={engine?.engineId}
				options={{ engineId: engine?.engineId ?? "" }}
			/>
		</div>
	);
};

export const ChatPanelDoc = () => {
	return (
		<DocPage
			title="ChatPanel"
			description="The batteries-included drop-in: wraps a ChatProvider and wires useChatContext() straight into MessageList + ChatInput. Options initialize its session, so key the panel when a new chat's engine changes. Anyone needing engine/MCP composition can compose MessageList and ChatInput inside their own ChatProvider."
		>
			<DemoSection
				description="A real, live conversation against your connected engine — this is a genuinely working chat, not a mock."
				preview={
					<RequiresEngine>
						<ChatPanelDemo />
					</RequiresEngine>
				}
				code={`import { ChatPanel } from "@semoss/chat/components";

<ChatPanel key={engineId} options={{ engineId }} isActive />`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
