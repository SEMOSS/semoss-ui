import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { Room, RoomSidebar } from "@/components";
import { useChat, useGlobalBreadcrumbs } from "@/hooks";
import { RoomStore } from "@/stores";

/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = observer(() => {
	const { chat } = useChat();

	const navigate = useNavigate();

	// set the get the room based on the params
	const { roomId } = useParams();

	// create the room
	const room = useMemo(() => {
		if (!roomId) {
			return null;
		}

		return new RoomStore(roomId);
	}, [roomId]);

	/**
	 * Effects
	 */

	// load the room
	useEffect(() => {
		const loadRoom = async () => {
			try {
				await room.initialize();
				try {
					await chat.setSelectedModelById(room.modelId);
				} catch {
					// model id is invalid
					toast.warning(
						`The model previously selected for this room is no longer available.`,
					);
					room.setModel(chat.models?.selected?.app_id);
				}
			} catch (e) {
				// if it doesn't load successfully, go back to home
				toast.error(e.message);
				navigate("/");
			}
		};

		if (!room || room.isInitialized) {
			return;
		} else {
			loadRoom();
		}
	}, [
		room,
		navigate,
		chat.setSelectedModelById,
		chat.models?.selected?.app_id,
	]);

	// set the breadcrumbs
	useGlobalBreadcrumbs([
		{
			name: "Home",
			path: "/",
		},
		{
			name: room?.isInitialized
				? room.metadata.name || "Room"
				: "Loading",
			path: `/room/${roomId}`,
		},
	]);

	if (!room && chat.isInitialized) {
		// if the chat is initialized and there is no room, the room id is invalid - go back to home
		return <Navigate to="/" replace={true} />;
	}

	if (!room || !room.isInitialized) {
		// room is valid, but not initialized yet
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			<ResizablePanelGroup
				direction="horizontal"
				className="w-full flex-1 overflow-hidden"
			>
				<ResizablePanel className="h-full w-full flex-1 overflow-hidden p-2">
					<Room room={room} />
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
	);
});
