import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { RoomContent, RoomSidebar } from "@/components";
import { useChat } from "@/hooks";
import { RoomStore } from "@/stores";

interface RoomProps {
	/** Room to load */
	roomId: string;
}

/**
 * The page for a room
 *
 * @component
 */
export const Room: React.FC<RoomProps> = observer(({ roomId }) => {
	const { chat } = useChat();
	const insight = useInsight();
	const navigate = useNavigate();

	const [room, setRoom] = useState<RoomStore | null>(null);
	const modelIdRef = useRef<string | null>(null);

	// keep track of the selected model id
	useEffect(() => {
		modelIdRef.current = chat.models?.selected?.app_id || null;
	}, [chat.models?.selected?.app_id]);

	// load the room
	useEffect(() => {
		const loadRoom = async () => {
			try {
				const room = new RoomStore(roomId, insight.insightId);

				// initialize the room
				await room.initialize();

				// set the selected model
				try {
					await chat.setSelectedModelById(room.modelId);
				} catch {
					// model id is invalid
					toast.warning(
						`The model previously selected for this room is no longer available.`,
					);
					room.setModel(modelIdRef.current);
				}

				// set the room
				setRoom(room);
			} catch (e) {
				// if it doesn't load successfully, go back to home
				toast.error(e.message);
				navigate("/");
			}
		};

		// only load the room if the insight is initialized
		if (insight.isInitialized) {
			loadRoom();
		}
	}, [
		roomId,
		insight.isInitialized,
		insight.insightId,
		navigate,
		chat.setSelectedModelById,
	]);

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
	);
});
