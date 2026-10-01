import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { InsightProvider } from "@semoss/sdk/react";
import { Spinner, toast } from "@semoss/ui/next";
import { RoomContent } from "@/components/room/room-content";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { FileDragProvider } from "@/contexts/file-drag-context";
import { ConversationWorkspace } from "@/features/conversation/conversation-workspace";
import { useChat } from "@/hooks/use-chat";
import type { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import type { Engine } from "@/types";
/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = observer(() => {
	const { roomId } = useParams();
	const { t } = useTranslation("room");
	const { chat } = useChat();
	const navigate = useNavigate();

	/**
	 * State
	 */
	const [room, setRoom] = useState<RoomStore | null>(null);
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

			// Reset room state when roomId changes to prevent stale content flash
			setRoom(null);
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
			<ConversationWorkspace
				isOpen={room.sidebar.isOpen}
				onOpenWorkArea={() => {
					if (
						room.workbench.getState().layout.openPanelIds.length ===
						0
					) {
						room.openSidebarPanel(
							ROOM_PANEL_TYPES.CONFIGURATION,
							{},
							t("settings.panelTitle"),
						);
					} else room.openSidebar();
				}}
				panel={<RoomSidebar room={room} />}
			>
				<FileDragProvider>
					<RoomContent room={room} />
				</FileDragProvider>
			</ConversationWorkspace>
		</InsightProvider>
	);
});
