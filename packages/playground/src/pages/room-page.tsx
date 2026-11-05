import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { InsightProvider } from "@semoss/sdk/react";
import { ToolViewProvider } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import { RoomContent } from "@/components/room/room-content";
import { RoomWorkbench } from "@/components/room/room-workbench";
import { FileDragProvider } from "@/contexts/file-drag-context";
import { RoomProvider } from "@/contexts/room.context";
import { RoomActionsProvider } from "@/features/room-actions/room-actions.context";
import { RoomHeader } from "@/features/room-header/room-header";
import { TOOL_VIEW_LIBRARIES } from "@/features/tool-views/tool-view-libraries";
import { FittedRoomLayout } from "@/features/workbench/fitted-room-layout";
import { useChat } from "@/hooks/use-chat";
import type { RoomStore } from "@/stores/room/room.store";
import type { Engine } from "@/types";
/**
 * The room page: the room's header, its conversation, and its Workspace.
 *
 * @component
 */
export const RoomPage = observer(() => {
	const { roomId } = useParams();
	const { chat } = useChat();
	const navigate = useNavigate();

	/**
	 * State
	 */
	// A room the new-chat page just created is already cached, so it shows
	// straight away instead of after a spinner.
	const [room, setRoom] = useState<RoomStore | null>(() =>
		roomId ? chat.getCachedRoom(roomId) : null,
	);
	const selectedModelRef = useRef<Engine>(chat.models.selected);

	/**
	 * Effects
	 */
	// keep ref updated
	useEffect(() => {
		selectedModelRef.current = chat.models.selected;
	}, [chat.models.selected]);

	// load the room
	useEffect(() => {
		let isCurrent = true;
		const loadRoom = async () => {
			// if chat isn't initialized yet, wait for it to initialize
			if (!chat.isInitialized) {
				return;
			}

			// Reset room state when roomId changes to prevent stale content
			// flash; a cached room shows at once rather than after a spinner
			setRoom(roomId ? chat.getCachedRoom(roomId) : null);
			try {
				if (!roomId) {
					navigate("/");
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
				navigate("/");
			}
		};

		void loadRoom();
		return () => {
			isCurrent = false;
		};
	}, [
		roomId,
		navigate,
		chat.getCachedRoom,
		chat.loadRoom,
		chat.setSelectedModel,
		chat.isInitialized,
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
			options={{ insightId: room.insightId }}
			destroyOnUnmount={false}
		>
			<RoomProvider room={room}>
				<ToolViewProvider libraries={TOOL_VIEW_LIBRARIES}>
					{/* the header and the composer's slash menu share the room's actions */}
					<RoomActionsProvider room={room}>
						<FittedRoomLayout
							room={room}
							header={<RoomHeader room={room} />}
							workbench={<RoomWorkbench room={room} />}
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
});
