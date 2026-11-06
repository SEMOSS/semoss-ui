import { type ReactNode, useEffect, useRef, useState } from "react";
import {
	InsightProvider,
	useOptionalRoomSelector,
	useRoomsClient,
} from "@semoss/sdk/react";
import { type ToolViewLibraries, ToolViewProvider } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import { FileDragProvider } from "../../contexts/file-drag.context";
import { RoomProvider } from "../../contexts/room.context";
import { useChat } from "../../host/chat.context";
import type { Engine } from "../../types";
import { RoomActionsProvider } from "../room-actions/room-actions.context";
import { RoomHeader } from "../room-header/room-header";
import { FittedRoomLayout } from "../workbench/fitted-room-layout";
import type { RoomUiStore } from "../workbench/room-ui.store";
import { RoomWorkbench } from "../workbench/room-workbench";
import { RoomContent } from "./room-content";

/** Tool views draw from no libraries when the host gives none. */
const NO_TOOL_VIEW_LIBRARIES: ToolViewLibraries = {};

/** Props for {@link RoomView}. */
export interface RoomViewProps {
	/** The room to show. */
	roomId: string;
	/** What the header puts before the room's name, such as navigation. */
	headerLeading?: ReactNode;
}

/**
 * A room: its header, its conversation, and its Workspace (when the host
 * has Workspace panels). A room that fails to load is left through the
 * host's navigation.
 *
 * @component
 */
export const RoomView = ({ roomId, headerLeading }: RoomViewProps) => {
	const { chat, config } = useChat();
	const { onLeaveRoom } = config.navigation;

	/**
	 * State
	 */
	// A room the new-chat page just created is already cached, so it shows
	// straight away instead of after a spinner.
	const [room, setRoom] = useState<RoomUiStore | null>(() =>
		roomId ? chat.getCachedRoom(roomId) : null,
	);
	const { selectedModel, isChatInitialized } = useRoomsClient(chat, (c) => ({
		selectedModel: c.models.selected,
		isChatInitialized: c.isInitialized,
	}));
	const selectedModelRef = useRef<Engine>(selectedModel);
	// the room's insight, which loading it binds
	const insightId = useOptionalRoomSelector(room, (r) => r.insightId, "");

	/**
	 * Effects
	 */
	// keep ref updated
	useEffect(() => {
		selectedModelRef.current = selectedModel;
	}, [selectedModel]);

	// load the room
	useEffect(() => {
		let isCurrent = true;
		const loadRoom = async () => {
			// if chat isn't initialized yet, wait for it to initialize
			if (!isChatInitialized) {
				return;
			}

			// Reset room state when roomId changes to prevent stale content
			// flash; a cached room shows at once rather than after a spinner
			setRoom(roomId ? chat.getCachedRoom(roomId) : null);
			try {
				if (!roomId) {
					onLeaveRoom();
					return;
				}

				const room = await chat.loadRoom(roomId);
				if (!isCurrent) return;

				// update the model based on the room
				if (!room.model) {
					room.setModel(selectedModelRef.current);
				} else {
					chat.setSelectedModel(room.model);
				}

				// Set the loaded room.
				setRoom(room);
			} catch (e) {
				if (!isCurrent) return;
				// if it doesn't load successfully, go back to home
				toast.error((e as Error).message);
				onLeaveRoom();
			}
		};

		void loadRoom();
		return () => {
			isCurrent = false;
		};
	}, [
		roomId,
		onLeaveRoom,
		chat.getCachedRoom,
		chat.loadRoom,
		chat.setSelectedModel,
		isChatInitialized,
	]);

	// if there is no room, return null
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
			options={{ insightId: insightId }}
			destroyOnUnmount={false}
		>
			<RoomProvider room={room}>
				<ToolViewProvider
					libraries={
						config.toolViewLibraries ?? NO_TOOL_VIEW_LIBRARIES
					}
				>
					{/* the header and the composer's slash menu share the room's actions */}
					<RoomActionsProvider room={room}>
						<FittedRoomLayout
							room={room}
							header={
								<RoomHeader
									room={room}
									leading={headerLeading}
								/>
							}
							workbench={
								config.panelComponents ? (
									<RoomWorkbench room={room} />
								) : null
							}
						>
							<FileDragProvider>
								<RoomContent room={room} />
							</FileDragProvider>
						</FittedRoomLayout>
					</RoomActionsProvider>
				</ToolViewProvider>
			</RoomProvider>
		</InsightProvider>
	);
};
