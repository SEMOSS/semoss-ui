import { observer } from "mobx-react-lite";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import { ToolViewProvider } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import { RoomProvider } from "@/contexts/room.context";
import { useChatConfig } from "@/features/chat-config/use-chat-config";
import { RoomActionsProvider } from "@/features/room-actions/room-actions.context";
import { TOOL_VIEW_LIBRARIES } from "@/features/tool-views/tool-view-libraries";
import { useChatSession } from "@/hooks/use-chat-session";
import type { RoomStore } from "@/stores/room/room.store";
import type { Engine } from "@/types";

interface RoomScopeProps {
	/** The room to open. */
	roomId: string;
	/** The host's composition of the room's pieces, which read the room from context. */
	children: ReactNode;
}

/**
 * Open a room and give its pieces what they share: the room, its insight,
 * its tool views, and its actions. A room the chat store already
 * holds shows at once; one that cannot load sends the host to a new chat.
 */
export const RoomScope = observer(({ roomId, children }: RoomScopeProps) => {
	const { chat } = useChatSession();
	const { navigation } = useChatConfig();
	const [room, setRoom] = useState<RoomStore | null>(() =>
		roomId ? chat.getCachedRoom(roomId) : null,
	);
	const selectedModelRef = useRef<Engine>(chat.models.selected);
	const openNewChatRef = useRef(navigation.openNewChat);

	useEffect(() => {
		selectedModelRef.current = chat.models.selected;
	}, [chat.models.selected]);

	useEffect(() => {
		openNewChatRef.current = navigation.openNewChat;
	}, [navigation.openNewChat]);

	useEffect(() => {
		let isCurrent = true;
		const loadRoom = async () => {
			// wait for the chat store to initialize
			if (!chat.isInitialized) {
				return;
			}

			// a cached room shows at once rather than after a spinner, and a new
			// id never shows the last room's content
			setRoom(roomId ? chat.getCachedRoom(roomId) : null);
			try {
				if (!roomId) {
					openNewChatRef.current();
					return;
				}

				const loaded = await chat.loadRoom(roomId);
				if (!isCurrent) return;

				// the room keeps its model; a room without one takes the session's
				if (!loaded.model) {
					loaded.setModel(selectedModelRef.current);
				} else {
					chat.setSelectedModel(loaded.model);
				}

				setRoom(loaded);
			} catch (e) {
				if (!isCurrent) return;
				toast.error((e as Error).message);
				openNewChatRef.current();
			}
		};

		void loadRoom();
		return () => {
			isCurrent = false;
		};
	}, [
		roomId,
		chat.getCachedRoom,
		chat.loadRoom,
		chat.setSelectedModel,
		chat.isInitialized,
	]);

	if (!room) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<InsightProvider
			key={room.roomId}
			options={{ insightId: room.insightId }}
			destroyOnUnmount={false}
		>
			<RoomProvider room={room}>
				<ToolViewProvider libraries={TOOL_VIEW_LIBRARIES}>
					{/* the header and the composer's slash menu share the room's actions */}
					<RoomActionsProvider room={room}>
						{children}
					</RoomActionsProvider>
				</ToolViewProvider>
			</RoomProvider>
		</InsightProvider>
	);
});
