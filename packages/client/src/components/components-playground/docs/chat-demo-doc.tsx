import { Database, Shell, Wrench } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import {
	ChatProvider,
	ChatRoomsProvider,
	type MCPConfig,
	useChatContext,
	useChatRoomsContext,
} from "@semoss/chat";
import {
	ChatInput,
	ChatRoomsPage,
	ChatRoomsShell,
	McpMenuButton,
	MessageBubble,
	MessageList,
	PromptOptimizer,
	RoomSidebar,
	SelectionChatButton,
} from "@semoss/chat/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@semoss/ui/next";
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
		"flex items-center justify-center bg-[radial-gradient(circle_at_18%_20%,rgba(255,183,221,0.55)_0%,rgba(255,183,221,0)_36%),radial-gradient(circle_at_82%_12%,rgba(139,225,255,0.45)_0%,rgba(139,225,255,0)_40%),linear-gradient(160deg,rgba(255,245,252,1)_0%,rgba(240,251,255,1)_52%,rgba(229,242,255,1)_100%)] p-3 sm:p-6 lg:p-10",
	submitIcon: Shell,
	panelClassName:
		"relative h-[min(40rem,calc(100dvh-1.5rem))] w-full max-w-[58rem] rounded-[30px] border border-[rgba(255,133,188,0.45)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,244,251,0.88)_58%,rgba(241,251,255,0.9)_100%)] shadow-[0_24px_70px_rgba(231,104,168,0.26)] backdrop-blur-sm sm:h-[min(40rem,calc(100dvh-3rem))] lg:h-[min(40rem,calc(100dvh-5rem))]",
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

const HARD_CODED_TOOLS: MCPConfig[] = [
	{ type: "VECTOR", id: "kb-1", name: "Claims Knowledge Base" },
	{ type: "FUNCTION", id: "tool-1", name: "LighthouseBenefitsClaims" },
];

function ChatDemoInner({
	viewMode,
	onSelectRoom,
	onNewChat,
	onAllChats,
}: {
	viewMode: "chat" | "allChats";
	onSelectRoom: (roomId: string) => void;
	onNewChat: () => void;
	onAllChats: () => void;
}) {
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
		activeRoomId,
	} = useChatRoomsContext();

	return (
		<div className={skin.stageClassName} style={skin.vars}>
			<div
				className={`${skin.panelClassName} ${skin.fontClassName} flex overflow-hidden`}
			>
				{viewMode === "allChats" ? (
					<ChatRoomsPage
						className="min-w-0 flex-1 overflow-y-auto p-4"
						onSelectRoom={onSelectRoom}
						onNewChat={onNewChat}
						onAllChats={onAllChats}
					/>
				) : (
					/* Chat Panel */
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
										// onOpenToolResponse={helpers.openToolResponse}
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
				)}

				<RoomSidebar
					className="absolute inset-y-0 end-0 z-10 w-[min(16rem,calc(100%-3rem))] shrink-0 border-border border-r shadow-lg sm:static sm:w-64 sm:shadow-none"
					pinnedRooms={pinnedRooms}
					rooms={rooms}
					activeRoomId={activeRoomId}
					search={search}
					onSearchChange={setSearch}
					isLoading={isLoading}
					isLoadingMore={isLoadingMore}
					hasMore={hasMore}
					onLoadMore={loadMore}
					onSelectRoom={onSelectRoom}
					onNewChat={onNewChat}
					onAllChats={onAllChats}
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
export function ChatDemoBridge({ engineId }: { engineId: string }) {
	const [viewMode, setViewMode] = useState<"chat" | "allChats">("chat");
	const { activeRoomId, setActiveRoom, newChat } = useChatRoomsContext();
	const sessionKey = activeRoomId
		? `room:${activeRoomId}`
		: `new:${engineId}`;

	const handleSelectRoom = (roomId: string) => {
		setActiveRoom(roomId);
		setViewMode("chat");
	};

	const handleNewChat = () => {
		newChat();
		setViewMode("chat");
	};

	const handleAllChats = () => {
		setViewMode("allChats");
	};

	return (
		<ChatProvider
			key={sessionKey}
			options={{
				engineId,
				roomId: activeRoomId ?? undefined,
			}}
			isActive
		>
			<ChatDemoInner
				viewMode={viewMode}
				onSelectRoom={handleSelectRoom}
				onNewChat={handleNewChat}
				onAllChats={handleAllChats}
			/>
		</ChatProvider>
	);
}

function SelectionChatDrawerInner({ selectedText }: { selectedText: string }) {
	const { isTyping, sendMessage } = useChatContext();
	const sentSelection = useRef(false);

	useEffect(() => {
		if (sentSelection.current) {
			return;
		}

		sentSelection.current = true;
		void sendMessage(selectedText);
	}, [selectedText, sendMessage]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
			<MessageList
				className="min-h-0 flex-1"
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
			<ChatInput
				onSubmit={sendMessage}
				disabled={isTyping}
				isGenerating={isTyping}
				placeholder="Continue the conversation"
			/>
		</div>
	);
}

function SelectionChatDemo({ engineId }: { engineId: string }) {
	const selectionCounter = useRef(0);
	const [selection, setSelection] = useState<{
		id: number;
		text: string;
	} | null>(null);

	const handleSelection = (text: string) => {
		selectionCounter.current += 1;
		setSelection({ id: selectionCounter.current, text });
	};

	return (
		<>
			<SelectionChatButton
				label="Send selection to chat"
				onSelect={handleSelection}
			/>
			<ChatDemoBridge engineId={engineId} />
			<Sheet
				open={selection !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSelection(null);
					}
				}}
			>
				{selection ? (
					<SheetContent
						side="left"
						className="w-full max-w-md gap-0 p-0 sm:max-w-md"
					>
						<SheetHeader className="border-border border-b pe-12">
							<SheetTitle>New chat from selection</SheetTitle>
						</SheetHeader>
						<ChatProvider
							key={selection.id}
							options={{ engineId }}
							isActive
						>
							<SelectionChatDrawerInner
								selectedText={selection.text}
							/>
						</ChatProvider>
					</SheetContent>
				) : null}
			</Sheet>
		</>
	);
}

