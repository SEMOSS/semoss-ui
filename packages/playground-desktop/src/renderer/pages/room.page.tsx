import { useParams } from "react-router";
import { Chat } from "@semoss/chat";
import { SidebarTrigger } from "@semoss/ui/next";

/** The room the route names, composed from the chat's pieces. */
export const RoomPage = () => {
	const { roomId = "" } = useParams();

	return (
		<Chat.Room roomId={roomId}>
			<Chat.Frame
				header={<Chat.Header leading={<SidebarTrigger />} />}
				workbench={<Chat.Workbench />}
			>
				<Chat.FileDrop>
					<Chat.Conversation />
				</Chat.FileDrop>
			</Chat.Frame>
		</Chat.Room>
	);
};
