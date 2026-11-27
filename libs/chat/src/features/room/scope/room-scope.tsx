import { type ReactNode, useEffect, useState } from "react";
import { CALENDAR_TOOL_VIEWS, MAIL_TOOL_VIEWS } from "@semoss/connectors";
import { InsightProvider } from "@semoss/sdk/react";
import { type ToolViewLibraries, ToolViewProvider } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import { useLatestRef } from "@semoss/utility/react/use-latest-ref";
import type { Engine } from "../../../types";
import { useChatConfig } from "../../chat/config/chat-config.context";
import { useChatSession } from "../../chat/provider/chat-session.context";
import { useChatSelector } from "../../chat/store/use-chat-selector";
import { RoomActionsProvider } from "../actions/room-actions.context";
import type { RoomStore } from "../store/room.store";
import { useRoomSelector } from "../store/use-room-selector";
import { RoomProvider } from "./room.context";

/**
 * The `component://` libraries tool views are drawn from. Module scope
 * matters: a new object would draw every tool view again.
 */
const TOOL_VIEW_LIBRARIES: ToolViewLibraries = {
	mail: MAIL_TOOL_VIEWS,
	calendar: CALENDAR_TOOL_VIEWS,
};

/** Which room `RoomScope` opens, and what it wraps. */
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
	const { callbacks } = useChatConfig();
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
	// refs, so a change of model or host callback does not reload the room
	const selectedModelRef = useLatestRef<Engine>(selectedModel);
	const openNewChatRef = useLatestRef(callbacks.onOpenNewChat);

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
