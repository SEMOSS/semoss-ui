import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import {
	Button,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { RoomContent, RoomSidebar } from "@/components";
import { RoomAuditLogs } from "@/components/room/RoomAuditLogs"; // NEWLY ADDED IMPORT
import { useChat, useGlobalBreadcrumbs } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { Engine } from "@/types";

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

	/**
	 * State
	 */
	const [room, setRoom] = useState<RoomStore | null>(null);
	const [viewMode, setViewMode] = useState<"room" | "audit_logs">("room"); // NEWLY ADDED STATE
	const selectedModelRef = useRef<Engine>(chat.models.selected);

	/**
	 * Library hooks
	 */
	// set the breadcrumbs
	const { setBreadcrumbs } = useGlobalBreadcrumbs([
		{
			name: "Home",
			path: "/",
		},
		{
			name: room?.metadata?.name || "Room",
			path: `/room/${roomId}`,
		},
	]);

	/**
	 * Effects
	 */
	// keep ref updated
	useEffect(() => {
		selectedModelRef.current = chat.models.selected;
	}, [chat.models.selected]);

	// load the room
	useEffect(() => {
		const loadRoom = async () => {
			try {
				const room = await chat.loadRoom(roomId);

				// update the model based on the room
				if (!room.model) {
					room.setModel(selectedModelRef.current);
				} else {
					chat.setSelectedModel(room.model);
				}

				if (room.options.workspace)
					setBreadcrumbs([
						{
							name: "Home",
							path: "/",
						},
						{
							name: "Workspace",
							path: "/workspace",
						},
						{
							name:
								room.options.workspace?.name ||
								room.options.workspace.workspace_id,
							path: `/workspace/${room.options.workspace.workspace_id}`,
						},
						{
							name: "Room",
							path: `/room/${room.roomId}`,
						},
					]);

				// set the room
				setRoom(room);
			} catch (e) {
				// if it doesn't load successfully, go back to home
				toast.error(e.message);
				navigate("/");
			}
		};

		loadRoom();
	}, [
		roomId,
		navigate,
		chat.loadRoom,
		chat.setSelectedModel,
		setBreadcrumbs,
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
					<ResizablePanel className="flex h-full w-full flex-col overflow-hidden">
						{" "}
						{/* Removed p-2 */}
						<div className="flex flex-shrink-0 justify-start space-x-2 p-2">
							{" "}
							{/* Re-added p-2, removed mb-2 */}
							<Button onClick={() => setViewMode("room")}>
								Room Content
							</Button>
							<Button
								onClick={() => setViewMode("audit_logs")}
								disabled={!roomId}
							>
								Audit Logs
							</Button>
						</div>
						<div className="h-full flex-1 overflow-y-auto p-2">
							{" "}
							{/* Added p-2 */}
							{viewMode === "room" ? (
								<RoomContent room={room} />
							) : (
								<RoomAuditLogs room={room} />
							)}
						</div>
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
