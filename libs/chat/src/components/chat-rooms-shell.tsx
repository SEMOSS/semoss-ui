import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { ChatDefaultRoomSettings } from "../chat-options";
import { ChatRoomsProvider, useChatRoomsContext } from "../chat-rooms-provider";
import { cn } from "../lib/utils";
import type { ChatMessage } from "../types";
import { ChatPanel } from "./chat-panel";
import { ChatRoomsPage } from "./chat-rooms-page";
import type { MessageRenderHelpers } from "./message-list";
import { RoomSidebar } from "./room-sidebar";

export interface ChatRoomsShellProps {
	/** Required model id for chat requests. */
	engineId: string;
	/** Optional workspace scope for newly created rooms. */
	workspaceId?: string;
	/** Optional defaults applied to newly created rooms. */
	defaultRoomSettings?: ChatDefaultRoomSettings;
	/** Safety cap for automatic tool-execution rounds. */
	toolAutoExecutionLimit?: number;
	/** Error-substring mapping for friendlier user messages. */
	gracefulErrors?: Record<string, string>;
	/** Passed to ChatProvider to control global imperative targeting. */
	isActive?: boolean;
	/** Toggle sidebar visibility for chat view. */
	sidebarOpen?: boolean;
	className?: string;
	sidebarClassName?: string;
	chatClassName?: string;
	allChatsClassName?: string;
	chatPlaceholder?: string;
	emptyState?: ReactNode;
	renderMessage?: (
		message: ChatMessage,
		helpers: MessageRenderHelpers,
	) => ReactNode;
	/** Optional callbacks for host routing/analytics hooks. */
	onSelectRoom?: (roomId: string) => void;
	onNewChat?: () => void;
	onAllChats?: () => void;
}

/**
 * High-level rooms shell that owns sidebar/main-pane view switching.
 * Consumers can use this directly instead of manually wiring an
 * "All Chats" view mode around RoomSidebar + ChatProvider.
 */
export function ChatRoomsShell(props: ChatRoomsShellProps) {
	return (
		<ChatRoomsProvider>
			<ChatRoomsShellInner {...props} />
		</ChatRoomsProvider>
	);
}

function ChatRoomsShellInner({
	engineId,
	workspaceId,
	defaultRoomSettings,
	toolAutoExecutionLimit,
	gracefulErrors,
	isActive,
	sidebarOpen = true,
	className,
	sidebarClassName,
	chatClassName,
	allChatsClassName,
	chatPlaceholder,
	emptyState,
	renderMessage,
	onSelectRoom,
	onNewChat,
	onAllChats,
}: ChatRoomsShellProps) {
	const [viewMode, setViewMode] = useState<"chat" | "allChats">("chat");
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
		setActiveRoom,
		newChat,
	} = useChatRoomsContext();

	const chatOptions = useMemo(
		() => ({
			engineId,
			roomId: activeRoomId ?? undefined,
			workspaceId,
			defaultRoomSettings,
			toolAutoExecutionLimit,
			gracefulErrors,
		}),
		[
			activeRoomId,
			defaultRoomSettings,
			engineId,
			gracefulErrors,
			toolAutoExecutionLimit,
			workspaceId,
		],
	);

	const sessionKey = activeRoomId
		? `room:${activeRoomId}`
		: `new:${engineId}`;

	function handleSelectRoom(roomId: string) {
		setActiveRoom(roomId);
		setViewMode("chat");
		onSelectRoom?.(roomId);
	}

	function handleNewChat() {
		newChat();
		setViewMode("chat");
		onNewChat?.();
	}

	function handleAllChats() {
		setViewMode("allChats");
		onAllChats?.();
	}

	return (
		<div
			data-slot="chat-rooms-shell"
			className={cn("flex h-full min-h-0 w-full", className)}
		>
			{sidebarOpen && viewMode === "chat" ? (
				<RoomSidebar
					className={cn("min-h-0 border-none", sidebarClassName)}
					pinnedRooms={pinnedRooms}
					rooms={rooms}
					activeRoomId={activeRoomId}
					search={search}
					onSearchChange={setSearch}
					isLoading={isLoading}
					isLoadingMore={isLoadingMore}
					hasMore={hasMore}
					onLoadMore={loadMore}
					onSelectRoom={handleSelectRoom}
					onNewChat={handleNewChat}
					onAllChats={handleAllChats}
					onRenameRoom={renameRoom}
					onPinRoom={pinRoom}
					onDeleteRoom={deleteRoom}
				/>
			) : null}

			<main className="min-h-0 flex-1">
				{viewMode === "allChats" ? (
					<ChatRoomsPage
						className={cn("h-full p-4", allChatsClassName)}
						onSelectRoom={handleSelectRoom}
						onNewChat={handleNewChat}
						onAllChats={handleAllChats}
					/>
				) : (
					<ChatPanel
						key={sessionKey}
						options={chatOptions}
						isActive={isActive}
						className={cn("h-full", chatClassName)}
						placeholder={chatPlaceholder}
						emptyState={emptyState}
						renderMessage={renderMessage}
					/>
				)}
			</main>
		</div>
	);
}