function HardCodedToolsChatInner() {
	const { isTyping, mcp, sendMessage, setMcp } = useChatContext();

	useEffect(() => {
		void setMcp(HARD_CODED_TOOLS);
	}, [setMcp]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="border-border border-b px-5 py-4">
				<h3 className="font-semibold text-base">Claims assistant</h3>
				<div className="mt-3 flex flex-wrap gap-2">
					{mcp.map((tool) => {
						const Icon = tool.type === "VECTOR" ? Database : Wrench;
						return (
							<div
								key={`${tool.type}:${tool.id}`}
								className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
							>
								<Icon className="size-3.5 text-primary" />
								<span>{tool.name}</span>
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
				<MessageList
					className="min-h-0 flex-1"
					emptyState={
						<p className="text-muted-foreground text-sm">
							Ask about a claim to let the assistant use its fixed
							knowledge and claims tools.
						</p>
					}
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
				<ChatInput
					onSubmit={sendMessage}
					disabled={isTyping}
					isGenerating={isTyping}
					placeholder="Ask about claim CLM-1042"
				/>
			</div>
		</div>
	);
}

function HardCodedToolsChat({ engineId }: { engineId: string }) {
	return (
		<ChatProvider
			options={{
				engineId,
				defaultRoomSettings: {
					instructions:
						"Use the attached claims knowledge and claims function tools whenever they are relevant. Do not invent claim details.",
				},
				toolAutoExecutionLimit: 3,
			}}
			isActive={false}
		>
			<HardCodedToolsChatInner />
		</ChatProvider>
	);
}

export const ChatDemoDoc = () => {
	const { engine } = useEngineConnect();

	return (
		<DocPage
			title="Chat Demo"
			description="A live end-to-end demo of the @semoss/chat components. Highlight text anywhere on this page to start a new chat in the left drawer."
		>
			{engine ? (
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-3">
						<div>
							<h2 className="font-semibold text-lg">
								Custom Composition
							</h2>
							<p className="text-muted-foreground text-sm">
								Manually composed with ChatProvider,
								RoomSidebar, MessageList, and ChatInput.
							</p>
						</div>
						<ChatRoomsProvider>
							<SelectionChatDemo engineId={engine.engineId} />
						</ChatRoomsProvider>
					</div>

					<div className="flex flex-col gap-3">
						<div>
							<h2 className="font-semibold text-lg">
								ChatRoomsShell
							</h2>
							<p className="text-muted-foreground text-sm">
								Built-in room shell with collapsible sidebar and
								All Chats view switching.
							</p>
						</div>
						<div className={skin.stageClassName} style={skin.vars}>
							<div
								className={`${skin.panelClassName} overflow-hidden`}
							>
								<ChatRoomsShell
									engineId={engine.engineId}
									className="h-full w-full"
									chatClassName="h-full"
									allChatsClassName="h-full"
									chatPlaceholder="Type a message"
									// renderMessage={(message, helpers) => (
									// 	<MessageBubble
									// 		message={message}
									// 		onRate={
									// 			message.role === "assistant"
									// 				? helpers.onRate
									// 				: undefined
									// 		}
									// 		onDownload={
									// 			message.role === "assistant"
									// 				? helpers.onDownload
									// 				: undefined
									// 		}
									// 	/>
									// )}
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<div>
							<h2 className="font-semibold text-lg">
								Hardcoded Tools
							</h2>
							<p className="text-muted-foreground text-sm">
								A dedicated chat with a fixed knowledge source
								and claims tool attached in code.
							</p>
						</div>
						<div className={skin.stageClassName} style={skin.vars}>
							<div
								className={`${skin.panelClassName} overflow-hidden`}
							>
								<HardCodedToolsChat
									engineId={engine.engineId}
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<p className="text-muted-foreground text-sm">
					Select an engine above to start chatting.
				</p>
			)}
		</DocPage>
	);
};
