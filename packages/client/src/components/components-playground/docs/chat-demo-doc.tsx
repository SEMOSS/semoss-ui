import { Shell } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";
import {
	ChatProvider,
	ChatRoomsProvider,
	useChatContext,
	useChatRoomsContext,
} from "@semoss/chat";
import {
	ChatInput,
	McpMenuButton,
	MessageBubble,
	MessageList,
	PromptOptimizer,
	RoomSidebar,
} from "@semoss/chat/components";
import { DocPage } from "../doc-page";
import { useEngineConnect } from "../engine-connect-context";

const skin = {
	key: "rose-test",
	label: "Rose Test",
	description:
		"Pink mermaid mood — seashell rose, coral glow, and ocean haze",
	rightRail: "none",
	trailing: ["optimizer"],
	composerVariant: "pill",
	fontClassName: "font-serif",
	header: {
		title: "Mermaid",
		subtitle: "Tide is calm, let's explore",
		className:
			"bg-[linear-gradient(135deg,rgba(255,110,170,1)_0%,rgba(255,148,194,1)_38%,rgba(124,214,255,1)_100%)] text-white",
	},
	stageClassName:
		"flex items-center justify-center bg-[radial-gradient(circle_at_18%_20%,rgba(255,183,221,0.55)_0%,rgba(255,183,221,0)_36%),radial-gradient(circle_at_82%_12%,rgba(139,225,255,0.45)_0%,rgba(139,225,255,0)_40%),linear-gradient(160deg,rgba(255,245,252,1)_0%,rgba(240,251,255,1)_52%,rgba(229,242,255,1)_100%)] p-10",
	submitIcon: Shell,
	panelClassName:
		"h-[40rem] w-full max-w-2xl rounded-[30px] border border-[rgba(255,133,188,0.45)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,244,251,0.88)_58%,rgba(241,251,255,0.9)_100%)] shadow-[0_24px_70px_rgba(231,104,168,0.26)] backdrop-blur-sm",
	messagesClassName: "gap-2 text-[14px] leading-relaxed",
	vars: {
		"--background": "rgba(255, 249, 253, 0.97)",
		"--foreground": "rgba(74, 30, 60, 1)",
		"--card": "rgba(255, 255, 255, 0.94)",
		"--card-foreground": "rgba(74, 30, 60, 1)",
		"--border": "rgba(246, 158, 206, 0.45)",
		"--input": "rgba(255, 212, 234, 0.7)",
		"--ring": "rgba(255, 107, 171, 0.9)",
		"--muted-foreground": "rgba(124, 73, 108, 1)",
		"--accent": "rgba(255, 131, 188, 0.86)",
		"--accent-foreground": "rgba(255, 250, 255, 1)",
		"--primary": "rgba(255, 84, 162, 1)",
		"--primary-foreground": "rgba(255, 255, 255, 1)",
	} as CSSProperties,
};

function ChatDemoInner() {
	const { isTyping, sendMessage, mcp, setMcp } = useChatContext();
	const { engine } = useEngineConnect();
	const [draft, setDraft] = useState("");
	const {
		pinnedRooms,
		rooms,
		search,
		setSearch,
		isLoading,
		isLoadingMore,
		hasMore,
		loadMore,
		renameRoom,
		pinRoom,
		deleteRoom,
		setActiveRoom,
		newChat,
	} = useChatRoomsContext();

	return (
		<div className={skin.stageClassName} style={skin.vars}>
			<div
				className={`${skin.panelClassName} ${skin.fontClassName} flex overflow-hidden`}
			>
				{/* Chat Panel */}
				<div className="flex min-w-0 flex-1 flex-col">
					{/* Header */}
					<div
						className={`flex items-center gap-3 px-5 py-3 ${skin.header.className}`}
					>
						<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/25 font-semibold text-sm">
							RA
						</div>
						<div className="flex min-w-0 flex-col">
							<span className="truncate font-semibold text-sm">
								{skin.header.title}
							</span>
							<span className="flex items-center gap-1.5 text-xs opacity-90">
								<span className="size-1.5 animate-pulse rounded-full bg-green-400" />
								{skin.header.subtitle}
							</span>
						</div>
					</div>

					{/* Messages */}
					<div className="flex min-h-0 flex-1 flex-col p-4">
						<MessageList
							className={`min-h-0 flex-1 ${skin.messagesClassName}`}
							renderMessage={(message, helpers) => (
								<MessageBubble
									message={message}
									onRate={
										message.role === "assistant"
											? helpers.onRate
											: undefined
									}
									onDownload={
										message.role === "assistant"
											? helpers.onDownload
											: undefined
									}
								/>
							)}
						/>
					</div>

					{/* Composer */}
					<div className="px-4 pb-4">
						<ChatInput
							onSubmit={sendMessage}
							disabled={isTyping}
							isGenerating={isTyping}
							value={draft}
							onValueChange={setDraft}
							placeholder="Type a message"
							submitIcon={skin.submitIcon}
							trailingActions={
								<>
									<McpMenuButton
										mcp={mcp}
										onChange={setMcp}
									/>
									<PromptOptimizer
										input={draft}
										setInput={setDraft}
										disabled={isTyping}
										modelId={engine?.engineId}
									/>
								</>
							}
						/>
					</div>
				</div>

				<RoomSidebar
					className="w-64 shrink-0 border-border border-r"
					pinnedRooms={pinnedRooms}
					rooms={rooms}
					search={search}
					onSearchChange={setSearch}
					isLoading={isLoading}
					isLoadingMore={isLoadingMore}
					hasMore={hasMore}
					onLoadMore={loadMore}
					onSelectRoom={setActiveRoom}
					onNewChat={newChat}
					onRenameRoom={renameRoom}
					onPinRoom={pinRoom}
					onDeleteRoom={deleteRoom}
				/>
			</div>
		</div>
	);
}

/** Bridge component inside ChatRoomsProvider that reads activeRoomId
 * from the store and renders a keyed ChatProvider for the active room. */
function ChatDemoBridge({ engineId }: { engineId: string }) {
	const { activeRoomId } = useChatRoomsContext();

	return (
		<ChatProvider
			key={activeRoomId ?? "new"}
			options={{
				engineId,
				roomId: activeRoomId ?? undefined,
			}}
			isActive
		>
			<ChatDemoInner />
		</ChatProvider>
	);
}

export const ChatDemoDoc = () => {
	const { engine } = useEngineConnect();

	return (
		<DocPage
			title="Chat Demo"
			description="A live end-to-end demo of the @semoss/chat components wired together."
		>
			{engine ? (
				<ChatRoomsProvider>
					<ChatDemoBridge engineId={engine.engineId} />
				</ChatRoomsProvider>
			) : (
				<p className="text-muted-foreground text-sm">
					Select an engine above to start chatting.
				</p>
			)}
		</DocPage>
	);
};
