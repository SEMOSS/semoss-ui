import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { RoomContent, RoomSidebar } from "@/components";
import { useChat, useGlobalBreadcrumbs } from "@/hooks";
import type { RoomStore } from "@/stores";

/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = observer(() => {
	// set the get the room based on the params
	const { roomId } = useParams();
	const { chat } = useChat();
	const navigate = useNavigate();

	const [room, setRoom] = useState<RoomStore | null>(null);

	// load the room
	useEffect(() => {
		const loadRoom = async () => {
			try {
				const room = await chat.loadRoom(roomId);

				// update the model based on the room
				if (!room.model) {
					room.setModel(chat.models.selected);
				}

				// set the room
				setRoom(room);
			} catch (e) {
				// if it doesn't load successfully, go back to home
				toast.error(e.message);
				navigate("/");
			}
		};

		loadRoom();
	}, [roomId, navigate, chat.loadRoom, chat.models.selected]);

	/**
	 * Effects
	 */
	// set the breadcrumbs
	useGlobalBreadcrumbs([
		{
			name: "Home",
			path: "/",
		},
		{
			name: room?.metadata?.name || "Room",
			path: `/room/${roomId}`,
		},
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
		<InsightProvider key={roomId} options={{ insightId: room.insightId }}>
			<div className="flex h-full w-full flex-col overflow-hidden">
				<ResizablePanelGroup
					direction="horizontal"
					className="w-full flex-1 overflow-hidden"
				>
					<ResizablePanel className="h-full w-full flex-1 overflow-hidden p-2">
						<RoomContent room={room} />
					</ResizablePanel>
					{room.sidebar.isOpen && (
						<>
							<ResizableHandle />
							<ResizablePanel
								className={"relative p-2"}
								defaultSize={70}
							>
								<RoomSidebar room={room} />
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>
			</div>
		</InsightProvider>
	);
});
