import { ChatRoomsShell } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { useEngineConnect } from "../engine-connect-context";
import { type PropDoc, PropsTable } from "../props-table";
import { RequiresEngine } from "../requires-engine";

const PROPS: PropDoc[] = [
	{
		name: "engineId",
		type: "string",
		required: true,
		description: "Required model id used for chat requests.",
	},
	{
		name: "workspaceId",
		type: "string",
		description: "Optional workspace scope for new rooms.",
	},
	{
		name: "defaultRoomSettings",
		type: "ChatDefaultRoomSettings",
		description: "Optional defaults applied to newly created rooms.",
	},
	{
		name: "toolAutoExecutionLimit",
		type: "number",
		description: "Safety cap for auto tool execution rounds.",
	},
	{
		name: "gracefulErrors",
		type: "Record<string, string>",
		description: "Error substring map for friendlier user messages.",
	},
	{
		name: "isActive",
		type: "boolean",
		description: "Controls global imperative chat targeting.",
	},
	{
		name: "sidebarOpen",
		type: "boolean",
		description: "Initial sidebar open state.",
	},
	{
		name: "sidebarSide",
		type: '"left" | "right"',
		description: "Sidebar placement in chat view.",
	},
	{ name: "className", type: "string", description: "" },
	{ name: "sidebarClassName", type: "string", description: "" },
	{ name: "chatClassName", type: "string", description: "" },
	{ name: "allChatsClassName", type: "string", description: "" },
	{ name: "chatPlaceholder", type: "string", description: "" },
	{ name: "emptyState", type: "ReactNode", description: "" },
	{
		name: "renderMessage",
		type: "(message: ChatMessage, helpers: MessageRenderHelpers) => ReactNode",
		description: "Custom message renderer for chat view.",
	},
	{
		name: "onSelectRoom",
		type: "(roomId: string) => void",
		description: "Called when selecting a room.",
	},
	{ name: "onNewChat", type: "() => void", description: "" },
	{ name: "onAllChats", type: "() => void", description: "" },
];

const ChatRoomsShellDemo = () => {
	const { engine } = useEngineConnect();

	return (
		<div className="h-[40rem] overflow-hidden rounded-md border border-border">
			<ChatRoomsShell
				key={engine?.engineId}
				engineId={engine?.engineId ?? ""}
				className="h-full w-full"
				chatClassName="h-full"
				allChatsClassName="h-full"
				chatPlaceholder="Type a message"
			/>
		</div>
	);
};

export const ChatRoomsShellDoc = () => {
	return (
		<DocPage
			title="ChatRoomsShell"
			description="A high-level shell that wires room history, all-chats switching, and chat panel composition with built-in sidebar collapse behavior."
		>
			<DemoSection
				description="Use this when you want RoomSidebar + ChatPanel + All Chats behavior out of the box with minimal host wiring."
				preview={
					<RequiresEngine>
						<ChatRoomsShellDemo />
					</RequiresEngine>
				}
				code={`import { ChatRoomsShell } from "@semoss/chat/components";

<ChatRoomsShell
  engineId={engineId}
  sidebarSide="left"
  sidebarOpen
  chatPlaceholder="Type a message"
/>
`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
