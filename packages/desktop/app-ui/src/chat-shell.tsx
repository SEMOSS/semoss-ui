import { useEffect, useState } from "react";
import {
	ChatProvider,
	ChatRoomsProvider,
	type Engine,
	getActiveChatRoomId,
	useChatContext,
	useChatRoomsContext,
} from "@semoss/chat";
import {
	ChatInput,
	ChatRoomsPage,
	EngineSelect,
	McpMenuButton,
	MessageList,
	PromptOptimizer,
	RoomSidebar,
	SelectionChatButton,
} from "@semoss/chat/components";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { SidebarFooter } from "./sidebar-footer";

export interface ChatShellProps {
	sidebarOpen: boolean;
	onOpenSettings: () => void;
}

/** How often to check for a lazily-created room id while in "new chat" mode
 * — see the effect below for why polling is what we've got. */
const NEW_ROOM_POLL_INTERVAL_MS = 700;

export const ChatShell = ({ sidebarOpen, onOpenSettings }: ChatShellProps) => (
	<ChatRoomsProvider>
		<ChatShellInner
			sidebarOpen={sidebarOpen}
			onOpenSettings={onOpenSettings}
		/>
	</ChatRoomsProvider>
);

const ChatShellInner = ({ sidebarOpen, onOpenSettings }: ChatShellProps) => {
	const [engine, setEngine] = useState<Engine | null>(null);
	const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"chat" | "allChats">("chat");
	// Set once a "new chat" session's first send lazily creates a room
	// server-side — used only to highlight the right row in the sidebar.
	// Deliberately kept separate from activeRoomId: activeRoomId is also
	// ChatProvider's `key` below, so folding this into it would remount the
	// whole chat session mid-send, tearing down the very ChatProvider
	// instance that just sent the first message and discarding its
	// in-flight local state — which is exactly what made the first message
	// appear to vanish until a second send forced a fresh render.
	const [liveRoomId, setLiveRoomId] = useState<string | null>(null);
	const roomsList = useChatRoomsContext();
	const { setSearch } = roomsList;

	// Same MyEngines query EngineSelect itself runs under the hood (see
	// libs/shared/src/components/engine/engine-select.tsx), called directly
	// here so we can auto-select the first result instead of waiting for a
	// manual pick.
	const {
		data: engines,
		isLoading: enginesLoading,
		isError: enginesErrored,
		error: enginesError,
	} = useIteratorPixel<Engine[], Engine>(
		(limit, offset) =>
			`META | MyEngines(engineTypes=${JSON.stringify(["MODEL"])}, metaFilters=${JSON.stringify([{ tag: "text-generation" }])}, limit=[${limit}], offset=[${offset}]);`,
		(response) => (response.length === 0 ? -1 : Number.POSITIVE_INFINITY),
		(response) => response,
		{ limit: 15 },
		[],
	);

	useEffect(() => {
		if (!engine && !enginesLoading && engines[0]) {
			setEngine(engines[0]);
		}
	}, [engine, enginesLoading, engines]);

	// ChatInput creates a room lazily on its first send — there's no
	// "room created" callback in @semoss/chat's public API yet, so this
	// polls the imperative registry (getActiveChatRoomId(), already public)
	// while sitting in "new chat" mode, then records the id (for sidebar
	// highlighting only — see liveRoomId above, NOT activeRoomId) and
	// nudges the room list to refetch so the new room shows up.
	useEffect(() => {
		if (activeRoomId !== null) {
			return;
		}
		const interval = setInterval(() => {
			const createdRoomId = getActiveChatRoomId();
			if (createdRoomId) {
				setLiveRoomId(createdRoomId);
				// roomsList only refetches when its search term actually
				// changes — there's no standalone "refetch" call in
				// useChatRoomsContext's public API, so toggling search to a
				// different value and back is what forces the new room to
				// appear in the sidebar's list.
				setSearch(" ");
				setSearch("");
			}
		}, NEW_ROOM_POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [activeRoomId, setSearch]);

	const handleSelectRoom = (roomId: string) => {
		setLiveRoomId(null);
		setActiveRoomId(roomId);
		setViewMode("chat");
	};

	const handleNewChat = () => {
		setLiveRoomId(null);
		setActiveRoomId(null);
		setViewMode("chat");
	};

	const handleAllChats = () => {
		setLiveRoomId(null);
		setViewMode("allChats");
	};

	return (
		<div className="flex h-full min-h-0">
			{sidebarOpen && viewMode === "chat" ? (
				<div className="flex w-64 shrink-0 flex-col border-border border-e">
					<RoomSidebar
						className="min-h-0 w-full flex-1 border-none"
						pinnedRooms={roomsList.pinnedRooms}
						rooms={roomsList.rooms}
						activeRoomId={activeRoomId ?? liveRoomId}
						search={roomsList.search}
						onSearchChange={roomsList.setSearch}
						isLoading={roomsList.isLoading}
						isLoadingMore={roomsList.isLoadingMore}
						hasMore={roomsList.hasMore}
						onLoadMore={roomsList.loadMore}
						onSelectRoom={handleSelectRoom}
						onNewChat={handleNewChat}
						onAllChats={handleAllChats}
						onRenameRoom={roomsList.renameRoom}
						onPinRoom={roomsList.pinRoom}
						onDeleteRoom={roomsList.deleteRoom}
					/>
					<SidebarFooter onOpenSettings={onOpenSettings} />
				</div>
			) : null}
			<main className="flex min-h-0 flex-1 flex-col">
				{viewMode === "allChats" ? (
					<ChatRoomsPage
						className="p-4"
						onSelectRoom={handleSelectRoom}
						onNewChat={handleNewChat}
						onAllChats={handleAllChats}
					/>
				) : engine ? (
					<ChatProvider
						key={activeRoomId ?? "new"}
						isActive
						options={{
							engineId: engine.engine_id,
							roomId: activeRoomId ?? undefined,
						}}
					>
						<SelectionChatButton label="Send to Chat" />
						<RoomContent
							engine={engine}
							onEngineChange={setEngine}
						/>
					</ChatProvider>
				) : enginesErrored ? (
					<div className="flex h-full items-center justify-center px-8 text-center">
						<p className="text-destructive text-sm">
							Couldn't load available engines
							{enginesError ? `: ${enginesError.message}` : "."}
						</p>
					</div>
				) : !enginesLoading && engines.length === 0 ? (
					<div className="flex h-full items-center justify-center px-8 text-center">
						<p className="text-muted-foreground text-sm">
							No text-generation models are available on this
							connection.
						</p>
					</div>
				) : (
					<div className="flex h-full items-center justify-center">
						<Spinner className="size-5 text-muted-foreground" />
					</div>
				)}
			</main>
		</div>
	);
};

const RoomContent = ({
	engine,
	onEngineChange,
}: {
	engine: Engine;
	onEngineChange: (engine: Engine) => void;
}) => {
	const { messages, isTyping, isLoadingHistory, mcp, setMcp, sendMessage } =
		useChatContext();
	const [composerValue, setComposerValue] = useState("");

	const userInfo =
		usePixel<Record<string, { name?: string }>>("GetUserInfo();");
	// GetUserInfo() keys its response by auth provider (e.g. "SAML",
	// "NATIVE", an OAuth provider name) — there's exactly one key for
	// however this connection is authenticated, so SAML/NATIVE are just the
	// two most common cases to check by name before falling back to
	// whatever key is actually present.
	const userRecord = userInfo.data
		? (userInfo.data.SAML ??
			userInfo.data.NATIVE ??
			Object.values(userInfo.data)[0])
		: undefined;

	const handleSubmit = (text: string) => {
		setComposerValue("");
		void sendMessage(text);
	};

	const trailingActions = (
		<>
			<McpMenuButton mcp={mcp} onChange={setMcp} />
			<EngineSelect
				name={engine.engine_display_name || engine.engine_name}
				value={engine.engine_id}
				onChange={onEngineChange}
			/>
			<PromptOptimizer
				input={composerValue}
				setInput={setComposerValue}
				modelId={engine.engine_id}
			/>
		</>
	);

	if (isLoadingHistory) {
		return (
			<div className="flex h-full items-center justify-center">
				<Spinner className="size-5 text-muted-foreground" />
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-5 p-8">
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="text-balance font-semibold text-3xl">
						{userRecord?.name
							? `Welcome, ${userRecord.name}`
							: "Welcome"}
					</h1>
					<p className="max-w-md text-muted-foreground text-sm">
						Ask a question, summarize a document, or run a task
						against your connected tools — this starts a new room
						once you send.
					</p>
				</div>
				<div className="w-full max-w-2xl">
					<ChatInput
						value={composerValue}
						onValueChange={setComposerValue}
						onSubmit={handleSubmit}
						disabled={isTyping}
						trailingActions={trailingActions}
						placeholder="Ask anything…"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col gap-2 p-4">
			<MessageList className="min-h-0 flex-1" />
			<ChatInput
				value={composerValue}
				onValueChange={setComposerValue}
				onSubmit={handleSubmit}
				disabled={isTyping}
				trailingActions={trailingActions}
				placeholder="Ask a follow-up…"
			/>
		</div>
	);
};
