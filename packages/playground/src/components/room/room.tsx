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
import type { Engine } from "@/types";

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
	const selectedModelRef = useRef<Engine | null>(null);

	// keep track of the selected model
	useEffect(() => {
		selectedModelRef.current = chat.models.selected;
	}, [chat.models.selected]);

	// load the room
	useEffect(() => {
		const loadRoom = async () => {
			try {
				const room = new RoomStore(roomId, insight.insightId);

				// initialize the room
				await room.initialize();

				// update the model based on the room
				if (room.model) {
					chat.setSelectedModel(room.model);
				} else {
					// If no model is set on the room, use the selected model from chat
					room.setModel(selectedModelRef.current);
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
		chat.setSelectedModel,
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
