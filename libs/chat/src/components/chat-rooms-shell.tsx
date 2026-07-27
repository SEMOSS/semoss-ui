import { PanelLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@semoss/ui";
import { Button } from "@semoss/ui/next";
import type { ChatDefaultRoomSettings } from "../chat-options";
import {
	ChatRoomsProvider,
	useChatRoomsContext,
} from "../contexts/chat-rooms-provider";
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
	/** Sidebar placement for chat view. */
	sidebarSide?: "left" | "right";
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
	sidebarSide = "left",
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
	const [isSidebarOpen, setIsSidebarOpen] = useState(sidebarOpen);
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

	useEffect(() => {
		setIsSidebarOpen(sidebarOpen);
	}, [sidebarOpen]);

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

	function toggleSidebar() {
		setIsSidebarOpen((open) => !open);
	}

	const showSidebar = viewMode === "chat" && isSidebarOpen;

	return (
		<div
			data-slot="chat-rooms-shell"
			className={cn(
				"flex h-full max-h-full min-h-0 w-full overflow-hidden",
				className,
			)}
		>
			{sidebarSide === "left" && viewMode === "chat" ? (
				<div
					className={cn(
						"h-full min-h-0 overflow-hidden transition-[width] duration-200 ease-linear",
						showSidebar ? "w-64" : "w-0",
					)}
				>
					<div
						className={cn(
							"h-full min-h-0 w-64 shrink-0 transition-all duration-200 ease-linear",
							showSidebar
								? "translate-x-0 opacity-100"
								: "-translate-x-2 pointer-events-none opacity-0",
						)}
					>
						<RoomSidebar
							className={cn(
								"min-h-0 w-64 border-none",
								sidebarClassName,
							)}
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
					</div>
				</div>
			) : null}

			<main className="flex max-h-full min-h-0 flex-1 flex-col overflow-hidden">
				{viewMode === "chat" ? (
					<div className="relative flex h-full max-h-full min-h-0 flex-col overflow-hidden">
						<div className="absolute inset-x-0 top-0 z-20 flex h-11 items-center gap-2 border-border border-b bg-background px-2 py-1.5">
							<Button
								variant="ghost"
								size="icon"
								onClick={toggleSidebar}
								aria-label={
									isSidebarOpen
										? "Hide sidebar"
										: "Show sidebar"
								}
							>
								<PanelLeftIcon className="size-4" />
							</Button>
						</div>
						<ChatPanel
							key={sessionKey}
							options={chatOptions}
							isActive={isActive}
							className={cn(
								"min-h-0 flex-1 px-4 pt-12",
								chatClassName,
							)}
							placeholder={chatPlaceholder}
							emptyState={emptyState}
							renderMessage={renderMessage}
						/>
					</div>
				) : (
					<ChatRoomsPage
						className={cn("h-full p-4", allChatsClassName)}
						onSelectRoom={handleSelectRoom}
						onNewChat={handleNewChat}
						onAllChats={handleAllChats}
					/>
				)}
			</main>

			{sidebarSide === "right" && viewMode === "chat" ? (
				<div
					className={cn(
						"h-full min-h-0 overflow-hidden transition-[width] duration-200 ease-linear",
						showSidebar ? "w-64" : "w-0",
					)}
				>
					<div
						className={cn(
							"h-full min-h-0 w-64 shrink-0 transition-all duration-200 ease-linear",
							showSidebar
								? "translate-x-0 opacity-100"
								: "pointer-events-none translate-x-2 opacity-0",
						)}
					>
						<RoomSidebar
							className={cn(
								"min-h-0 w-64 border-none",
								sidebarClassName,
							)}
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
					</div>
				</div>
			) : null}
		</div>
	);
}
