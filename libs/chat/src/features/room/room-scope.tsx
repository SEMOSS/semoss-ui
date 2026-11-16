import { type ReactNode, useEffect, useRef, useState } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import { ToolViewProvider } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import type { Engine } from "../../types";
import { useChatSelector } from "../chat/use-chat-selector";
import { useChatSession } from "../chat/use-chat-session";
import { useChatConfig } from "../chat-config/use-chat-config";
import { RoomActionsProvider } from "../room-actions/room-actions.context";
import { TOOL_VIEW_LIBRARIES } from "../tool-views/tool-view-libraries";
import { RoomProvider } from "./room.context";
import type { RoomStore } from "./room.store";
import { useRoomSelector } from "./use-room-selector";

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
export const RoomScope = ({ roomId, children }: RoomScopeProps) => {
	const { chat } = useChatSession();
	const { navigation } = useChatConfig();
	const [room, setRoom] = useState<RoomStore | null>(() =>
		roomId ? chat.getCachedRoom(roomId) : null,
	);
	const { selectedModel, isInitialized } = useChatSelector(
		chat,
		(current) => ({
			selectedModel: current.models.selected,
			isInitialized: current.isInitialized,
		}),
	);
	const { roomKey, insightId } =
		useRoomSelector(room, (current) => ({
			roomKey: current.roomId,
			insightId: current.insightId,
		})) ?? {};
	const selectedModelRef = useRef<Engine>(selectedModel);
	const openNewChatRef = useRef(navigation.openNewChat);

	useEffect(() => {
		selectedModelRef.current = selectedModel;
	}, [selectedModel]);

	useEffect(() => {
		openNewChatRef.current = navigation.openNewChat;
	}, [navigation.openNewChat]);

	useEffect(() => {
		let isCurrent = true;
		const loadRoom = async () => {
			// wait for the chat store to initialize
			if (!isInitialized) {
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
		isInitialized,
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
			key={roomKey}
			options={{ insightId }}
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
};
